'use client';
import { resolveIcon } from '@/lib/project-icons';

export function ProjectIconOrDot({
  icon,
  color,
  size,
  dotClassName = 'w-2.5 h-2.5',
}: {
  icon?: string | null;
  color: string;
  size: number;
  dotClassName?: string;
}) {
  const Icon = resolveIcon(icon);
  return Icon
    ? <Icon size={size} style={{ color, width: size, height: size, flexShrink: 0 }} />
    : <span className={`${dotClassName} rounded-full flex-shrink-0`} style={{ backgroundColor: color }} />;
}
