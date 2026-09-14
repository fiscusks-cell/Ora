'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { Play, Square, DollarSign, MoreHorizontal, ChevronDown, Tag, X, Check } from 'lucide-react';
import { OriginButton } from '@/components/ui/origin-button';
import { ProjectCombobox } from '@/components/ui/ProjectCombobox';
import { TagCombobox, type TagOption } from '@/components/ui/TagCombobox';
import { useTimerStore } from '@/store/timerStore';
import { ProjectIconOrDot } from '@/components/ui/ProjectIconOrDot';

// ─── types ───────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  hourlyRate: number;
  isBillable: boolean;
  clientName?: string | null;
  client: { id: string; name: string } | null;
}

interface RecentDesc {
  description: string;
  projectName: string;
  projectId: string | null;
  tagIds: string[];
}

interface TimeEntry {
  id: string;
  description: string | null;
  startedAt: string;
  stoppedAt: string | null;
  durationSeconds: number | null;
  isBillable: boolean;
  tags: TagOption[];
  project: {
    id: string;
    name: string;
    color: string;
    icon?: string | null;
    client: { id: string; name: string } | null;
  } | null;
}

type StopResult =
  | { kind: 'stopped'; entry: TimeEntry }
  | { kind: 'gone' }
  | { kind: 'failed' };

interface EntryGroup {
  key: string;
  entries: TimeEntry[];
}
interface DayBucket {
  dateKey: string;
  groups: EntryGroup[];
  total: number;
}
interface WeekBucket {
  weekKey: string;
  start: Date;
  end: Date;
  days: DayBucket[];
  total: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatHM(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function formatHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function parseDuration(s: string): number | null {
  const parts = s.trim().split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.some((n) => isNaN(n) || n < 0)) return null;
  const [h, m, sec = 0] = nums;
  if (m > 59 || sec > 59) return null;
  const total = h * 3600 + m * 60 + sec;
  if (total <= 0) return null;
  return total;
}

function formatTime(dateStr: string): string {
  return format(new Date(dateStr), 'h:mma');
}

function getWeekStart(d: Date, weekStartDay: number): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  const diff = (result.getDay() - weekStartDay + 7) % 7;
  result.setDate(result.getDate() - diff);
  return result;
}

function getWeekEnd(weekStart: Date): Date {
  const result = new Date(weekStart);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

function weekLabel(start: Date, end: Date, weekStartDay: number): string {
  const now = new Date();
  const thisWeekStart = getWeekStart(now, weekStartDay);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  if (start.getTime() === thisWeekStart.getTime()) return 'This week';
  if (start.getTime() === lastWeekStart.getTime()) return 'Last week';
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
}

function collapseToGroups(entries: TimeEntry[]): EntryGroup[] {
  const groups: EntryGroup[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (
      last &&
      (last.entries[0].description ?? null) === (entry.description ?? null) &&
      (last.entries[0].project?.id ?? null) === (entry.project?.id ?? null)
    ) {
      last.entries.push(entry);
    } else {
      groups.push({
        key: `${entry.description ?? ''}|${entry.project?.id ?? ''}|${entry.id}`,
        entries: [entry],
      });
    }
  }
  return groups;
}

function buildWeekBuckets(entries: TimeEntry[], weekStartDay: number): WeekBucket[] {
  const byWeek = new Map<string, { start: Date; entries: TimeEntry[] }>();
  for (const entry of entries) {
    const ws = getWeekStart(new Date(entry.startedAt), weekStartDay);
    const key = ws.toISOString();
    if (!byWeek.has(key)) byWeek.set(key, { start: ws, entries: [] });
    byWeek.get(key)!.entries.push(entry);
  }

  return [...byWeek.values()]
    .sort((a, b) => b.start.getTime() - a.start.getTime())
    .map(({ start, entries: we }) => {
      const end = getWeekEnd(start);
      const byDay = new Map<string, TimeEntry[]>();
      for (const entry of we) {
        const dk = format(new Date(entry.startedAt), 'yyyy-MM-dd');
        if (!byDay.has(dk)) byDay.set(dk, []);
        byDay.get(dk)!.push(entry);
      }
      const days: DayBucket[] = [...byDay.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([dateKey, dayEntries]) => ({
          dateKey,
          groups: collapseToGroups(dayEntries),
          total: dayEntries.reduce((s, e) => s + (e.durationSeconds ?? 0), 0),
        }));
      const total = we.reduce((s, e) => s + (e.durationSeconds ?? 0), 0);
      return { weekKey: start.toISOString(), start, end, days, total };
    });
}

function removeEntryFromWeeks(prev: WeekBucket[], id: string): WeekBucket[] {
  return prev
    .map((week) => {
      const days = week.days
        .map((day) => {
          const groups = day.groups
            .map((g) => ({ ...g, entries: g.entries.filter((e) => e.id !== id) }))
            .filter((g) => g.entries.length > 0);
          const total = groups.reduce(
            (s, g) => s + g.entries.reduce((x, e) => x + (e.durationSeconds ?? 0), 0),
            0,
          );
          return { ...day, groups, total };
        })
        .filter((d) => d.groups.length > 0);
      return { ...week, days, total: days.reduce((s, d) => s + d.total, 0) };
    })
    .filter((w) => w.days.length > 0);
}

/**
 * Splice one entry into the week/day buckets.
 *
 * A week bucket only exists once it holds an entry, so the first entry of a week
 * has to create its week here. Returning early instead dropped it: every stop in
 * a week that had no entries when the page loaded (every Monday, or a tab left
 * open across the week boundary) vanished until refresh.
 *
 * Weeks older than `loadedFrom` are left to "load more", which fetches them and
 * would otherwise append a second bucket with the same key.
 */
function insertEntryIntoWeeks(
  prev: WeekBucket[],
  entry: TimeEntry,
  wsd: number,
  loadedFrom: Date | null,
): WeekBucket[] {
  const ws = getWeekStart(new Date(entry.startedAt), wsd);
  const weekKey = ws.toISOString();
  const dk = format(new Date(entry.startedAt), 'yyyy-MM-dd');

  const weekIdx = prev.findIndex((w) => w.weekKey === weekKey);
  if (weekIdx === -1) {
    if (!loadedFrom || ws < loadedFrom) return prev;
    const seconds = entry.durationSeconds ?? 0;
    const newWeek: WeekBucket = {
      weekKey,
      start: ws,
      end: getWeekEnd(ws),
      days: [{ dateKey: dk, groups: collapseToGroups([entry]), total: seconds }],
      total: seconds,
    };
    return [...prev, newWeek].sort((a, b) => b.start.getTime() - a.start.getTime());
  }

  const week = prev[weekIdx];
  const dayIdx = week.days.findIndex((d) => d.dateKey === dk);

  let updatedDays: DayBucket[];
  if (dayIdx === -1) {
    const newDay: DayBucket = {
      dateKey: dk,
      groups: collapseToGroups([entry]),
      total: entry.durationSeconds ?? 0,
    };
    updatedDays = [...week.days, newDay].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  } else {
    const allDayEntries = [
      ...week.days[dayIdx].groups.flatMap((g) => g.entries),
      entry,
    ].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    updatedDays = week.days.map((d, i) =>
      i === dayIdx
        ? { ...d, groups: collapseToGroups(allDayEntries), total: allDayEntries.reduce((s, e) => s + (e.durationSeconds ?? 0), 0) }
        : d,
    );
  }

  const updatedWeek: WeekBucket = {
    ...week,
    days: updatedDays,
    total: updatedDays.reduce((s, d) => s + d.total, 0),
  };
  return prev.map((w, i) => (i === weekIdx ? updatedWeek : w));
}

function replaceEntryInWeeks(
  prev: WeekBucket[],
  oldEntry: TimeEntry,
  newEntry: TimeEntry,
  wsd: number,
  loadedFrom: Date | null,
): WeekBucket[] {
  return insertEntryIntoWeeks(removeEntryFromWeeks(prev, oldEntry.id), newEntry, wsd, loadedFrom);
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function TimerPage() {
  const { data: session } = useSession();
  const initForUser = useTimerStore((state) => state.initForUser);

  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [entryId, setEntryId] = useState<string | null>(null);

  const storePaused = useTimerStore((state) => state.isPaused);
  const storeStartedAt = useTimerStore((state) => state.startedAt);
  const wasPausedRef = useRef(false);

  // Scope the persisted timer store to the current user. If a different user's
  // session is found in localStorage, wipe it before any timer state is read.
  useEffect(() => {
    const userId = (session?.user as { id?: string })?.id;
    if (userId) initForUser(userId);
  }, [(session?.user as { id?: string })?.id, initForUser]);

  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  // A start or stop that did not land, shown under the bar.
  const [timerError, setTimerError] = useState('');
  // A stop that failed after a newer timer had already started, so the entry
  // could not go back into the bar. It is still running on the server.
  const [strandedStop, setStrandedStop] = useState<{ id: string; description: string } | null>(null);

  const [recentDescs, setRecentDescs] = useState<RecentDesc[]>([]);
  const [showDescs, setShowDescs] = useState(false);
  const [openKebab, setOpenKebab] = useState<string | null>(null);
  const [noProjectError, setNoProjectError] = useState(false);
  const [openProjectCombobox, setOpenProjectCombobox] = useState(false);

  // Entry history
  const [weekStartDay, setWeekStartDay] = useState(1);
  const [weeks, setWeeks] = useState<WeekBucket[]>([]);
  const [oldestLoaded, setOldestLoaded] = useState<Date | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Edit modal
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const editMouseDown = useRef(false);

  // Inline editing — one field open at a time across all rows
  type InlineField = 'description' | 'project' | 'tags' | 'startTime' | 'endTime' | 'duration';
  const [inlineEdit, setInlineEdit] = useState<{ entryId: string; field: InlineField } | null>(null);
  const [inlineDesc, setInlineDesc] = useState('');
  const [inlineProjectId, setInlineProjectId] = useState<string | null>(null);
  const [inlineTagIds, setInlineTagIds] = useState<string[]>([]);
  const [inlineStartTime, setInlineStartTime] = useState('');
  const [inlineEndTime, setInlineEndTime] = useState('');
  const [inlineDuration, setInlineDuration] = useState('');
  const [durationInvalid, setDurationInvalid] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const descSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentDescsCachedRef = useRef(false);
  const hideDescTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start and Stop update the UI before their requests resolve, so a response can
  // arrive after the user has already moved on. Each start opens a numbered
  // session, and a response only touches the bar while its session is active.
  const sessionRef = useRef(0);
  const activeSessionRef = useRef(0);
  // The in-flight POST for the active session, so a Stop pressed before the entry
  // exists can wait for its id.
  const startRequestRef = useRef<Promise<TimeEntry | null> | null>(null);
  // Tag ids the server holds for the running entry. Stop only rewrites tags when
  // the selection differs.
  const serverTagIdsRef = useRef<string[]>([]);
  // The oldest loaded week start, readable from async continuations.
  const oldestLoadedRef = useRef<Date | null>(null);

  // Populate edit form when a new entry is opened for editing
  useEffect(() => {
    if (!editingEntry) return;
    setEditDesc(editingEntry.description ?? '');
    setEditProjectId(editingEntry.project?.id ?? '');
    setEditDate(format(new Date(editingEntry.startedAt), 'yyyy-MM-dd'));
    setEditStartTime(format(new Date(editingEntry.startedAt), 'HH:mm'));
    setEditEndTime(editingEntry.stoppedAt ? format(new Date(editingEntry.stoppedAt), 'HH:mm') : '');
    setEditTagIds(editingEntry.tags.map((t) => t.id));
    setEditError('');
  }, [editingEntry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── data fetching ─────────────────────────────────────────────────────────

  const fetchRange = useCallback(async (from: Date, to: Date): Promise<TimeEntry[]> => {
    const res = await fetch(`/api/time-entries?startDate=${from.toISOString()}&endDate=${to.toISOString()}`);
    if (!res.ok) return [];
    const data: TimeEntry[] = await res.json();
    return data.filter((e) => e.stoppedAt !== null);
  }, []);

  const loadInitialWeeks = useCallback(async (wsd: number) => {
    setLoadingInitial(true);
    try {
      const thisWeekStart = getWeekStart(new Date(), wsd);
      const from = new Date(thisWeekStart);
      from.setDate(from.getDate() - 7);
      const to = getWeekEnd(thisWeekStart);
      const entries = await fetchRange(from, to);
      setWeeks(buildWeekBuckets(entries, wsd));
      setOldestLoaded(from);
      oldestLoadedRef.current = from;
    } finally {
      setLoadingInitial(false);
    }
  }, [fetchRange]);

  const refreshCurrentWeeks = useCallback(async () => {
    const thisWeekStart = getWeekStart(new Date(), weekStartDay);
    const from = new Date(thisWeekStart);
    from.setDate(from.getDate() - 7);
    const to = getWeekEnd(thisWeekStart);
    const entries = await fetchRange(from, to);
    const refreshed = buildWeekBuckets(entries, weekStartDay);
    setWeeks((prev) => {
      const older = prev.filter((w) => w.start < from);
      return [...refreshed, ...older];
    });
  }, [fetchRange, weekStartDay]);

  const loadMoreWeeks = useCallback(async () => {
    if (loadingMore || !hasMore || !oldestLoaded) return;
    setLoadingMore(true);
    try {
      const to = new Date(oldestLoaded);
      to.setDate(to.getDate() - 1);
      to.setHours(23, 59, 59, 999);
      const from = new Date(oldestLoaded);
      from.setDate(from.getDate() - 14);
      const entries = await fetchRange(from, to);
      if (entries.length === 0) { setHasMore(false); return; }
      setWeeks((prev) => [...prev, ...buildWeekBuckets(entries, weekStartDay)]);
      setOldestLoaded(from);
      oldestLoadedRef.current = from;
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, oldestLoaded, fetchRange, weekStartDay]);

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const raw: Array<{ id: string; name: string; color: string; icon?: string | null; hourlyRate: number; isBillable: boolean; client: { id: string; name: string } | null }> = await res.json();
      setProjects(raw.map((p) => ({ ...p, clientName: p.client?.name ?? null })));
    }
  }, []);

  const fetchTags = useCallback(async () => {
    const res = await fetch('/api/tags');
    if (res.ok) setAllTags(await res.json());
  }, []);

  const checkActiveTimer = useCallback(async () => {
    const res = await fetch('/api/time-entries?active=true');
    if (!res.ok) return;
    const data = await res.json();
    const active: TimeEntry | null = Array.isArray(data) ? data[0] ?? null : data ?? null;
    if (active && !active.stoppedAt) {
      const start = new Date(active.startedAt);
      const tagIds = active.tags.map((t) => t.id);
      activeSessionRef.current = ++sessionRef.current;
      startRequestRef.current = null;
      serverTagIdsRef.current = tagIds;
      setEntryId(active.id);
      setStartedAt(start);
      setDescription(active.description ?? '');
      setProjectId(active.project?.id ?? '');
      setIsBillable(active.isBillable);
      setSelectedTagIds(tagIds);
      if (!useTimerStore.getState().isPaused) {
        setIsRunning(true);
        setElapsed(Math.floor((Date.now() - start.getTime()) / 1000));
        useTimerStore.getState().startTimer(active.id, active.project?.id ?? null, active.description ?? '', start);
      }
    } else if (activeSessionRef.current === 0 && useTimerStore.getState().isRunning) {
      // The persisted store starts before the server confirms, so a reload during
      // a start that never landed can leave it claiming a timer the server does
      // not have. The server is the authority.
      useTimerStore.getState().stopTimer();
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      let wsd = 1;
      try {
        const [prefRes] = await Promise.all([
          fetch('/api/user/preferences'),
          fetchProjects(),
          fetchTags(),
          checkActiveTimer(),
        ]);
        const d = await prefRes.json();
        if (typeof d.weekStartDay === 'number') wsd = d.weekStartDay;
      } catch { /* use default */ }
      if (!mounted) return;
      setWeekStartDay(wsd);
      await loadInitialWeeks(wsd);
    }
    init();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── timer tick ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (isRunning && startedAt) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, startedAt]);

  // ── store pause/resume sync ───────────────────────────────────────────────

  useEffect(() => {
    if (storePaused) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setElapsed(36000);
      setIsRunning(false);
      wasPausedRef.current = true;
    }
  }, [storePaused]);

  useEffect(() => {
    if (!storePaused && wasPausedRef.current && storeStartedAt) {
      wasPausedRef.current = false;
      setStartedAt(new Date(storeStartedAt));
      setIsRunning(true);
    }
  }, [storePaused, storeStartedAt]);

  // ── start / stop ──────────────────────────────────────────────────────────

  const handleStart = useCallback(async (opts?: {
    projectId?: string;
    description?: string;
    isBillable?: boolean;
    tagIds?: string[];
  }) => {
    if (isRunning) return;
    // Project guard fires before anything is set
    if (!opts && !projectId) {
      setNoProjectError(true);
      setOpenProjectCombobox(true);
      return;
    }
    setNoProjectError(false);
    setOpenProjectCombobox(false);
    setTimerError('');

    const pid = opts?.projectId !== undefined ? opts.projectId : projectId;
    const desc = opts?.description !== undefined ? opts.description : description;
    const billable = opts?.isBillable !== undefined ? opts.isBillable : isBillable;
    const tagIds = opts?.tagIds !== undefined ? opts.tagIds : selectedTagIds;
    const now = new Date();
    const session = ++sessionRef.current;
    activeSessionRef.current = session;

    // Optimistic: the bar, the sidebar and the tab title all start now, before the
    // round trip. The server records its own start time; `now` is only what the
    // counter shows until that arrives.
    setEntryId(null);
    setStartedAt(now);
    setIsRunning(true);
    setElapsed(0);
    if (opts?.projectId !== undefined) setProjectId(opts.projectId);
    if (opts?.description !== undefined) setDescription(opts.description);
    if (opts?.isBillable !== undefined) setIsBillable(opts.isBillable);
    if (opts?.tagIds !== undefined) setSelectedTagIds(opts.tagIds);
    serverTagIdsRef.current = [];
    useTimerStore.getState().startTimer(null, pid || null, desc ?? '', now);

    const request = (async (): Promise<TimeEntry | null> => {
      try {
        const res = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: desc || undefined,
            projectId: pid || undefined,
            isBillable: billable,
            tagIds: tagIds.length > 0 ? tagIds : undefined,
          }),
        });
        return res.ok ? ((await res.json()) as TimeEntry) : null;
      } catch {
        return null;
      }
    })();
    startRequestRef.current = request;

    const entry = await request;
    // Stopped or restarted while the request was in flight: whoever did that now
    // owns this entry, so leave the bar alone.
    if (activeSessionRef.current !== session) return;

    if (!entry) {
      activeSessionRef.current = 0;
      startRequestRef.current = null;
      setIsRunning(false);
      setStartedAt(null);
      setElapsed(0);
      useTimerStore.getState().stopTimer();
      setTimerError('The timer could not be started. Check your connection and try again.');
      return;
    }

    setEntryId(entry.id);
    serverTagIdsRef.current = entry.tags.map((t) => t.id);
    // The server's start is authoritative. Move the counter onto it when it
    // differs meaningfully from the click — a skewed browser clock or a slow
    // request — and leave sub-2s differences alone so the counter doesn't jump.
    const serverStart = new Date(entry.startedAt);
    const reconciled = Math.abs(serverStart.getTime() - now.getTime()) > 2000;
    if (reconciled) setStartedAt(serverStart);
    useTimerStore.getState().confirmStart(entry.id, reconciled ? serverStart : now);
  }, [isRunning, description, projectId, isBillable, selectedTagIds]);

  // Send a server-clocked stop, retried briefly so a dropped request doesn't leave
  // the entry running. The server keeps the first stop it records, so retrying
  // after a lost response is harmless; a retry after a request that never arrived
  // records the stop up to ~4s late.
  const sendStop = useCallback(async (id: string, body: Record<string, unknown>): Promise<StopResult> => {
    for (const delay of [0, 1000, 3000]) {
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        const res = await fetch(`/api/time-entries/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) return { kind: 'stopped', entry: (await res.json()) as TimeEntry };
        if (res.status === 404) return { kind: 'gone' };
        if (res.status >= 400 && res.status < 500) return { kind: 'failed' };
      } catch {
        // network failure — try again
      }
    }
    return { kind: 'failed' };
  }, []);

  const handleStop = useCallback(async () => {
    if (!isRunning || !startedAt) return;

    const session = activeSessionRef.current;
    const snapshot = {
      entryId,
      startedAt,
      description,
      projectId,
      isBillable,
      tagIds: selectedTagIds,
      serverTagIds: serverTagIdsRef.current,
      startRequest: startRequestRef.current,
    };
    activeSessionRef.current = 0;
    startRequestRef.current = null;
    if (descSaveTimer.current) {
      clearTimeout(descSaveTimer.current);
      descSaveTimer.current = null;
    }

    // Optimistic: the row appears and the bar resets now. The row's stop time and
    // duration are placeholders until the server's arrive.
    const stoppedAtGuess = new Date();
    const project = projects.find((p) => p.id === snapshot.projectId) ?? null;
    const placeholderId = snapshot.entryId ?? `pending-${session || Date.now()}`;
    const optimistic: TimeEntry = {
      id: placeholderId,
      description: snapshot.description || null,
      startedAt: snapshot.startedAt.toISOString(),
      stoppedAt: stoppedAtGuess.toISOString(),
      durationSeconds: Math.max(0, Math.floor((stoppedAtGuess.getTime() - snapshot.startedAt.getTime()) / 1000)),
      isBillable: snapshot.isBillable,
      tags: allTags.filter((t) => snapshot.tagIds.includes(t.id)),
      project: project
        ? { id: project.id, name: project.name, color: project.color, icon: project.icon ?? null, client: project.client }
        : null,
    };

    setIsRunning(false);
    setStartedAt(null);
    setEntryId(null);
    setElapsed(0);
    setDescription('');
    setProjectId('');
    setSelectedTagIds([]);
    setTimerError('');
    useTimerStore.getState().stopTimer();
    setWeeks((prev) => insertEntryIntoWeeks(prev, optimistic, weekStartDay, oldestLoadedRef.current));
    recentDescsCachedRef.current = false;

    // A Stop pressed before the start request resolved has no id yet: wait for it.
    let id = snapshot.entryId;
    let serverTagIds = snapshot.serverTagIds;
    if (!id) {
      const created = await snapshot.startRequest;
      if (!created) {
        // The start never landed, so there is nothing on the server to stop.
        setWeeks((prev) => removeEntryFromWeeks(prev, placeholderId));
        return;
      }
      id = created.id;
      serverTagIds = created.tags.map((t) => t.id);
    }

    // The description may have been typed after the last debounced save, so it
    // rides along with the stop. Tags are rewritten only when they changed.
    const body: Record<string, unknown> = { stop: 'now', description: snapshot.description || null };
    if (!sameIds(snapshot.tagIds, serverTagIds)) body.tagIds = snapshot.tagIds;

    const result = await sendStop(id, body);

    if (result.kind === 'stopped') {
      setWeeks((prev) => replaceEntryInWeeks(prev, optimistic, result.entry, weekStartDay, oldestLoadedRef.current));
      return;
    }

    setWeeks((prev) => removeEntryFromWeeks(prev, placeholderId));

    if (result.kind === 'gone') {
      setTimerError('That timer no longer exists. It may have been deleted in another tab.');
      return;
    }

    // The stop did not land, so the entry is still running on the server.
    if (activeSessionRef.current === 0) {
      // Nothing has started since: put the running timer back exactly as it was.
      activeSessionRef.current = ++sessionRef.current;
      serverTagIdsRef.current = serverTagIds;
      setEntryId(id);
      setStartedAt(snapshot.startedAt);
      setElapsed(Math.max(0, Math.floor((Date.now() - snapshot.startedAt.getTime()) / 1000)));
      setDescription(snapshot.description);
      setProjectId(snapshot.projectId);
      setIsBillable(snapshot.isBillable);
      setSelectedTagIds(snapshot.tagIds);
      setIsRunning(true);
      useTimerStore.getState().startTimer(id, snapshot.projectId || null, snapshot.description, snapshot.startedAt);
      setTimerError('The timer could not be stopped and is still running. Press Stop again.');
    } else {
      // A newer timer already occupies the bar, so this one cannot go back into it.
      setStrandedStop({ id, description: snapshot.description });
    }
  }, [isRunning, startedAt, entryId, description, projectId, isBillable, selectedTagIds, projects, allTags, weekStartDay, sendStop]);

  const retryStrandedStop = useCallback(async () => {
    if (!strandedStop) return;
    const result = await sendStop(strandedStop.id, { stop: 'now' });
    if (result.kind === 'stopped') {
      setWeeks((prev) => replaceEntryInWeeks(prev, result.entry, result.entry, weekStartDay, oldestLoadedRef.current));
      setStrandedStop(null);
    } else if (result.kind === 'gone') {
      setStrandedStop(null);
    }
  }, [strandedStop, sendStop, weekStartDay]);

  const handlePlay = useCallback((entry: TimeEntry) => {
    handleStart({
      projectId: entry.project?.id ?? '',
      description: entry.description ?? '',
      isBillable: entry.isBillable,
      tagIds: entry.tags.map((t) => t.id),
    });
  }, [handleStart]);

  const handleDuplicate = async (entry: TimeEntry) => {
    const res = await fetch('/api/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: entry.description ?? undefined,
        projectId: entry.project?.id ?? undefined,
        isBillable: entry.isBillable,
        startedAt: entry.startedAt,       // original timestamp, not now()
        stoppedAt: entry.stoppedAt ?? undefined, // original timestamp, not now()
        tagIds: entry.tags.map((t) => t.id),
      }),
    });
    if (!res.ok) return;
    const created: TimeEntry = await res.json();
    setWeeks((prev) => insertEntryIntoWeeks(prev, created, weekStartDay, oldestLoadedRef.current));
  };

  const handleEditSave = async () => {
    if (!editingEntry || !editDate || !editStartTime || !editEndTime) return;

    // local-time construction: no Z suffix → parsed as local time → round-trip stable
    const startedAt = new Date(`${editDate}T${editStartTime}:00`);
    let stoppedAt = new Date(`${editDate}T${editEndTime}:00`);

    if (stoppedAt <= startedAt) {
      // End time is the next calendar day (entry crosses midnight)
      stoppedAt = new Date(stoppedAt.getTime() + 24 * 60 * 60 * 1000);
    }

    if (stoppedAt.getTime() - startedAt.getTime() > 24 * 60 * 60 * 1000) {
      setEditError('Entry duration cannot exceed 24 hours');
      return;
    }

    setEditError('');
    setEditSaving(true);
    try {
      const res = await fetch(`/api/time-entries/${editingEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDesc || null,
          projectId: editProjectId || null,
          startedAt: startedAt.toISOString(),
          stoppedAt: stoppedAt.toISOString(),
          tagIds: editTagIds,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setEditError(d.error ?? 'Save failed');
        return;
      }
      const updated: TimeEntry = await res.json();
      setWeeks((prev) => replaceEntryInWeeks(prev, editingEntry, updated, weekStartDay, oldestLoadedRef.current));
      setEditingEntry(null);
    } finally {
      setEditSaving(false);
    }
  };

  // Fires a PATCH for a single field and updates the local weeks state on success.
  // Callers are responsible for closing the inline edit (setInlineEdit(null)) before
  // or after calling this — they know whether to stay open on failure.
  const saveInlineField = async (
    entry: TimeEntry,
    patch: {
      description?: string | null;
      projectId?: string | null;
      tagIds?: string[];
      startedAt?: string;
      stoppedAt?: string;
    },
  ) => {
    try {
      const res = await fetch(`/api/time-entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const updated: TimeEntry = await res.json();
        setWeeks((prev) => replaceEntryInWeeks(prev, entry, updated, weekStartDay, oldestLoadedRef.current));
      }
    } catch { /* silent revert — row shows original value */ }
  };

  // ── space bar toggle ──────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;
      if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        if (isRunning) handleStop();
        else handleStart();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isRunning, handleStart, handleStop]);

  // ── delete entry ─────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this time entry?')) return;
    await fetch(`/api/time-entries/${id}`, { method: 'DELETE' });
    setWeeks((prev) => removeEntryFromWeeks(prev, id));
  };

  // ── description real-time save ────────────────────────────────────────────

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (isRunning && entryId) {
      if (descSaveTimer.current) clearTimeout(descSaveTimer.current);
      descSaveTimer.current = setTimeout(() => {
        fetch(`/api/time-entries/${entryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: val || null }),
        });
      }, 800);
    }
  };

  // ── recent descriptions dropdown ──────────────────────────────────────────

  const handleDescFocus = async () => {
    if (recentDescsCachedRef.current) {
      if (recentDescs.length > 0) setShowDescs(true);
      return;
    }
    const res = await fetch('/api/time-entries');
    if (!res.ok) return;
    const entries: TimeEntry[] = await res.json();
    const seen = new Set<string>();
    const unique: RecentDesc[] = [];
    for (const e of entries) {
      if (e.description && e.stoppedAt && !seen.has(e.description) && unique.length < 10) {
        seen.add(e.description);
        unique.push({
          description: e.description,
          projectName: e.project?.name ?? '',
          projectId: e.project?.id ?? null,
          tagIds: e.tags.map((t) => t.id),
        });
      }
    }
    recentDescsCachedRef.current = true;
    setRecentDescs(unique);
    if (unique.length > 0) setShowDescs(true);
  };

  const handleCreateTag = useCallback(async (name: string): Promise<TagOption> => {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create tag');
    const tag: TagOption = await res.json();
    setAllTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
    return tag;
  }, []);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── computed ──────────────────────────────────────────────────────────────

  const selectedProject = projects.find((p) => p.id === projectId);
  const hasAnyEntries = weeks.some((w) => w.days.length > 0);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-6" onClick={() => setOpenKebab(null)}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl px-5 py-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* ── Description ─ 50% at sm+ ─────────────────────────────────── */}
        <div className="relative w-full sm:min-w-0 sm:[flex:2_1_0%]">
          <input
            ref={descriptionRef}
            type="text"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            onFocus={() => {
              if (hideDescTimer.current) { clearTimeout(hideDescTimer.current); hideDescTimer.current = null; }
              handleDescFocus();
            }}
            onBlur={() => { hideDescTimer.current = setTimeout(() => setShowDescs(false), 150); }}
            className="w-full bg-transparent text-base focus:outline-none"
            style={{ color: 'var(--text)' }}
          />
          {showDescs && recentDescs.length > 0 && (
            <div
              className="absolute z-20 top-full left-0 w-full mt-1 rounded-xl shadow-lg overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs px-3 pt-2 pb-1" style={{ color: 'var(--text-muted)' }}>Recent</p>
              {recentDescs.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDescription(item.description);
                    handleDescriptionChange(item.description);
                    if (item.projectId) setProjectId(item.projectId);
                    if (item.tagIds.length > 0) setSelectedTagIds(item.tagIds);
                    setShowDescs(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-baseline gap-1.5 min-w-0"
                >
                  <span className="text-sm truncate" style={{ color: 'var(--text)' }}>{item.description}</span>
                  {item.projectName && (
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      — {item.projectName}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Project + Tags ─ 25% at sm+ ──────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 flex-1 min-w-0 sm:[flex:1_1_0%]">
          <ProjectCombobox
            projects={projects}
            value={projectId || null}
            onChange={(id) => { setProjectId(id ?? ''); setNoProjectError(false); setOpenProjectCombobox(false); }}
            disabled={isRunning}
            placeholder="No project"
            forceOpen={openProjectCombobox}
          />
          <TagCombobox
            tags={allTags}
            selectedIds={selectedTagIds}
            onChange={setSelectedTagIds}
            onCreateTag={handleCreateTag}
            disabled={isRunning && !entryId}
          />
          {noProjectError && (
            <p className="w-full text-xs" style={{ color: 'var(--error)' }}>
              Choose a project to start tracking
            </p>
          )}
        </div>

        {/* ── Controls ─ 25% at sm+ ────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0 sm:[flex:1_1_0%] sm:justify-end">
          <button
            type="button"
            onClick={() => { if (!isRunning) setIsBillable((b) => !b); }}
            disabled={isRunning}
            className="p-1.5 rounded transition-colors hover:bg-white/5 disabled:cursor-not-allowed"
            title={isBillable ? 'Billable' : 'Not billable'}
          >
            <DollarSign
              className="w-4 h-4"
              style={{ color: isBillable ? 'var(--accent)' : 'var(--text-muted)' }}
            />
          </button>

          <span
            className="text-2xl tabular-nums tracking-tight select-none"
            style={{ color: storePaused ? '#f59e0b' : isRunning ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {formatElapsed(elapsed)}
          </span>

          <OriginButton
            onClick={isRunning ? handleStop : () => handleStart()}
            disabled={storePaused}
            className="px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex-shrink-0"
            style={{
              background: storePaused ? 'rgba(245,158,11,0.15)' : isRunning ? 'var(--error)' : 'var(--accent)',
              color: storePaused ? '#f59e0b' : 'white',
            }}
          >
            {storePaused ? 'Paused' : isRunning ? <><Square className="w-3.5 h-3.5" />Stop</> : <><Play className="w-3.5 h-3.5" />Start</>}
          </OriginButton>
        </div>
      </div>

      {timerError && (
        <p role="alert" className="text-xs -mt-4" style={{ color: 'var(--error)' }}>
          {timerError}
        </p>
      )}

      {strandedStop && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-4 py-2.5 text-sm -mt-2"
          style={{ border: '1px solid var(--error)', color: 'var(--text)' }}
        >
          <span>
            {strandedStop.description ? `“${strandedStop.description}”` : 'An earlier timer'} is still
            running on the server because its stop did not go through. Stopping it now records the current time.
          </span>
          <button type="button" onClick={retryStrandedStop} className="underline" style={{ color: 'var(--error)' }}>
            Stop it now
          </button>
        </div>
      )}

      {/* ── Entry list ───────────────────────────────────────────────────── */}
      {loadingInitial ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
      ) : !hasAnyEntries ? (
        <p className="text-center text-sm py-12" style={{ color: 'var(--text-muted)' }}>No entries yet.</p>
      ) : (
        <div className="space-y-4">
          {weeks.map((week) =>
            week.days.length === 0 ? null : (
              <div
                key={week.weekKey}
                className="rounded-xl"
                style={{ border: '1px solid var(--border)' }}
              >
                {/* Week header — rounded-t-xl clips its background at the top corners */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 rounded-t-xl overflow-hidden"
                  style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}
                >
                  {/* Computed at render: a label stored at load goes stale when the page
                      stays open across a week boundary, giving two "This week" headers. */}
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {weekLabel(week.start, week.end, weekStartDay)}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>{formatHM(week.total)}</span>
                </div>

                {/* Days */}
                {week.days.map((day, di) => (
                  <div key={day.dateKey}>
                    {/* Day header */}
                    <div
                      className="flex items-center justify-between px-4 py-2"
                      style={{
                        background: 'var(--surface)',
                        borderBottom: '1px solid var(--border)',
                        ...(di > 0 ? { borderTop: '1px solid var(--border)' } : {}),
                      }}
                    >
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {format(new Date(day.dateKey + 'T12:00:00'), 'EEE, MMM d')}
                      </span>
                      <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>{formatHM(day.total)}</span>
                    </div>

                    {/* Entry groups */}
                    {day.groups.map((group, gi) => {
                      const isExpanded = expandedGroups.has(group.key);
                      const isMulti = group.entries.length > 1;
                      const visibleEntries = isMulti && !isExpanded ? [group.entries[0]] : group.entries;
                      const groupTotal = group.entries.reduce((s, e) => s + (e.durationSeconds ?? 0), 0);
                      const notLastGroup = gi < day.groups.length - 1;

                      return (
                        <div key={group.key}>
                          {visibleEntries.map((entry, ei) => {
                            const seconds = entry.durationSeconds ?? 0;
                            const isLastVisible = ei === visibleEntries.length - 1;
                            return (
                              <div
                                key={entry.id}
                                className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
                                style={isLastVisible && notLastGroup ? { borderBottom: '1px solid var(--border)' } : undefined}
                              >
                                {/* Description — click to edit inline */}
                                {inlineEdit?.entryId === entry.id && inlineEdit.field === 'description' ? (
                                  <input
                                    type="text"
                                    autoFocus
                                    className="flex-1 text-base min-w-0 rounded px-2 py-0.5 focus:outline-none focus:ring-1"
                                    style={{
                                      background: 'var(--surface-raised)',
                                      border: '1px solid var(--accent)',
                                      color: 'var(--text)',
                                      '--tw-ring-color': 'var(--accent)',
                                    } as React.CSSProperties}
                                    value={inlineDesc}
                                    onChange={(e) => setInlineDesc(e.target.value)}
                                    onBlur={() => { setInlineEdit(null); saveInlineField(entry, { description: inlineDesc || null }); }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') { setInlineEdit(null); saveInlineField(entry, { description: inlineDesc || null }); }
                                      if (e.key === 'Escape') { e.stopPropagation(); setInlineEdit(null); }
                                      if (e.key === ' ') e.stopPropagation();
                                    }}
                                  />
                                ) : (
                                  <span
                                    className="flex-1 text-base truncate min-w-0 cursor-text rounded-sm px-1 -mx-1 hover:bg-white/5 transition-colors"
                                    style={{ color: entry.description ? 'var(--text)' : 'var(--text-muted)' }}
                                    onClick={() => { setOpenKebab(null); setInlineEdit({ entryId: entry.id, field: 'description' }); setInlineDesc(entry.description ?? ''); }}
                                  >
                                    {entry.description ?? <span style={{ fontStyle: 'italic' }}>Add description…</span>}
                                  </span>
                                )}

                                {/* Count badge (first row of multi-group only) */}
                                {isMulti && ei === 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleGroup(group.key); }}
                                    className="flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-colors hover:bg-white/10"
                                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                    aria-label={isExpanded ? 'Collapse' : `Expand ${group.entries.length} entries`}
                                  >
                                    {!isExpanded && <span>×{group.entries.length}</span>}
                                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                )}

                                {/* Project — click to edit inline */}
                                {inlineEdit?.entryId === entry.id && inlineEdit.field === 'project' ? (
                                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <ProjectCombobox
                                      projects={projects}
                                      value={inlineProjectId}
                                      onChange={(id) => { setInlineProjectId(id); saveInlineField(entry, { projectId: id }); }}
                                      onClose={() => setInlineEdit(null)}
                                      placeholder="No project"
                                    />
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="group/proj flex items-center gap-1.5 flex-shrink-0 rounded-sm px-1 -mx-1 hover:bg-white/5 transition-colors"
                                    onClick={() => { setOpenKebab(null); setInlineEdit({ entryId: entry.id, field: 'project' }); setInlineProjectId(entry.project?.id ?? null); }}
                                    title="Click to change project"
                                  >
                                    {entry.project ? (
                                      <>
                                        <ProjectIconOrDot icon={entry.project.icon} color={entry.project.color} size={20} dotClassName="w-2 h-2" />
                                        <span className="text-sm flex-shrink-0 max-w-[120px] truncate" style={{ color: entry.project.color }}>
                                          {entry.project.name}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="opacity-0 group-hover/proj:opacity-100 text-xs transition-opacity" style={{ color: 'var(--text-muted)' }}>
                                        + project
                                      </span>
                                    )}
                                  </button>
                                )}

                                {/* Client — read-only, hidden while project combobox is open */}
                                {!(inlineEdit?.entryId === entry.id && inlineEdit.field === 'project') && entry.project?.client && (
                                  <span className="text-xs flex-shrink-0 hidden md:block" style={{ color: 'var(--text-muted)' }}>
                                    — {entry.project.client.name}
                                  </span>
                                )}

                                {/* Tags — click to edit inline */}
                                {inlineEdit?.entryId === entry.id && inlineEdit.field === 'tags' ? (
                                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <TagCombobox
                                      tags={allTags}
                                      selectedIds={inlineTagIds}
                                      onChange={setInlineTagIds}
                                      onCreateTag={handleCreateTag}
                                    />
                                    <button
                                      onClick={() => { const ids = inlineTagIds; setInlineEdit(null); saveInlineField(entry, { tagIds: ids }); }}
                                      className="flex-shrink-0 p-1 rounded transition-colors hover:bg-white/10"
                                      style={{ color: 'var(--accent)' }}
                                      title="Save tags"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setInlineEdit(null)}
                                      className="flex-shrink-0 p-1 rounded transition-colors hover:bg-white/10"
                                      style={{ color: 'var(--text-muted)' }}
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="group/tags flex items-center gap-1 flex-shrink-0 hidden sm:flex rounded-sm px-1 -mx-1 hover:bg-white/5 transition-colors"
                                    onClick={() => { setOpenKebab(null); setInlineEdit({ entryId: entry.id, field: 'tags' }); setInlineTagIds(entry.tags.map((t) => t.id)); }}
                                    title="Click to edit tags"
                                  >
                                    {entry.tags.length > 0 ? (
                                      entry.tags.map((tag) => (
                                        <span
                                          key={tag.id}
                                          className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                                          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                                        >
                                          <Tag className="w-2.5 h-2.5 inline mr-0.5 -mt-px" />
                                          {tag.name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="opacity-0 group-hover/tags:opacity-100 text-xs transition-opacity" style={{ color: 'var(--text-muted)' }}>
                                        + tag
                                      </span>
                                    )}
                                  </button>
                                )}

                                {/* Billable */}
                                {entry.isBillable && (
                                  <DollarSign className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                                )}

                                {/* Time range — start and end time independently editable */}
                                <span className="text-xs flex-shrink-0 hidden sm:flex items-center gap-0.5" style={{ color: 'var(--text-secondary)' }}>
                                  {inlineEdit?.entryId === entry.id && inlineEdit.field === 'startTime' ? (
                                    <input
                                      type="time"
                                      autoFocus
                                      className="w-24 text-xs rounded px-1 py-0.5 focus:outline-none"
                                      style={{ background: 'var(--surface-raised)', border: '1px solid var(--accent)', color: 'var(--text)' }}
                                      value={inlineStartTime}
                                      onChange={(e) => setInlineStartTime(e.target.value)}
                                      onBlur={() => {
                                        const date = format(new Date(entry.startedAt), 'yyyy-MM-dd');
                                        const startedAt = new Date(`${date}T${inlineStartTime}:00`).toISOString();
                                        setInlineEdit(null);
                                        saveInlineField(entry, { startedAt });
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const date = format(new Date(entry.startedAt), 'yyyy-MM-dd');
                                          const startedAt = new Date(`${date}T${inlineStartTime}:00`).toISOString();
                                          setInlineEdit(null);
                                          saveInlineField(entry, { startedAt });
                                        }
                                        if (e.key === 'Escape') { e.stopPropagation(); setInlineEdit(null); }
                                      }}
                                    />
                                  ) : (
                                    <span
                                      className="cursor-pointer rounded-sm px-0.5 hover:bg-white/5 transition-colors"
                                      onClick={() => { setOpenKebab(null); setInlineEdit({ entryId: entry.id, field: 'startTime' }); setInlineStartTime(format(new Date(entry.startedAt), 'HH:mm')); }}
                                    >
                                      {formatTime(entry.startedAt)}
                                    </span>
                                  )}
                                  {entry.stoppedAt && (
                                    <>
                                      <span className="mx-0.5">–</span>
                                      {inlineEdit?.entryId === entry.id && inlineEdit.field === 'endTime' ? (
                                        <input
                                          type="time"
                                          autoFocus
                                          className="w-24 text-xs rounded px-1 py-0.5 focus:outline-none"
                                          style={{ background: 'var(--surface-raised)', border: '1px solid var(--accent)', color: 'var(--text)' }}
                                          value={inlineEndTime}
                                          onChange={(e) => setInlineEndTime(e.target.value)}
                                          onBlur={() => {
                                            const origin = new Date(entry.startedAt);
                                            const date = format(origin, 'yyyy-MM-dd');
                                            let stoppedAt = new Date(`${date}T${inlineEndTime}:00`);
                                            if (stoppedAt <= origin) stoppedAt = new Date(stoppedAt.getTime() + 86400000);
                                            setInlineEdit(null);
                                            saveInlineField(entry, { stoppedAt: stoppedAt.toISOString() });
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const origin = new Date(entry.startedAt);
                                              const date = format(origin, 'yyyy-MM-dd');
                                              let stoppedAt = new Date(`${date}T${inlineEndTime}:00`);
                                              if (stoppedAt <= origin) stoppedAt = new Date(stoppedAt.getTime() + 86400000);
                                              setInlineEdit(null);
                                              saveInlineField(entry, { stoppedAt: stoppedAt.toISOString() });
                                            }
                                            if (e.key === 'Escape') { e.stopPropagation(); setInlineEdit(null); }
                                          }}
                                        />
                                      ) : (
                                        <span
                                          className="cursor-pointer rounded-sm px-0.5 hover:bg-white/5 transition-colors"
                                          onClick={() => { setOpenKebab(null); setInlineEdit({ entryId: entry.id, field: 'endTime' }); setInlineEndTime(format(new Date(entry.stoppedAt!), 'HH:mm')); }}
                                        >
                                          {formatTime(entry.stoppedAt)}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </span>

                                {/* Duration — group total is read-only; individual entries are click-to-edit */}
                                {(isMulti && !isExpanded) ? (
                                  <span className="text-base tabular-nums flex-shrink-0" style={{ color: 'var(--text)' }}>
                                    {formatHM(groupTotal)}
                                  </span>
                                ) : inlineEdit?.entryId === entry.id && inlineEdit.field === 'duration' ? (
                                  <input
                                    type="text"
                                    autoFocus
                                    className="w-20 text-base tabular-nums rounded px-1 py-0.5 flex-shrink-0 focus:outline-none"
                                    style={{
                                      background: 'var(--surface-raised)',
                                      border: `1px solid ${durationInvalid ? 'var(--error)' : 'var(--accent)'}`,
                                      color: 'var(--text)',
                                    }}
                                    value={inlineDuration}
                                    onChange={(e) => { setInlineDuration(e.target.value); setDurationInvalid(false); }}
                                    onBlur={() => {
                                      const parsed = parseDuration(inlineDuration);
                                      setInlineEdit(null);
                                      setDurationInvalid(false);
                                      if (parsed !== null) {
                                        const newStoppedAt = new Date(new Date(entry.startedAt).getTime() + parsed * 1000).toISOString();
                                        saveInlineField(entry, { stoppedAt: newStoppedAt });
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const parsed = parseDuration(inlineDuration);
                                        if (parsed !== null) {
                                          const newStoppedAt = new Date(new Date(entry.startedAt).getTime() + parsed * 1000).toISOString();
                                          setInlineEdit(null);
                                          setDurationInvalid(false);
                                          saveInlineField(entry, { stoppedAt: newStoppedAt });
                                        } else {
                                          setDurationInvalid(true);
                                        }
                                      }
                                      if (e.key === 'Escape') { e.stopPropagation(); setInlineEdit(null); setDurationInvalid(false); }
                                      if (e.key === ' ') e.stopPropagation();
                                    }}
                                  />
                                ) : (
                                  <span
                                    className="text-base tabular-nums flex-shrink-0 cursor-text rounded-sm px-0.5 -mx-0.5 hover:bg-white/5 transition-colors"
                                    style={{ color: 'var(--text)' }}
                                    onClick={() => { setOpenKebab(null); setInlineEdit({ entryId: entry.id, field: 'duration' }); setInlineDuration(formatHMS(seconds)); setDurationInvalid(false); }}
                                    title="Click to edit duration"
                                  >
                                    {formatHM(seconds)}
                                  </span>
                                )}

                                {/* Play */}
                                <button
                                  onClick={() => handlePlay(entry)}
                                  disabled={isRunning}
                                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 -m-1 transition-opacity disabled:cursor-not-allowed"
                                  style={{ color: 'var(--text-muted)' }}
                                  onMouseEnter={(e) => { if (!isRunning) e.currentTarget.style.color = 'var(--accent)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                  aria-label="Restart this entry"
                                >
                                  <Play className="w-5 h-5" />
                                </button>

                                {/* Kebab */}
                                <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => setOpenKebab(openKebab === entry.id ? null : entry.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                                    style={{ color: 'var(--text-muted)' }}
                                    aria-label="Entry options"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                  {openKebab === entry.id && (
                                    <div
                                      className="absolute right-0 bottom-full mb-1 w-36 rounded-lg shadow-lg py-1 z-30"
                                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                    >
                                      <button
                                        onClick={() => { setEditingEntry(entry); setOpenKebab(null); }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                                        style={{ color: 'var(--text)' }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => { handleDuplicate(entry); setOpenKebab(null); }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                                        style={{ color: 'var(--text)' }}
                                      >
                                        Duplicate
                                      </button>
                                      <div style={{ borderTop: '1px solid var(--border)', margin: '2px 0' }} />
                                      <button
                                        onClick={() => { handleDelete(entry.id); setOpenKebab(null); }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                                        style={{ color: 'var(--error)' }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ),
          )}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={loadMoreWeeks}
              disabled={loadingMore}
              className="w-full py-3 text-sm rounded-xl transition-colors disabled:opacity-50"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              {loadingMore ? 'Loading…' : 'Load older entries'}
            </button>
          )}
        </div>
      )}

      {/* ── Edit modal ───────────────────────────────────────────────────── */}
      {editingEntry && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onMouseDown={(e) => { editMouseDown.current = e.target === e.currentTarget; }}
          onClick={(e) => { if (e.target === e.currentTarget && editMouseDown.current) setEditingEntry(null); }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-normal" style={{ color: 'var(--text)' }}>Edit entry</h2>
              <button onClick={() => setEditingEntry(null)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                  placeholder="What were you working on?"
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Project</label>
                <ProjectCombobox
                  projects={projects}
                  value={editProjectId || null}
                  onChange={(id) => setEditProjectId(id ?? '')}
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tags</label>
                <TagCombobox
                  tags={allTags}
                  selectedIds={editTagIds}
                  onChange={setEditTagIds}
                  onCreateTag={handleCreateTag}
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Start</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    End
                    {editEndTime && editStartTime && new Date(`${editDate}T${editEndTime}:00`) <= new Date(`${editDate}T${editStartTime}:00`) && (
                      <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>(+1 day)</span>
                    )}
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                  />
                </div>
              </div>

              {editError && <p className="text-sm" style={{ color: 'var(--error)' }}>{editError}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingEntry(null)}
                className="flex-1 py-2.5 rounded-lg text-sm transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editDate || !editStartTime || !editEndTime}
                className="flex-1 text-white py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--accent)' }}
              >
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
