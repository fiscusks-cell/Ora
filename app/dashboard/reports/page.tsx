'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
  eachDayOfInterval,
  parseISO,
} from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Download,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getCurrency } from '@/lib/currency';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TimeEntry {
  id: string;
  userId: string;
  projectId: string | null;
  description: string | null;
  startedAt: string;
  stoppedAt: string | null;
  durationSeconds: number | null;
  isBillable: boolean;
  project: {
    id: string;
    name: string;
    color: string;
    hourlyRate: string | number;
    isBillable: boolean;
    client: { id: string; name: string; currency: string } | null;
  } | null;
  user: { id: string; name: string | null };
}

interface ByDay {
  date: string;
  seconds: number;
  billableSeconds: number;
}

interface MemberStat {
  userId: string;
  userName: string;
  totalSeconds: number;
  billableSeconds: number;
  billableAmount: number;
}

interface ProjectStat {
  projectId: string | null;
  projectName: string;
  projectColor: string;
  clientId: string | null;
  clientName: string | null;
  clientCurrency: string;
  totalSeconds: number;
  billableSeconds: number;
  billableAmount: number;
  members: MemberStat[];
}

interface ReportData {
  entries: TimeEntry[];
  byDay: ByDay[];
  byProject: ProjectStat[];
  totals: {
    totalSeconds: number;
    billableSeconds: number;
    totalAmount: number;
    activeDays: number;
  };
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtHours(seconds: number) {
  return (seconds / 3600).toFixed(1) + 'h';
}

function fmtHoursChart(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function fmtTime(isoString: string) {
  try {
    return format(new Date(isoString), 'HH:mm');
  } catch {
    return '—';
  }
}

// ─── Preset config ───────────────────────────────────────────────────────────

type Preset =
  | 'today'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

type ActiveTab = 'summary' | 'detailed' | 'workload' | 'profitability';

const TABS: { value: ActiveTab; label: string }[] = [
  { value: 'summary', label: 'Summary' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'workload', label: 'Workload' },
  { value: 'profitability', label: 'Profitability' },
];

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

// ─── Sort icon ───────────────────────────────────────────────────────────────

function SortIcon({
  col,
  sortCol,
  sortDir,
}: {
  col: string;
  sortCol: string;
  sortDir: 'asc' | 'desc';
}) {
  if (sortCol !== col) return <ArrowUpDown size={12} className="ml-1 inline text-slate-600" />;
  return sortDir === 'asc' ? (
    <ArrowUp size={12} className="ml-1 inline text-indigo-400" />
  ) : (
    <ArrowDown size={12} className="ml-1 inline text-indigo-400" />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [preset, setPreset] = useState<Preset>('this_week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filters, setFilters] = useState({
    clientId: '',
    projectId: '',
    userId: '',
    billable: '' as '' | 'true' | 'false',
  });
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Detailed tab state
  const [detailPage, setDetailPage] = useState(0);
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const PAGE_SIZE = 50;

  // ── Date range ──────────────────────────────────────────────────────────────
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case 'today':
        return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'this_week':
        return {
          start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
      case 'last_week': {
        const lw = subWeeks(now, 1);
        return {
          start: format(startOfWeek(lw, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(lw, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
      }
      case 'this_month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      case 'last_month': {
        const lm = subMonths(now, 1);
        return {
          start: format(startOfMonth(lm), 'yyyy-MM-dd'),
          end: format(endOfMonth(lm), 'yyyy-MM-dd'),
        };
      }
      case 'this_year':
        return {
          start: format(startOfYear(now), 'yyyy-MM-dd'),
          end: format(endOfYear(now), 'yyyy-MM-dd'),
        };
      case 'custom':
        return { start: customStart, end: customEnd };
    }
  }, [preset, customStart, customEnd]);

  // ── Fetch reports ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;
    const params = new URLSearchParams({
      startDate: dateRange.start,
      endDate: dateRange.end + 'T23:59:59',
    });
    if (filters.clientId) params.set('clientId', filters.clientId);
    if (filters.projectId) params.set('projectId', filters.projectId);
    if (filters.userId) params.set('userId', filters.userId);
    if (filters.billable) params.set('billable', filters.billable);

    setLoading(true);
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then((d: ReportData) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateRange, filters]);

  // ── Fetch team members once ─────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/team')
      .then((r) => r.json())
      .then((d: TeamMember[]) => setTeamMembers(d))
      .catch(console.error);
  }, []);

  // ── Derived filter options ──────────────────────────────────────────────────
  const { clients, projects, members } = useMemo(() => {
    if (!data) return { clients: [], projects: [], members: [] };

    const clientMap = new Map<string, string>();
    const projectMap = new Map<string, string>();
    const memberMap = new Map<string, string>();

    for (const entry of data.entries) {
      if (entry.project?.client) {
        clientMap.set(entry.project.client.id, entry.project.client.name);
      }
      if (entry.project) {
        projectMap.set(entry.project.id, entry.project.name);
      }
      memberMap.set(entry.user.id, entry.user.name ?? 'Unknown');
    }

    return {
      clients: Array.from(clientMap.entries()).map(([id, name]) => ({ id, name })),
      projects: Array.from(projectMap.entries()).map(([id, name]) => ({ id, name })),
      members: Array.from(memberMap.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [data]);

  // ── Bar chart data ──────────────────────────────────────────────────────────
  const barData = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    const dayMap = new Map<string, number>();
    if (data) {
      for (const d of data.byDay) {
        dayMap.set(d.date, d.seconds);
      }
    }
    const start = parseISO(dateRange.start);
    const end = parseISO(dateRange.end);
    return eachDayOfInterval({ start, end }).map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'MMM d'),
        hours: (dayMap.get(key) ?? 0) / 3600,
        seconds: dayMap.get(key) ?? 0,
      };
    });
  }, [data, dateRange]);

  // ── Pie chart data ──────────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    if (!data) return [];
    return data.byProject.map((p) => ({
      name: p.projectName,
      value: p.totalSeconds,
      color: p.projectColor,
    }));
  }, [data]);

  // ── Workload grid data ──────────────────────────────────────────────────────
  const workloadDays = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    return eachDayOfInterval({ start: parseISO(dateRange.start), end: parseISO(dateRange.end) });
  }, [dateRange]);

  const workloadMap = useMemo(() => {
    // userId -> dateStr -> seconds
    const map = new Map<string, Map<string, number>>();
    if (!data) return map;
    for (const entry of data.entries) {
      const dateStr = format(parseISO(entry.startedAt), 'yyyy-MM-dd');
      if (!map.has(entry.userId)) map.set(entry.userId, new Map());
      const userMap = map.get(entry.userId)!;
      userMap.set(dateStr, (userMap.get(dateStr) ?? 0) + (entry.durationSeconds ?? 0));
    }
    return map;
  }, [data]);

  // ── Sorted detailed entries ─────────────────────────────────────────────────
  const sortedEntries = useMemo(() => {
    if (!data) return [];
    const entries = [...data.entries];
    entries.sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      switch (sortCol) {
        case 'date':
          av = a.startedAt;
          bv = b.startedAt;
          break;
        case 'member':
          av = a.user.name ?? '';
          bv = b.user.name ?? '';
          break;
        case 'client':
          av = a.project?.client?.name ?? '';
          bv = b.project?.client?.name ?? '';
          break;
        case 'project':
          av = a.project?.name ?? '';
          bv = b.project?.name ?? '';
          break;
        case 'description':
          av = a.description ?? '';
          bv = b.description ?? '';
          break;
        case 'start':
          av = a.startedAt;
          bv = b.startedAt;
          break;
        case 'end':
          av = a.stoppedAt ?? '';
          bv = b.stoppedAt ?? '';
          break;
        case 'duration':
          av = a.durationSeconds ?? 0;
          bv = b.durationSeconds ?? 0;
          break;
        case 'billable':
          av = a.isBillable ? 1 : 0;
          bv = b.isBillable ? 1 : 0;
          break;
        case 'amount':
          av =
            a.isBillable && a.project
              ? ((a.durationSeconds ?? 0) / 3600) * Number(a.project.hourlyRate)
              : 0;
          bv =
            b.isBillable && b.project
              ? ((b.durationSeconds ?? 0) / 3600) * Number(b.project.hourlyRate)
              : 0;
          break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return entries;
  }, [data, sortCol, sortDir]);

  const pagedEntries = useMemo(() => {
    return sortedEntries.slice(detailPage * PAGE_SIZE, (detailPage + 1) * PAGE_SIZE);
  }, [sortedEntries, detailPage]);

  // ── Profitability rows ──────────────────────────────────────────────────────
  const profitRows = useMemo(() => {
    if (!data) return [];
    return [...data.byProject].sort((a, b) => b.billableAmount - a.billableAmount);
  }, [data]);

  // ── Toggle sort ─────────────────────────────────────────────────────────────
  const handleSort = useCallback((col: string) => {
    setSortCol((prev) => {
      if (prev === col) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return col;
    });
    setDetailPage(0);
  }, []);

  // ── Toggle project expand ───────────────────────────────────────────────────
  function toggleProject(key: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── CSV exports ─────────────────────────────────────────────────────────────
  function exportSummaryCSV() {
    if (!data) return;
    const rows: string[][] = [
      ['Project', 'Client', 'Member', 'Date', 'Duration (h)', 'Billable', 'Amount'],
    ];
    for (const entry of data.entries) {
      rows.push([
        entry.project?.name ?? 'No Project',
        entry.project?.client?.name ?? '',
        entry.user.name ?? '',
        format(new Date(entry.startedAt), 'yyyy-MM-dd'),
        ((entry.durationSeconds ?? 0) / 3600).toFixed(2),
        entry.isBillable ? 'Yes' : 'No',
        entry.isBillable && entry.project
          ? (
              ((entry.durationSeconds ?? 0) / 3600) *
              Number(entry.project.hourlyRate)
            ).toFixed(2)
          : '0',
      ]);
    }
    downloadCSV(rows, 'ora-summary.csv');
  }

  function exportDetailedCSV() {
    if (!data) return;
    const rows: string[][] = [
      [
        'Date',
        'Member',
        'Client',
        'Project',
        'Description',
        'Start',
        'End',
        'Duration (h)',
        'Billable',
        'Amount',
      ],
    ];
    for (const entry of sortedEntries) {
      rows.push([
        format(new Date(entry.startedAt), 'yyyy-MM-dd'),
        entry.user.name ?? '',
        entry.project?.client?.name ?? '',
        entry.project?.name ?? 'No Project',
        entry.description ?? '',
        fmtTime(entry.startedAt),
        entry.stoppedAt ? fmtTime(entry.stoppedAt) : '',
        ((entry.durationSeconds ?? 0) / 3600).toFixed(2),
        entry.isBillable ? 'Yes' : 'No',
        entry.isBillable && entry.project
          ? (
              ((entry.durationSeconds ?? 0) / 3600) *
              Number(entry.project.hourlyRate)
            ).toFixed(2)
          : '0',
      ]);
    }
    downloadCSV(rows, 'ora-detailed.csv');
  }

  function downloadCSV(rows: string[][], filename: string) {
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Workload cell color ─────────────────────────────────────────────────────
  function workloadCellClass(seconds: number) {
    const h = seconds / 3600;
    if (h === 0) return 'bg-slate-800 text-slate-600';
    if (h < 4) return 'bg-indigo-950 text-indigo-400';
    if (h < 6) return 'bg-indigo-900 text-indigo-300';
    if (h < 8) return 'bg-indigo-700 text-indigo-100';
    return 'bg-emerald-800 text-emerald-200';
  }

  const SELECT_CLS =
    'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500';

  const defaultCurrency = data?.byProject[0]?.clientCurrency ?? 'USD';
  // Validate currency code is known (side-effect-free usage)
  void getCurrency(defaultCurrency);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          {(activeTab === 'summary' || activeTab === 'detailed') && (
            <button
              onClick={activeTab === 'summary' ? exportSummaryCSV : exportDetailedCSV}
              disabled={!data || data.entries.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <Download size={15} />
              Export CSV
            </button>
          )}
        </div>

        {/* Report tabs */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date range presets */}
        <div className="flex gap-1 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border ${
                preset === p.value
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {preset === 'custom' && (
          <div className="flex gap-3 items-center">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-slate-500 text-sm">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* ══════════════════════════════ SUMMARY TAB ══════════════════════════════ */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={filters.clientId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, clientId: e.target.value, projectId: '' }))
                }
                className={SELECT_CLS}
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.projectId}
                onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
                className={SELECT_CLS}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.userId}
                onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
                className={SELECT_CLS}
              >
                <option value="">All Members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.billable}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    billable: e.target.value as '' | 'true' | 'false',
                  }))
                }
                className={SELECT_CLS}
              >
                <option value="">All</option>
                <option value="true">Billable only</option>
                <option value="false">Non-billable only</option>
              </select>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse"
                  >
                    <div className="h-3 bg-slate-800 rounded w-24 mb-3" />
                    <div className="h-7 bg-slate-800 rounded w-20" />
                  </div>
                ))}
              </div>
            )}

            {/* Stat cards */}
            {!loading && data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Hours" value={fmtHours(data.totals.totalSeconds)} />
                <StatCard label="Billable Hours" value={fmtHours(data.totals.billableSeconds)} />
                <StatCard
                  label="Total Amount"
                  value={formatCurrency(data.totals.totalAmount, defaultCurrency)}
                />
                <StatCard
                  label="Avg Daily Hours"
                  value={
                    data.totals.activeDays > 0
                      ? fmtHours(data.totals.totalSeconds / data.totals.activeDays)
                      : '0.0h'
                  }
                />
              </div>
            )}

            {/* Empty state */}
            {!loading && data && data.entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <p className="text-lg font-medium text-slate-400">No time entries found</p>
                <p className="text-sm mt-1">Try adjusting the date range or filters</p>
              </div>
            )}

            {/* Charts */}
            {!loading && data && data.entries.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-slate-300 mb-4">Hours by Day</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={barData}
                      barSize={Math.max(6, Math.min(24, 120 / (barData.length || 1)))}
                    >
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => fmtHoursChart(v * 3600)}
                        width={40}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                        contentStyle={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9',
                          fontSize: 12,
                        }}
                        formatter={
                          ((value: number | undefined) => [
                            fmtHoursChart((value ?? 0) * 3600),
                            'Duration',
                          ]) as never
                        }
                      />
                      <Bar dataKey="hours" fill="#3730A3" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Donut chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-slate-300 mb-4">By Project</h2>
                  <div className="relative flex items-center justify-center" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          isAnimationActive={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>
                          )}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#f1f5f9',
                            fontSize: 12,
                          }}
                          formatter={
                            ((value: number | undefined) => [
                              fmtHours(value ?? 0),
                              'Duration',
                            ]) as never
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                      style={{ paddingRight: pieData.length > 0 ? '80px' : 0 }}
                    >
                      <span className="text-xl font-bold text-white">
                        {fmtHours(data.totals.totalSeconds)}
                      </span>
                      <span className="text-xs text-slate-500">total</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Breakdown table */}
            {!loading && data && data.byProject.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Project</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">
                        Client
                      </th>
                      <th className="text-right px-4 py-3 text-slate-400 font-medium">Duration</th>
                      <th className="text-right px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">
                        %
                      </th>
                      <th className="text-right px-4 py-3 text-slate-400 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byProject.map((proj) => {
                      const key = proj.projectId ?? '__none__';
                      const isExpanded = expandedProjects.has(key);
                      const pct =
                        data.totals.totalSeconds > 0
                          ? ((proj.totalSeconds / data.totals.totalSeconds) * 100).toFixed(1)
                          : '0.0';

                      return (
                        <>
                          <tr
                            key={key}
                            className="border-b border-slate-800/60 hover:bg-slate-800/30 cursor-pointer"
                            onClick={() => toggleProject(key)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
                                ) : (
                                  <ChevronRight
                                    size={14}
                                    className="text-slate-500 flex-shrink-0"
                                  />
                                )}
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: proj.projectColor }}
                                />
                                <span className="text-white font-medium truncate">
                                  {proj.projectName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                              {proj.clientName ?? <span className="text-slate-600">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-200 font-mono">
                              {fmtHours(proj.totalSeconds)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">
                              {pct}%
                            </td>
                            <td className="px-4 py-3 text-right text-slate-200">
                              {proj.billableAmount > 0 ? (
                                formatCurrency(proj.billableAmount, proj.clientCurrency)
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                          </tr>
                          {isExpanded &&
                            proj.members.map((member) => {
                              const memberPct =
                                proj.totalSeconds > 0
                                  ? ((member.totalSeconds / proj.totalSeconds) * 100).toFixed(1)
                                  : '0.0';
                              return (
                                <tr
                                  key={`${key}-${member.userId}`}
                                  className="border-b border-slate-800/30 bg-slate-900/50"
                                >
                                  <td className="px-4 py-2.5 pl-12">
                                    <span className="text-slate-400">{member.userName}</span>
                                  </td>
                                  <td className="px-4 py-2.5 hidden md:table-cell" />
                                  <td className="px-4 py-2.5 text-right text-slate-400 font-mono">
                                    {fmtHours(member.totalSeconds)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-slate-500 hidden sm:table-cell">
                                    {memberPct}%
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-slate-400">
                                    {member.billableAmount > 0 ? (
                                      formatCurrency(member.billableAmount, proj.clientCurrency)
                                    ) : (
                                      <span className="text-slate-600">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </>
                      );
                    })}
                    {/* Total row */}
                    <tr className="bg-slate-800/40">
                      <td className="px-4 py-3 text-white font-semibold">Total</td>
                      <td className="hidden md:table-cell" />
                      <td className="px-4 py-3 text-right text-white font-semibold font-mono">
                        {fmtHours(data.totals.totalSeconds)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">
                        100%
                      </td>
                      <td className="px-4 py-3 text-right text-white font-semibold">
                        {formatCurrency(data.totals.totalAmount, defaultCurrency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════ DETAILED TAB ══════════════════════════════ */}
        {activeTab === 'detailed' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={filters.clientId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, clientId: e.target.value, projectId: '' }))
                }
                className={SELECT_CLS}
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.projectId}
                onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
                className={SELECT_CLS}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.userId}
                onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
                className={SELECT_CLS}
              >
                <option value="">All Members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.billable}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    billable: e.target.value as '' | 'true' | 'false',
                  }))
                }
                className={SELECT_CLS}
              >
                <option value="">All</option>
                <option value="true">Billable only</option>
                <option value="false">Non-billable only</option>
              </select>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex gap-4">
                  {[80, 100, 80, 120, 160, 60, 60, 60, 60, 80].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 bg-slate-800 rounded animate-pulse"
                      style={{ width: w }}
                    />
                  ))}
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="px-4 py-3.5 border-b border-slate-800/60 flex gap-4 animate-pulse"
                  >
                    {[80, 100, 80, 120, 200, 60, 60, 60, 60, 80].map((w, j) => (
                      <div key={j} className="h-3 bg-slate-800 rounded" style={{ width: w }} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && data && data.entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <p className="text-lg font-medium text-slate-400">No entries for this period</p>
                <p className="text-sm mt-1">Try adjusting the date range or filters</p>
              </div>
            )}

            {/* Table */}
            {!loading && data && data.entries.length > 0 && (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {(
                          [
                            ['date', 'Date'],
                            ['member', 'Member'],
                            ['client', 'Client'],
                            ['project', 'Project'],
                            ['description', 'Description'],
                            ['start', 'Start'],
                            ['end', 'End'],
                            ['duration', 'Duration'],
                            ['billable', 'Billable'],
                            ['amount', 'Amount'],
                          ] as [string, string][]
                        ).map(([col, label]) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-slate-400 font-medium cursor-pointer select-none hover:text-slate-200 whitespace-nowrap"
                            onClick={() => handleSort(col)}
                          >
                            {label}
                            <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedEntries.map((entry) => {
                        const amount =
                          entry.isBillable && entry.project
                            ? ((entry.durationSeconds ?? 0) / 3600) *
                              Number(entry.project.hourlyRate)
                            : 0;
                        return (
                          <tr
                            key={entry.id}
                            className="border-b border-slate-800/60 hover:bg-slate-800/20"
                          >
                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                              {format(new Date(entry.startedAt), 'MMM d, yyyy')}
                            </td>
                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                              {entry.user.name ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                              {entry.project?.client?.name ?? (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {entry.project && (
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: entry.project.color }}
                                  />
                                )}
                                <span className="text-slate-300">
                                  {entry.project?.name ?? (
                                    <span className="text-slate-600">No project</span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                              {entry.description ?? (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">
                              {fmtTime(entry.startedAt)}
                            </td>
                            <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">
                              {entry.stoppedAt ? (
                                fmtTime(entry.stoppedAt)
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-200 font-mono whitespace-nowrap">
                              {fmtHours(entry.durationSeconds ?? 0)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  entry.isBillable
                                    ? 'bg-emerald-900/50 text-emerald-400'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {entry.isBillable ? 'Billable' : 'Non-billable'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-200 text-right whitespace-nowrap">
                              {amount > 0 ? (
                                formatCurrency(
                                  amount,
                                  entry.project?.client?.currency ?? 'USD',
                                )
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {sortedEntries.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>
                      Showing {detailPage * PAGE_SIZE + 1}–
                      {Math.min((detailPage + 1) * PAGE_SIZE, sortedEntries.length)} of{' '}
                      {sortedEntries.length} entries
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDetailPage((p) => Math.max(0, p - 1))}
                        disabled={detailPage === 0}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-700 text-white transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setDetailPage((p) =>
                            Math.min(Math.ceil(sortedEntries.length / PAGE_SIZE) - 1, p + 1),
                          )
                        }
                        disabled={(detailPage + 1) * PAGE_SIZE >= sortedEntries.length}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-700 text-white transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════ WORKLOAD TAB ══════════════════════════════ */}
        {activeTab === 'workload' && (
          <div className="space-y-6">
            {/* Member filter only */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={filters.userId}
                onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
                className={SELECT_CLS}
              >
                <option value="">All Members</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-pulse">
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-2">
                      <div className="h-8 bg-slate-800 rounded w-32" />
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                        <div key={j} className="h-8 bg-slate-800 rounded flex-1" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
                <table className="text-xs min-w-max w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-3 text-left text-slate-400 font-medium sticky left-0 bg-slate-900 min-w-[140px]">
                        Member
                      </th>
                      {workloadDays.map((day) => (
                        <th
                          key={day.toISOString()}
                          className="px-2 py-3 text-center text-slate-400 font-medium min-w-[64px]"
                        >
                          <div>{format(day, 'EEE')}</div>
                          <div className="text-slate-600 font-normal">{format(day, 'MMM d')}</div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-slate-400 font-medium whitespace-nowrap">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers
                      .filter((m) => !filters.userId || m.id === filters.userId)
                      .map((member) => {
                        const userMap = workloadMap.get(member.id);
                        const rowTotal = userMap
                          ? Array.from(userMap.values()).reduce((s, v) => s + v, 0)
                          : 0;
                        return (
                          <tr key={member.id} className="border-b border-slate-800/60">
                            <td className="px-4 py-2 sticky left-0 bg-slate-900">
                              <div className="text-slate-200 font-medium">
                                {member.name ?? member.email}
                              </div>
                              <div className="text-slate-600 text-xs">{member.role}</div>
                            </td>
                            {workloadDays.map((day) => {
                              const key = format(day, 'yyyy-MM-dd');
                              const secs = userMap?.get(key) ?? 0;
                              const h = secs / 3600;
                              return (
                                <td key={key} className="px-1 py-2 text-center">
                                  <div
                                    className={`mx-auto rounded-md flex items-center justify-center font-medium h-8 w-14 ${workloadCellClass(secs)}`}
                                  >
                                    {h > 0 ? `${h.toFixed(1)}h` : '—'}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-4 py-2 text-right text-slate-200 font-mono font-medium">
                              {fmtHours(rowTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    {teamMembers.filter((m) => !filters.userId || m.id === filters.userId)
                      .length === 0 && (
                      <tr>
                        <td
                          colSpan={workloadDays.length + 2}
                          className="px-4 py-12 text-center text-slate-500"
                        >
                          No members found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════ PROFITABILITY TAB ══════════════════════════════ */}
        {activeTab === 'profitability' && (
          <div className="space-y-6">
            {/* Client/Project filters only */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={filters.clientId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, clientId: e.target.value, projectId: '' }))
                }
                className={SELECT_CLS}
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.projectId}
                onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
                className={SELECT_CLS}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                    >
                      <div className="h-3 bg-slate-800 rounded w-24 mb-3" />
                      <div className="h-7 bg-slate-800 rounded w-28" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && data && (
              <>
                {/* Summary cards */}
                {(() => {
                  const totalRevenue = profitRows.reduce((s, r) => s + r.billableAmount, 0);
                  const totalSecs = profitRows.reduce((s, r) => s + r.totalSeconds, 0);
                  const billSecs = profitRows.reduce((s, r) => s + r.billableSeconds, 0);
                  const billPct = totalSecs > 0 ? (billSecs / totalSecs) * 100 : 0;
                  const mostProfitable = profitRows[0];
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
                          Most Profitable Client
                        </p>
                        <p className="text-xl font-bold text-white truncate">
                          {mostProfitable?.clientName ?? mostProfitable?.projectName ?? '—'}
                        </p>
                        {mostProfitable && (
                          <p className="text-sm text-slate-400 mt-1">
                            {formatCurrency(
                              mostProfitable.billableAmount,
                              mostProfitable.clientCurrency,
                            )}
                          </p>
                        )}
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
                          Overall Billable %
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            billPct >= 80
                              ? 'text-emerald-400'
                              : billPct >= 50
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {billPct.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
                          Total Revenue
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(totalRevenue, defaultCurrency)}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Empty state */}
                {profitRows.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <p className="text-lg font-medium text-slate-400">No data for this period</p>
                    <p className="text-sm mt-1">Try adjusting the date range or filters</p>
                  </div>
                )}

                {/* Profitability table */}
                {profitRows.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left px-4 py-3 text-slate-400 font-medium">
                            Project
                          </th>
                          <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">
                            Client
                          </th>
                          <th className="text-right px-4 py-3 text-slate-400 font-medium">
                            Tracked Hours
                          </th>
                          <th className="text-right px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">
                            Billable Hours
                          </th>
                          <th className="text-right px-4 py-3 text-slate-400 font-medium">
                            Billable %
                          </th>
                          <th className="text-right px-4 py-3 text-slate-400 font-medium">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {profitRows.map((proj) => {
                          const billPct =
                            proj.totalSeconds > 0
                              ? (proj.billableSeconds / proj.totalSeconds) * 100
                              : 0;
                          const billColor =
                            billPct >= 80
                              ? 'text-emerald-400'
                              : billPct >= 50
                              ? 'text-amber-400'
                              : 'text-red-400';
                          return (
                            <tr
                              key={proj.projectId ?? '__none__'}
                              className="border-b border-slate-800/60 hover:bg-slate-800/20"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: proj.projectColor }}
                                  />
                                  <span className="text-white font-medium truncate">
                                    {proj.projectName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                                {proj.clientName ?? <span className="text-slate-600">—</span>}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-200 font-mono">
                                {fmtHours(proj.totalSeconds)}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-200 font-mono hidden sm:table-cell">
                                {fmtHours(proj.billableSeconds)}
                              </td>
                              <td className={`px-4 py-3 text-right font-medium ${billColor}`}>
                                {billPct.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-right text-slate-200">
                                {proj.billableAmount > 0 ? (
                                  formatCurrency(proj.billableAmount, proj.clientCurrency)
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Total row */}
                        {(() => {
                          const totalTracked = profitRows.reduce(
                            (s, r) => s + r.totalSeconds,
                            0,
                          );
                          const totalBillable = profitRows.reduce(
                            (s, r) => s + r.billableSeconds,
                            0,
                          );
                          const totalRevenue = profitRows.reduce(
                            (s, r) => s + r.billableAmount,
                            0,
                          );
                          const overallPct =
                            totalTracked > 0 ? (totalBillable / totalTracked) * 100 : 0;
                          const billColor =
                            overallPct >= 80
                              ? 'text-emerald-400'
                              : overallPct >= 50
                              ? 'text-amber-400'
                              : 'text-red-400';
                          return (
                            <tr className="bg-slate-800/40">
                              <td className="px-4 py-3 text-white font-semibold">Total</td>
                              <td className="hidden md:table-cell" />
                              <td className="px-4 py-3 text-right text-white font-semibold font-mono">
                                {fmtHours(totalTracked)}
                              </td>
                              <td className="px-4 py-3 text-right text-white font-semibold font-mono hidden sm:table-cell">
                                {fmtHours(totalBillable)}
                              </td>
                              <td
                                className={`px-4 py-3 text-right font-semibold ${billColor}`}
                              >
                                {overallPct.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-right text-white font-semibold">
                                {formatCurrency(totalRevenue, defaultCurrency)}
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
