'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Play, Square, Tag } from 'lucide-react';

/**
 * The timer screen as the hero's evidence: the same structure the real timer page
 * has (bar, running counter, entries grouped by day), rendered in the system.
 * Every name and number here is synthetic — the caption under the frame says so.
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
    <span className="font-sans text-[1.5rem] font-medium tabular-nums tracking-tight text-electric-iris sm:text-[1.75rem]">
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
];

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
    <figure className="w-full">
      <div className="overflow-hidden rounded-cards border border-slate-edge/80 bg-charcoal-card text-snow shadow-elevation-xl">
        {/* app strip */}
        <div className="flex items-center justify-between border-b border-slate-edge/60 px-4 py-2.5">
          <div className="flex items-center gap-2 text-caption text-smoke">
            <span className="h-2 w-2 rounded-full bg-ember-pulse pulse-dot" />
            Time tracker
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-full bg-electric-iris/90 text-[10px] leading-5 text-center font-medium">R</span>
            <span className="hidden text-caption text-smoke sm:inline">Rina Kelmendi</span>
          </div>
        </div>

        {/* timer bar */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-edge/60 px-4 py-3">
          <div className="min-w-0 flex-[1_1_180px]">
            <p className="truncate text-body-lg text-snow">Month-end close</p>
          </div>
          <div className="flex min-w-0 flex-[1_1_160px] items-center gap-2">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-buttons border border-slate-edge px-2.5 py-1 text-caption text-snow">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-electric-iris" />
              <span className="truncate">Harbor &amp; Vale</span>
            </span>
            <span className="hidden items-center gap-1 rounded-buttons bg-ember-pulse/12 px-2 py-1 text-caption text-ember-pulse sm:inline-flex">
              <Tag className="h-3 w-3" />
              close
            </span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <DollarSign className="h-4 w-4 text-electric-iris" aria-label="Billable" />
            <LiveCounter base={4355} />
            <span className="inline-flex items-center gap-1.5 rounded-buttons bg-[var(--error)] px-3.5 py-1.5 text-body font-medium text-snow">
              <Square className="h-3 w-3" />
              Stop
            </span>
          </div>
        </div>

        {/* entries */}
        <div className="px-4 pb-4 pt-3">
          {DAYS.map((day) => (
            <div key={day.label} className="mb-3 last:mb-0">
              <div className="mb-1.5 flex items-center justify-between text-caption text-iron-veil">
                <span>{day.label}</span>
                <span className="tabular-nums">{day.total}</span>
              </div>
              <ul className="divide-y divide-slate-edge/40 rounded-[8px] border border-slate-edge/50">
                {day.rows.map((row) => (
                  <li key={row.desc} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body text-snow">{row.desc}</p>
                      <ProjectChip project={row.project} />
                    </div>
                    <span className="hidden text-caption tabular-nums text-iron-veil md:inline">{row.range}</span>
                    {row.billable && <DollarSign className="hidden h-3.5 w-3.5 text-electric-iris sm:block" aria-label="Billable" />}
                    <span className="w-10 text-right text-body tabular-nums text-snow">{row.dur}</span>
                    <Play className="h-3.5 w-3.5 text-iron-veil" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-caption text-smoke">Illustrative workspace — names and figures are not real clients.</figcaption>
    </figure>
  );
}
