'use client';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKeys: string[];
  searchPlaceholder?: string;
  actions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

function getNestedValue(obj: any, path: string): string {
  return String(path.split('.').reduce((o, k) => o?.[k], obj) ?? '');
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKeys,
  searchPlaceholder = 'Search...',
  actions,
  onRowClick,
  emptyMessage = 'No data found.',
  loading = false,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return new Set(
      data.filter((row) =>
        searchKeys.some((key) => getNestedValue(row, key).toLowerCase().includes(q))
      )
    );
  }, [query, data, searchKeys]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 rounded-lg skeleton" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            '--tw-ring-color': 'var(--accent)',
          } as React.CSSProperties}
        />
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{emptyMessage}</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="min-w-full">
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${col.className ?? ''}`}
                    style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
                  >
                    {col.header}
                  </th>
                ))}
                {actions && (
                  <th
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const isMatch = matches === null || matches.has(row);
                return (
                  <tr
                    key={(row as any).id ?? i}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className="transition-all duration-200"
                    style={{
                      background: 'var(--card)',
                      borderBottom: i < data.length - 1 ? '1px solid var(--border-light)' : undefined,
                      opacity: isMatch ? 1 : 0.15,
                      cursor: onRowClick ? 'pointer' : undefined,
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 text-sm ${col.className ?? ''}`}
                        style={{ color: 'var(--text)' }}
                      >
                        {col.render ? col.render(row) : String(getNestedValue(row, col.key) ?? '')}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3.5 text-right">
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {matches !== null && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          {matches.size} of {data.length} result{data.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{
        background: active ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'color-mix(in srgb, var(--text-muted) 15%, transparent)',
        color: active ? 'var(--success)' : 'var(--text-muted)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
