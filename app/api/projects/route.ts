import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authz';
import { withoutRate } from '@/lib/money-visibility';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  clientId: z.string().optional(),
  color: z.string().default('#3730A3'),
  icon: z.string().min(1),
  hourlyRate: z.number().min(0).default(0),
  isBillable: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    // Open to every role: the timer needs the project list to put work against.
    const authz = await requireAuth();
    if (authz instanceof NextResponse) return authz;
    const { organizationId, canSeeAmounts } = authz;

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const projects = await prisma.project.findMany({
      where: {
        organizationId,
        ...(!includeArchived ? { isArchived: false } : {}),
      },
      include: {
        client: { select: { id: true, name: true, currency: true } },
      },
      orderBy: { name: 'asc' },
    });

    // The client currency stays: it is the project's configuration, and without
    // a rate it cannot be turned back into an amount.
    return NextResponse.json(
      canSeeAmounts ? projects : projects.map((p) => withoutRate(p)),
    );
  } catch (err) {
    console.error('[projects GET] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Members may create projects — blocking that is friction with no benefit in
    // a small team — but only an owner or admin may set a rate, which is money a
    // member is not necessarily allowed to see.
    const authz = await requireAuth();
    if (authz instanceof NextResponse) return authz;
    const { organizationId, role } = authz;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, description, clientId, color, icon, hourlyRate, isBillable } = parsed.data;

    if (role === 'MEMBER' && hourlyRate > 0) {
      return NextResponse.json(
        {
          error:
            'Only an owner or admin can set a project rate. Create the project without a rate and ask an admin to add it.',
        },
        { status: 403 },
      );
    }

    if (clientId) {
      const client = await prisma.client.findFirst({
        where: { id: clientId, organizationId },
      });
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
    }

    const project = await prisma.project.create({
      data: {
        organizationId,
        name,
        description: description ?? null,
        clientId: clientId ?? null,
        color,
        icon: icon ?? null,
        hourlyRate: role === 'MEMBER' ? 0 : hourlyRate,
        isBillable,
      },
      include: {
        client: { select: { id: true, name: true, currency: true } },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error('[projects POST] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
