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
}

export function ProjectCombobox({
  projects,
  value,
  onChange,
  disabled = false,
  placeholder = 'Project',
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
    },
    [onChange],
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus input when opened
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
      // Space with empty query just shows all — already open
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={openDropdown}
        className={`flex items-center gap-2 h-9 bg-slate-700 border border-slate-600 rounded-lg px-3 text-sm transition-colors min-w-[160px] max-w-[220px] disabled:opacity-60 disabled:cursor-not-allowed ${
          open ? 'ring-2 ring-indigo-500 border-indigo-500' : 'hover:border-slate-500'
        }`}
      >
        {selected ? (
          <>
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selected.color }}
            />
            <span className="text-slate-100 truncate flex-1 text-left font-medium">
              {selected.name}
            </span>
            {!disabled && (
              <X
                className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  select(null);
                }}
              />
            )}
          </>
        ) : (
          <>
            <span className="text-slate-500 flex-1 text-left">{placeholder}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-700">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search projects…"
              className="w-full bg-slate-700 text-slate-100 placeholder-slate-500 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {/* No project option */}
            <li>
              <button
                type="button"
                onClick={() => select(null)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-700 transition-colors ${
                  !value ? 'bg-slate-700/50' : ''
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full border border-slate-600 flex-shrink-0" />
                <span className="text-sm text-slate-400 italic">No project</span>
              </button>
            </li>

            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-slate-500">No matches</li>
            ) : (
              filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => select(p.id)}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-slate-700 transition-colors ${
                      value === p.id ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {p.name}
                      </span>
                      {p.clientName && (
                        <span className="text-xs text-slate-500 truncate">{p.clientName}</span>
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
