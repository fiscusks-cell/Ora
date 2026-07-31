import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  format,
} from 'date-fns';

// ─── helpers ────────────────────────────────────────────────────────────────

function sumSeconds(
  entries: { startedAt: Date; stoppedAt: Date | null; durationSeconds: number | null }[]
): number {
  return entries.reduce((acc, e) => {
    if (e.durationSeconds != null) return acc + e.durationSeconds;
    if (e.stoppedAt) return acc + Math.round((e.stoppedAt.getTime() - e.startedAt.getTime()) / 1000);
    return acc;
  }, 0);
}

function formatHM(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatCurrency(amount: number, currency = 'USD'): string {
  const locale = currency === 'JPY' ? 'ja-JP' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight
          ? 'bg-emerald-950 border-emerald-800'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p
        className={`text-3xl tabular-nums ${
          highlight ? 'text-emerald-400' : 'text-white'
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const sessionUser = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    organizationId: string;
  };

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    todayEntries,
    weekEntries,
    lastWeekEntries,
    monthBillableEntries,
    activeEntry,
    recentEntries,
  ] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: sessionUser.id,
        startedAt: { gte: todayStart, lte: todayEnd },
        stoppedAt: { not: null },
      },
    }),
    prisma.timeEntry.findMany({
      where: {
        userId: sessionUser.id,
        startedAt: { gte: weekStart, lte: weekEnd },
        stoppedAt: { not: null },
      },
    }),
    prisma.timeEntry.findMany({
      where: {
        userId: sessionUser.id,
        startedAt: { gte: lastWeekStart, lte: lastWeekEnd },
        stoppedAt: { not: null },
      },
    }),
    prisma.timeEntry.findMany({
      where: {
        userId: sessionUser.id,
        startedAt: { gte: monthStart, lte: monthEnd },
        stoppedAt: { not: null },
        isBillable: true,
      },
      include: { project: true },
    }),
    prisma.timeEntry.findFirst({
      where: { userId: sessionUser.id, stoppedAt: null },
    }),
    prisma.timeEntry.findMany({
      where: { userId: sessionUser.id, stoppedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: { project: { include: { client: true } } },
    }),
  ]);

  // Compute totals
  const todaySeconds = sumSeconds(todayEntries);
  const weekSeconds = sumSeconds(weekEntries);
  const lastWeekSeconds = sumSeconds(lastWeekEntries);

  const monthBillable = monthBillableEntries.reduce((acc, e) => {
    const seconds = e.durationSeconds ?? (e.stoppedAt ? Math.round((e.stoppedAt.getTime() - e.startedAt.getTime()) / 1000) : 0);
    const rate = e.project ? Number(e.project.hourlyRate) : 0;
    return acc + (seconds / 3600) * rate;
  }, 0);

  // Greeting
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = sessionUser.name?.split(' ')[0] ?? sessionUser.email ?? 'there';

  // Group recent entries by date
  const byDate: Record<string, typeof recentEntries> = {};
  for (const entry of recentEntries) {
    const key = format(entry.startedAt, 'yyyy-MM-dd');
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(entry);
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-normal text-white">
          {greeting}, {firstName}
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here&apos;s your time tracking overview.</p>
      </div>

      {/* Active timer banner */}
      {activeEntry && (
        <div className="flex items-center gap-3 bg-amber-950 border border-amber-800 rounded-xl px-5 py-4">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-300">Timer is running</p>
            <p className="text-xs text-amber-500">
              Started at {format(activeEntry.startedAt, 'h:mm a')} ·{' '}
              <a href="/dashboard/timer" className="underline underline-offset-2 hover:text-amber-300">
                Go to timer →
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today" value={formatHM(todaySeconds)} />
        <StatCard label="This week" value={formatHM(weekSeconds)} />
        <StatCard label="Last week" value={formatHM(lastWeekSeconds)} />
        <StatCard
          label="Month billable"
          value={formatCurrency(monthBillable)}
          highlight
        />
      </div>

      {/* Recent entries */}
      <div>
        <h2 className="text-sm text-slate-400 uppercase tracking-wider mb-4">
          Recent entries
        </h2>

        {Object.keys(byDate).length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
            No time entries yet.{' '}
            <a href="/dashboard/timer" className="text-indigo-400 hover:text-indigo-300 underline">
              Start the timer
            </a>{' '}
            to track your first entry.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byDate).map(([dateKey, entries]) => {
              const dayTotal = sumSeconds(entries);
              return (
                <div
                  key={dateKey}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                >
                  {/* Date header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/80">
                    <span className="text-sm text-slate-300">
                      {format(new Date(dateKey + 'T12:00:00'), 'EEEE, MMMM d')}
                    </span>
                    <span className="text-sm text-slate-400 tabular-nums">
                      {formatHM(dayTotal)}
                    </span>
                  </div>

                  {/* Entry rows */}
                  {entries.map((entry) => {
                    const entrySeconds =
                      entry.durationSeconds ??
                      (entry.stoppedAt
                        ? Math.round((entry.stoppedAt.getTime() - entry.startedAt.getTime()) / 1000)
                        : 0);

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-4 px-5 py-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Project color dot */}
                        {entry.project ? (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.project.color }}
                          />
                        ) : (
                          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-600" />
                        )}

                        {/* Description + project */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 truncate">
                            {entry.description ? (
                              entry.description
                            ) : (
                              <span className="text-slate-500 italic">No description</span>
                            )}
                          </p>
                          {entry.project && (
                            <p className="text-xs text-slate-500 truncate">
                              {entry.project.name}
                              {entry.project.client ? ` · ${entry.project.client.name}` : ''}
                            </p>
                          )}
                        </div>

                        {/* Time range */}
                        <span className="text-xs text-slate-500 hidden sm:block flex-shrink-0">
                          {format(entry.startedAt, 'HH:mm')}
                          {entry.stoppedAt ? ` – ${format(entry.stoppedAt, 'HH:mm')}` : ''}
                        </span>

                        {/* Duration */}
                        <span className="text-sm text-slate-300 tabular-nums flex-shrink-0">
                          {formatHM(entrySeconds)}
                        </span>

                        {/* Billable badge */}
                        {entry.isBillable && (
                          <span className="text-xs bg-emerald-900/60 text-emerald-400 px-1.5 py-0.5 rounded flex-shrink-0 hidden sm:block">
                            $
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
