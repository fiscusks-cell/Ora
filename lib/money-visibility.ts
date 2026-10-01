/**
 * Removing money from API responses.
 *
 * The rule these enforce: an amount is not only a total. `durationSeconds ×
 * hourlyRate` *is* the amount, so a rate left on a payload hands the client
 * everything it needs to recompute what was supposedly hidden. Every strip here
 * drops rates alongside totals for that reason.
 *
 * `isBillable` is never touched. Whether work is billable describes the work,
 * not what it earns, and stays visible to everyone.
 *
 * Who may see amounts is decided once, in `requireAuth`, and arrives as
 * `AuthContext.canSeeAmounts`.
 */

/**
 * Drops `hourlyRate` from the `project` of a row.
 *
 * Typed loosely on purpose: every caller selects a slightly different set of
 * project columns, and these objects are on their way to `NextResponse.json`
 * rather than into further typed code.
 */
export function withoutProjectRate<T extends object>(row: T): T {
  const project = (row as { project?: unknown }).project as
    | Record<string, unknown>
    | null
    | undefined;
  if (!project) return row;
  const stripped = { ...project };
  delete stripped.hourlyRate;
  return { ...row, project: stripped };
}

/**
 * Drops `hourlyRate` from a project row itself (not a row that has one).
 */
export function withoutRate<T extends object>(project: T): T {
  const stripped = { ...project };
  delete (stripped as Record<string, unknown>).hourlyRate;
  return stripped;
}
