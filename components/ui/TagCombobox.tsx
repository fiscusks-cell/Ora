'use client';
import { useState, useRef, useEffect } from 'react';
import { Tag, X, Plus, Check } from 'lucide-react';

export interface TagOption {
  id: string;
  name: string;
}

interface Props {
  tags: TagOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateTag: (name: string) => Promise<TagOption>;
  disabled?: boolean;
}

export function TagCombobox({ tags, selectedIds, onChange, onCreateTag, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? tags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : tags;

  const exactMatch = tags.some((t) => t.name.toLowerCase() === query.trim().toLowerCase());
  const showCreate = query.trim().length > 0 && !exactMatch;

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));

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

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const handleCreate = async () => {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const tag = await onCreateTag(name);
      onChange([...selectedIds, tag.id]);
      setQuery('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setQuery(''); setOpen((o) => !o); } }}
        className={`flex items-center gap-1.5 h-9 rounded-lg px-3 text-sm transition-colors flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${open ? 'ring-2 ring-indigo-500' : ''}`}
        style={{
          background: 'var(--surface-raised)',
          border: `1px solid ${open ? '#6366f1' : 'var(--border)'}`,
        }}
      >
        <Tag
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: selectedIds.length > 0 ? 'var(--accent)' : 'var(--text-muted)' }}
        />
        {selectedIds.length === 0 && (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Tags</span>
        )}
        {selectedIds.length === 1 && (
          <span className="text-xs max-w-[80px] truncate" style={{ color: 'var(--text-secondary)' }}>
            {selectedTags[0]?.name}
          </span>
        )}
        {selectedIds.length > 1 && (
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            ×{selectedIds.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 top-full mt-1 left-0 w-56 rounded-xl shadow-lg overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* Search */}
          <div className="p-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setOpen(false); setQuery(''); }
                if (e.key === 'Enter' && showCreate) handleCreate();
                // Prevent space bar from triggering the timer start/stop
                if (e.key === ' ') e.stopPropagation();
              }}
              placeholder="Search or create…"
              className="w-full text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            />
          </div>

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1 px-2 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              {selectedTags.map((t) => (
                <span
                  key={t.id}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {t.name}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggle(t.id); }}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Options list */}
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && !showCreate && (
              <li className="px-3 py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No tags yet
              </li>
            )}
            {filtered.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => toggle(t.id)}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-white/5 transition-colors"
                >
                  <span
                    className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: selectedIds.includes(t.id) ? '#6366f1' : 'var(--border)',
                      background: selectedIds.includes(t.id) ? '#6366f1' : 'transparent',
                    }}
                  >
                    {selectedIds.includes(t.id) && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text)' }}>{t.name}</span>
                </button>
              </li>
            ))}

            {showCreate && (
              <li>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  <span className="text-sm" style={{ color: 'var(--accent)' }}>
                    {creating ? 'Creating…' : `Create "${query.trim()}"`}
                  </span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
