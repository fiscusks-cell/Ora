import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authz';
import { withoutProjectRate } from '@/lib/money-visibility';
import { amountMinor, fromMinor, rateToHundredths } from '@/lib/currency';

export async function GET(req: NextRequest) {
  const authz = await requireAuth();
  if (authz instanceof NextResponse) return authz;
  const { userId: callerId, organizationId: orgId, role, canSeeAmounts } = authz;

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const clientId = searchParams.get('clientId') || undefined;
  const projectId = searchParams.get('projectId') || undefined;
  const requestedUserId = searchParams.get('userId') || undefined;
  const billable = searchParams.get('billable');

  // MEMBER querying another member's data is forbidden
  if (requestedUserId && requestedUserId !== callerId && role === 'MEMBER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const dateFilter: Record<string, Date> = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  const where: Record<string, unknown> = {
    user: { organizationId: orgId },
    stoppedAt: { not: null },
    ...(Object.keys(dateFilter).length > 0 ? { startedAt: dateFilter } : {}),
  };

  if (projectId) {
    where.projectId = projectId;
  } else if (clientId) {
    where.project = { clientId };
  }
  if (requestedUserId) {
    where.userId = requestedUserId;
  } else if (role === 'MEMBER') {
    // No userId filter supplied: MEMBER sees only their own entries
    where.userId = callerId;
  }
  if (billable === 'true') {
    where.isBillable = true;
  } else if (billable === 'false') {
    where.isBillable = false;
  }

  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10000', 10), 50000);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const entries = await prisma.timeEntry.findMany({
    where,
    select: {
      id: true,
      userId: true,
      projectId: true,
      description: true,
      startedAt: true,
      stoppedAt: true,
      durationSeconds: true,
      isBillable: true,
      project: {
        select: {
          id: true, name: true, color: true, icon: true, hourlyRate: true,
          client: { select: { id: true, name: true, currency: true } },
        },
      },
      user: { select: { id: true, name: true } },
    },
    orderBy: { startedAt: 'asc' },
    take: limit,
    skip: offset,
  });

  // byDay aggregation
  const dayMap = new Map<string, { seconds: number; billableSeconds: number }>();
  for (const entry of entries) {
    const day = entry.startedAt.toISOString().slice(0, 10);
    const existing = dayMap.get(day) ?? { seconds: 0, billableSeconds: 0 };
    const secs = entry.durationSeconds ?? 0;
    existing.seconds += secs;
    if (entry.isBillable) existing.billableSeconds += secs;
    dayMap.set(day, existing);
  }
  const byDay = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));

  // byProject aggregation.
  // Money is rounded exactly once, per entry, into integer minor units; every
  // aggregate above is a pure integer sum of those, so project rows, client
  // rows and the report total all reconcile with each other and with invoices.
  type MemberAgg = {
    userId: string;
    userName: string;
    totalSeconds: number;
    billableSeconds: number;
    billableAmountMinor: number;
  };
  type ProjectAgg = {
    projectId: string | null;
    projectName: string;
    projectColor: string;
    projectIcon: string | null;
    clientId: string | null;
    clientName: string | null;
    clientCurrency: string;
    totalSeconds: number;
    billableSeconds: number;
    billableAmountMinor: number;
    members: Map<string, MemberAgg>;
  };

  const projectMap = new Map<string, ProjectAgg>();

  for (const entry of entries) {
    const key = entry.projectId ?? '__no_project__';
    const secs = entry.durationSeconds ?? 0;
    const rateHundredths = entry.project ? rateToHundredths(entry.project.hourlyRate) : 0;
    const currency = entry.project?.client?.currency ?? 'USD';
    const entryMinor = entry.isBillable ? amountMinor(secs, rateHundredths, currency) : 0;

    if (!projectMap.has(key)) {
      projectMap.set(key, {
        projectId: entry.projectId ?? null,
        projectName: entry.project?.name ?? 'No Project',
        projectColor: entry.project?.color ?? '#6b7280',
        projectIcon: entry.project?.icon ?? null,
        clientId: entry.project?.client?.id ?? null,
        clientName: entry.project?.client?.name ?? null,
        clientCurrency: currency,
        totalSeconds: 0,
        billableSeconds: 0,
        billableAmountMinor: 0,
        members: new Map(),
      });
    }

    const agg = projectMap.get(key)!;
    agg.totalSeconds += secs;
    if (entry.isBillable) {
      agg.billableSeconds += secs;
      agg.billableAmountMinor += entryMinor;
    }

    const memberId = entry.userId;
    if (!agg.members.has(memberId)) {
      agg.members.set(memberId, {
        userId: memberId,
        userName: entry.user.name ?? 'Unknown',
        totalSeconds: 0,
        billableSeconds: 0,
        billableAmountMinor: 0,
      });
    }
    const member = agg.members.get(memberId)!;
    member.totalSeconds += secs;
    if (entry.isBillable) {
      member.billableSeconds += secs;
      member.billableAmountMinor += entryMinor;
    }
  }

  const byProject = Array.from(projectMap.values()).map((p) => ({
    projectId: p.projectId,
    projectName: p.projectName,
    projectColor: p.projectColor,
    projectIcon: p.projectIcon,
    clientId: p.clientId,
    clientName: p.clientName,
    clientCurrency: p.clientCurrency,
    totalSeconds: p.totalSeconds,
    billableSeconds: p.billableSeconds,
    billableAmountMinor: p.billableAmountMinor,
    // Major-unit convenience value, derived from the integer sum — display only.
    billableAmount: fromMinor(p.billableAmountMinor, p.clientCurrency),
    members: Array.from(p.members.values()).map((m) => ({
      ...m,
      billableAmount: fromMinor(m.billableAmountMinor, p.clientCurrency),
    })),
  }));

  const totals = {
    totalSeconds: entries.reduce((s, e) => s + (e.durationSeconds ?? 0), 0),
    billableSeconds: entries
      .filter((e) => e.isBillable)
      .reduce((s, e) => s + (e.durationSeconds ?? 0), 0),
    // Legacy: a cross-currency sum, only meaningful for single-currency reports.
    totalAmount: byProject.reduce((s, p) => s + p.billableAmount, 0),
    activeDays: dayMap.size,
  };

  if (canSeeAmounts) {
    return NextResponse.json({ entries, byDay, byProject, totals });
  }

  // Amounts removed, and the rates with them: durationSeconds x hourlyRate is
  // the amount, so leaving rates on the entries would hand back exactly what
  // was taken out of the aggregates. The currency goes too, wherever its only
  // job was to label an amount that is no longer there.
  //
  // Fields are omitted rather than zeroed. A zero is a number the reader can
  // believe; an absent field cannot be mistaken for free work.
  //
  // isBillable and every duration stay exactly as they are.
  return NextResponse.json({
    entries: entries.map((entry) => {
      const stripped = withoutProjectRate(entry);
      if (!stripped.project) return stripped;
      const { client, ...project } = stripped.project as typeof entry.project & object;
      return {
        ...stripped,
        project: {
          ...project,
          client: client ? { id: client.id, name: client.name } : null,
        },
      };
    }),
    byDay,
    byProject: byProject.map((p) => ({
      projectId: p.projectId,
      projectName: p.projectName,
      projectColor: p.projectColor,
      projectIcon: p.projectIcon,
      clientId: p.clientId,
      clientName: p.clientName,
      totalSeconds: p.totalSeconds,
      billableSeconds: p.billableSeconds,
      members: p.members.map((m) => ({
        userId: m.userId,
        userName: m.userName,
        totalSeconds: m.totalSeconds,
        billableSeconds: m.billableSeconds,
      })),
    })),
    totals: {
      totalSeconds: totals.totalSeconds,
      billableSeconds: totals.billableSeconds,
      activeDays: totals.activeDays,
    },
  });
}
