'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Play, Square, Tag } from 'lucide-react';

/**
 * The timer screen as the hero's evidence — the same structure the real timer
 * page has: bar, running counter, entries grouped by day — in the system.
 * Rendered as the product surface itself (no card around it): the hero crops
 * it at the right and dissolves its foot the way a screenshot is cropped, and
 * it stays DOM so every label is 1:1 CSS pixels and legible. The bar wraps
 * the way the real one does, counter last, so the running timer is always in
 * the visible part. Every name and figure is synthetic.
 */

function formatElapsed(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// The page's one moving element: the counter ticks from a fixed base so the
// server and client render the same first frame, then advances each second.
function LiveCounter({ base }: { base: number }) {
  const [elapsed, setElapsed] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span data-live-counter className="font-sans text-[1.5rem] font-medium tabular-nums tracking-tight text-electric-iris">
      {formatElapsed(elapsed)}
    </span>
  );
}

const PROJECTS = {
  harbor: { name: 'Harbor & Vale', color: '#5683da' },
  nightjar: { name: 'Nightjar Studio', color: '#ff8964' },
  atlas: { name: 'Atlas Freight', color: '#95979e' },
} as const;

type ProjectKey = keyof typeof PROJECTS;

const DAYS: { label: string; total: string; rows: { desc: string; project: ProjectKey; range: string; dur: string; billable: boolean }[] }[] = [
  {
    label: 'Today',
    total: '4:08',
    rows: [
      { desc: 'Reconcile bank feed', project: 'harbor', range: '09:10 – 11:02', dur: '1:52', billable: true },
      { desc: 'Q3 VAT return', project: 'nightjar', range: '11:15 – 12:40', dur: '1:25', billable: true },
      { desc: 'Receipts capture', project: 'atlas', range: '13:30 – 14:21', dur: '0:51', billable: false },
    ],
  },
  {
    label: 'Yesterday',
    total: '7:36',
    rows: [
      { desc: 'Payroll journal', project: 'harbor', range: '08:55 – 12:10', dur: '3:15', billable: true },
      { desc: 'AR aging review', project: 'nightjar', range: '13:00 – 17:21', dur: '4:21', billable: true },
    ],
  },
  {
    label: 'Mon 2 Nov',
    total: '6:12',
    rows: [
      { desc: 'Trial balance review', project: 'harbor', range: '09:00 – 11:40', dur: '2:40', billable: true },
      { desc: 'Expense coding', project: 'atlas', range: '12:30 – 14:02', dur: '1:32', billable: true },
      { desc: 'Q4 planning call', project: 'nightjar', range: '15:00 – 17:00', dur: '2:00', billable: true },
    ],
  },
];

const NAV = ['Dashboard', 'Time tracker', 'Reports', 'Projects', 'Clients'];

function ProjectChip({ project }: { project: ProjectKey }) {
  const p = PROJECTS[project];
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-caption text-smoke">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: p.color }} />
      <span className="truncate">{p.name}</span>
    </span>
  );
}

export function ProductMockup() {
  return (
    <div data-product-mockup className="flex w-full overflow-hidden rounded-t-[10px] bg-charcoal-card text-snow ring-1 ring-slate-edge/60 lg:h-[620px]">
      {/* sidebar sliver, as the app has — only where the frame is wide enough to spare it */}
      <aside className="hidden w-[172px] shrink-0 border-r border-slate-edge/60 bg-void/60 px-3 py-4 xl:block">
        <div className="mb-5 flex items-center gap-2 px-2">
          <span className="h-5 w-5 rounded-full border-2 border-snow/90" />
          <span className="font-display text-[13px] font-semibold tracking-[0.14em]">ORA</span>
        </div>
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <li
              key={item}
              className={`rounded-[6px] px-2.5 py-1.5 text-body ${item === 'Time tracker' ? 'bg-snow/10 text-snow' : 'text-smoke'}`}
            >
              {item}
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0 flex-1">
        {/* app strip */}
        <div className="flex items-center justify-between border-b border-slate-edge/60 px-5 py-3">
          <div className="flex items-center gap-2 text-caption text-smoke">
            <span className="h-2 w-2 rounded-full bg-ember-pulse pulse-dot" />
            Timer running
          </div>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-electric-iris/90 text-center text-[11px] font-medium leading-6">E</span>
            <span className="text-caption text-smoke">Erion Thaqi</span>
          </div>
        </div>

        {/* timer bar: description and project first, the counter and Stop last so a
            narrow frame wraps them onto their own line, right-aligned, still visible */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-slate-edge/60 px-5 py-4">
          <p className="min-w-0 shrink truncate text-body-lg text-snow">Month-end close</p>
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-buttons border border-slate-edge px-2.5 py-1 text-caption text-snow">
              <span className="h-1.5 w-1.5 rounded-full bg-electric-iris" />
              Harbor &amp; Vale
            </span>
            <span className="hidden items-center gap-1 rounded-buttons bg-ember-pulse/12 px-2 py-1 text-caption text-ember-pulse xl:inline-flex">
              <Tag className="h-3 w-3" />
              close
            </span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-4">
            <DollarSign className="h-4 w-4 text-electric-iris" aria-label="Billable" />
            <LiveCounter base={4355} />
            <span className="inline-flex items-center gap-1.5 rounded-buttons bg-[var(--error)] px-4 py-2 text-body font-medium text-snow">
              <Square className="h-3 w-3" />
              Stop
            </span>
          </div>
        </div>

        {/* entries */}
        <div className="px-5 pb-6 pt-4">
          {DAYS.map((day) => (
            <div key={day.label} className="mb-4 last:mb-0">
              <div className="mb-1.5 flex items-center justify-between text-caption text-smoke">
                <span>{day.label}</span>
                <span className="tabular-nums">{day.total}</span>
              </div>
              <ul className="divide-y divide-slate-edge/40 rounded-[8px] border border-slate-edge/50">
                {day.rows.map((row) => (
                  <li key={row.desc} className="flex items-center gap-4 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body text-snow">{row.desc}</p>
                      <ProjectChip project={row.project} />
                    </div>
                    <span className="hidden text-caption tabular-nums text-smoke md:inline">{row.range}</span>
                    {row.billable && <DollarSign className="h-3.5 w-3.5 text-electric-iris" aria-label="Billable" />}
                    <span className="w-10 text-right text-body tabular-nums text-snow">{row.dur}</span>
                    <Play className="h-3.5 w-3.5 text-smoke" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
