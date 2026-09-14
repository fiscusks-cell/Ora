import type { Prisma } from '@prisma/client';

/**
 * The one response shape for a time entry, shared by every time-entry route.
 *
 * GET, POST and PATCH each used to select a slightly different project, so a row
 * spliced into a list from a POST or PATCH response rendered without its project
 * icon or client until the next full refetch.
 */
export const timeEntryInclude = {
  project: {
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      hourlyRate: true,
      isBillable: true,
      client: { select: { id: true, name: true } },
    },
  },
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
  tags: { include: { tag: { select: { id: true, name: true } } } },
} satisfies Prisma.TimeEntryInclude;

/** Flattens the join rows so `tags` is a plain list of `{ id, name }`. */
export function serializeTimeEntry<T extends { tags: { tag: { id: string; name: string } }[] }>(entry: T) {
  return { ...entry, tags: entry.tags.map((t) => t.tag) };
}
