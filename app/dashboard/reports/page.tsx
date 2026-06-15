'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
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
import { Download, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtHours(seconds: number) {
  return (seconds / 3600).toFixed(1) + 'h';
}

function fmtHoursChart(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

// ─── Preset config ───────────────────────────────────────────────────────────

type Preset = 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'custom', label: 'Custom' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReportsPage() {
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
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

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
      case 'custom':
        return { start: customStart, end: customEnd };
    }
  }, [preset, customStart, customEnd]);

  // ── Fetch ───────────────────────────────────────────────────────────────────
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

  // ── Bar chart data with gap filling ────────────────────────────────────────
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

  // ── CSV export ──────────────────────────────────────────────────────────────
  function exportCSV() {
    if (!data) return;
    const rows: string[][] = [['Project', 'Client', 'Member', 'Date', 'Duration (h)', 'Billable', 'Amount']];
    for (const entry of data.entries) {
      rows.push([
        entry.project?.name ?? 'No Project',
        entry.project?.client?.name ?? '',
        entry.user.name ?? '',
        format(new Date(entry.startedAt), 'yyyy-MM-dd'),
        ((entry.durationSeconds ?? 0) / 3600).toFixed(2),
        entry.isBillable ? 'Yes' : 'No',
        entry.isBillable && entry.project
          ? ((entry.durationSeconds ?? 0) / 3600 * Number(entry.project.hourlyRate)).toFixed(2)
          : '0',
      ]);
    }
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ora-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Toggle project expand ───────────────────────────────────────────────────
  function toggleProject(key: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const totalHours = data ? data.totals.totalSeconds / 3600 : 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <button
          onClick={exportCSV}
          disabled={!data || data.entries.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Preset tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              preset === p.value
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
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

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filters.clientId}
          onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value, projectId: '' }))}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={filters.projectId}
          onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={filters.userId}
          onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <select
          value={filters.billable}
          onChange={(e) =>
            setFilters((f) => ({ ...f, billable: e.target.value as '' | 'true' | 'false' }))
          }
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-slate-800 rounded w-24 mb-3" />
              <div className="h-7 bg-slate-800 rounded w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      {!loading && data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Hours" value={fmtHours(data.totals.totalSeconds)} />
          <StatCard label="Billable Hours" value={fmtHours(data.totals.billableSeconds)} />
          <StatCard
            label="Billable Amount"
            value={formatCurrency(data.totals.totalAmount, data.byProject[0]?.clientCurrency ?? 'USD')}
          />
          <StatCard label="Active Days" value={String(data.totals.activeDays)} />
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
              <BarChart data={barData} barSize={Math.max(6, Math.min(24, 120 / (barData.length || 1)))}>
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
                  tickFormatter={(v) => fmtHoursChart(v * 3600)}
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
                  formatter={((value: number | undefined) => [fmtHoursChart((value ?? 0) * 3600), 'Duration']) as never}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
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
                    formatter={((value: number | undefined) => [fmtHours(value ?? 0), 'Duration']) as never}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ paddingRight: pieData.length > 0 ? '80px' : 0 }}
              >
                <span className="text-xl font-bold text-white">{fmtHours(data.totals.totalSeconds)}</span>
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
                <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Client</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Duration</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">%</th>
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
                            <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
                          )}
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: proj.projectColor }}
                          />
                          <span className="text-white font-medium truncate">{proj.projectName}</span>
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
                        {proj.billableAmount > 0
                          ? formatCurrency(proj.billableAmount, proj.clientCurrency)
                          : <span className="text-slate-600">—</span>}
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
                              {member.billableAmount > 0
                                ? formatCurrency(member.billableAmount, proj.clientCurrency)
                                : <span className="text-slate-600">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                  </>
                );
              })}
              {/* Total row */}
              <tr className="bg-slate-800/40">
                <td className="px-4 py-3 text-white font-semibold" colSpan={1}>
                  Total
                </td>
                <td className="hidden md:table-cell" />
                <td className="px-4 py-3 text-right text-white font-semibold font-mono">
                  {fmtHours(data.totals.totalSeconds)}
                </td>
                <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">100%</td>
                <td className="px-4 py-3 text-right text-white font-semibold">
                  {formatCurrency(
                    data.totals.totalAmount,
                    data.byProject[0]?.clientCurrency ?? 'USD',
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
