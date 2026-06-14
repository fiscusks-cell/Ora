import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ORA demo data...');

  await prisma.timeEntry.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: { name: 'Smith CPA', slug: 'smith-cpa', plan: 'TEAM' },
  });

  const passwordHash = await bcrypt.hash('password123', 12);
  const owner = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'demo@ora.app',
      passwordHash,
      role: 'OWNER',
      organizationId: org.id,
    },
  });

  const member = await prisma.user.create({
    data: {
      name: 'Bob Johnson',
      email: 'bob@smith-cpa.com',
      passwordHash,
      role: 'MEMBER',
      organizationId: org.id,
    },
  });

  const acme = await prisma.client.create({
    data: { name: 'Acme Corporation', email: 'billing@acme.com', currency: 'USD', organizationId: org.id },
  });
  const river = await prisma.client.create({
    data: { name: 'Riverside Holdings', email: 'accounts@riverside.com', currency: 'USD', organizationId: org.id },
  });

  const taxPrep = await prisma.project.create({
    data: { name: 'Tax Preparation', color: '#3730A3', hourlyRate: 150, isBillable: true, clientId: acme.id, organizationId: org.id },
  });
  const bookkeeping = await prisma.project.create({
    data: { name: 'Monthly Bookkeeping', color: '#059669', hourlyRate: 95, isBillable: true, clientId: acme.id, organizationId: org.id },
  });
  const advisory = await prisma.project.create({
    data: { name: 'Financial Advisory', color: '#DC2626', hourlyRate: 200, isBillable: true, clientId: river.id, organizationId: org.id },
  });
  await prisma.project.create({
    data: { name: 'Internal Admin', color: '#64748B', hourlyRate: 0, isBillable: false, organizationId: org.id },
  });

  const projects = [taxPrep, bookkeeping, advisory];
  const descs = [
    'Q3 tax research and documentation',
    'Client meeting and review',
    'Bank reconciliation',
    'Financial statement preparation',
    'Advisory call with client',
    'Invoice review and approval',
  ];

  const entries = [];
  const now = new Date();

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    let hour = 8 + Math.floor(Math.random() * 2);
    const numEntries = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numEntries; i++) {
      const project = projects[Math.floor(Math.random() * projects.length)];
      const desc = descs[Math.floor(Math.random() * descs.length)];
      const durationHours = 0.5 + Math.random() * 2;
      const durationSeconds = Math.round(durationHours * 3600);

      const startedAt = new Date(date);
      startedAt.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
      const stoppedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

      entries.push({
        description: desc,
        startedAt,
        stoppedAt,
        durationSeconds,
        isBillable: project.isBillable,
        userId: Math.random() > 0.4 ? owner.id : member.id,
        projectId: project.id,
      });

      hour += Math.ceil(durationHours) + 1;
      if (hour >= 18) break;
    }
  }

  await prisma.timeEntry.createMany({ data: entries });

  console.log('✅ Seeded:');
  console.log('   - 1 org: Smith CPA');
  console.log('   - 2 users: demo@ora.app / password123');
  console.log('   - 2 clients, 4 projects');
  console.log(`   - ${entries.length} time entries`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
