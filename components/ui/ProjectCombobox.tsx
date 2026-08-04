'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface ProjectOption {
  id: string;
  name: string;
  color: string;
  clientName?: string | null;
}

interface Props {
  projects: ProjectOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  onClose?: () => void;
}

export function ProjectCombobox({
  projects,
  value,
  onChange,
  disabled = false,
  placeholder = 'Project',
  onClose,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = projects.find((p) => p.id === value) ?? null;

  const filtered = query.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : projects;

  const openDropdown = useCallback(() => {
    if (!disabled) {
      setQuery('');
      setOpen(true);
    }
  }, [disabled]);

  const select = useCallback(
    (id: string | null) => {
      onChange(id);
      setOpen(false);
      setQuery('');
      onClose?.();
    },
    [onChange, onClose],
  );

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
        onClose?.();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
    if (e.key === 'Enter' && filtered.length > 0) {
      select(filtered[0].id);
    }
    if (e.key === ' ' && !query) {
      e.preventDefault();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={openDropdown}
        className={`flex items-center gap-2 h-9 rounded-lg px-3 text-sm transition-colors min-w-[160px] max-w-[220px] disabled:opacity-60 disabled:cursor-not-allowed ${open ? 'ring-2 ring-indigo-500' : ''}`}
        style={{
          background: 'var(--surface-raised)',
          border: `1px solid ${open ? '#6366f1' : 'var(--border)'}`,
        }}
      >
        {selected ? (
          <>
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selected.color }}
            />
            <span className="truncate flex-1 text-left font-medium" style={{ color: 'var(--text)' }}>
              {selected.name}
            </span>
            {!disabled && (
              <X
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  select(null);
                }}
              />
            )}
          </>
        ) : (
          <>
            <span className="flex-1 text-left" style={{ color: 'var(--text-muted)' }}>
              {placeholder}
            </span>
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 top-full mt-1 left-0 w-64 rounded-xl shadow-lg overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Search */}
          <div className="p-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search projects…"
              className="w-full text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            />
          </div>

          {/* Options */}
          <ul className="max-h-56 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => select(null)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-white/5 transition-colors ${!value ? 'bg-white/5' : ''}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ border: '1px solid var(--border)' }}
                />
                <span className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                  No project
                </span>
              </button>
            </li>

            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No matches
              </li>
            ) : (
              filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => select(p.id)}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-white/5 transition-colors ${value === p.id ? 'bg-white/5' : ''}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                        {p.name}
                      </span>
                      {p.clientName && (
                        <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {p.clientName}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
