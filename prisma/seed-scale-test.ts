import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const COLORS = ['#3730A3', '#DC2626', '#059669', '#D97706', '#7C3AED', '#2563EB', '#DB2777', '#0891B2', '#65A30D', '#EA580C'];
const DESCRIPTIONS = [
  'Client meeting', 'Code review', 'Feature development', 'Bug fix', 'Testing',
  'Documentation', 'Design review', 'Sprint planning', 'Deployment', 'Research',
  'Database migration', 'API integration', 'UI polish', 'Performance tuning', 'Security audit',
  'Stakeholder call', 'Refactoring', 'Infrastructure setup', 'Monitoring setup', 'Data analysis',
];
const CLIENT_NAMES = [
  'Acme Corp', 'TechFlow Inc', 'Blue Ridge Partners', 'Pinnacle Systems', 'Nova Digital',
  'Vertex Solutions', 'Summit Analytics', 'Cascade Media', 'Horizon Labs', 'Atlas Finance',
  'Redwood Consulting', 'Granite Health', 'Pacific Ventures', 'Sterling Group', 'Ironclad Security',
  'Osprey Logistics', 'Beacon Capital', 'Trident Software', 'Compass Data', 'Evergreen Services',
];
const PROJECT_PREFIXES = [
  'Website Redesign', 'Mobile App', 'API Platform', 'Dashboard', 'Analytics Engine',
  'CRM Integration', 'Payment System', 'Inventory Mgmt', 'HR Portal', 'Compliance Tool',
];

async function main() {
  console.log('Cleaning existing data...');
  await prisma.timeEntry.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.timePeriod.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('Creating organization...');
  const org = await prisma.organization.create({
    data: {
      name: 'Scale Test Organization',
      slug: 'scale-test-org',
      plan: 'TEAM',
      billingPeriod: 'MONTHLY',
    },
  });

  console.log('Creating 50 users...');
  const passwordHash = await bcrypt.hash('password123', 12);
  const users = [];
  for (let i = 0; i < 50; i++) {
    const role = i < 2 ? 'OWNER' : i < 5 ? 'ADMIN' : 'MEMBER';
    const user = await prisma.user.create({
      data: {
        email: `user${i}@scaletest.com`,
        name: `Test User ${i}`,
        passwordHash,
        role: role as 'OWNER' | 'ADMIN' | 'MEMBER',
        organizationId: org.id,
      },
    });
    users.push(user);
  }
  console.log(`  Created ${users.length} users (2 owners, 3 admins, 45 members)`);

  console.log('Creating 20 clients...');
  const clients = [];
  for (let i = 0; i < 20; i++) {
    const client = await prisma.client.create({
      data: {
        name: CLIENT_NAMES[i],
        organizationId: org.id,
        email: `billing@${CLIENT_NAMES[i].toLowerCase().replace(/\s+/g, '')}.com`,
        currency: randomItem(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
      },
    });
    clients.push(client);
  }

  console.log('Creating 50 projects...');
  const projects = [];
  for (let i = 0; i < 50; i++) {
    const client = clients[i % 20];
    const project = await prisma.project.create({
      data: {
        name: `${PROJECT_PREFIXES[i % 10]} ${Math.floor(i / 10) + 1}`,
        organizationId: org.id,
        clientId: client.id,
        color: COLORS[i % COLORS.length],
        hourlyRate: randomBetween(75, 250),
        isBillable: Math.random() > 0.1,
      },
    });
    projects.push(project);
  }

  console.log('Creating 24 billing periods (2 years monthly)...');
  const periods = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - 23 + i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - 22 + i, 0);
    const status = i < 20 ? 'PUBLISHED' : i < 22 ? 'APPROVED' : i < 23 ? 'PENDING_APPROVAL' : 'OPEN';
    const period = await prisma.timePeriod.create({
      data: {
        organizationId: org.id,
        periodType: 'MONTHLY',
        startDate,
        endDate,
        status: status as 'OPEN' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED',
        ...(status === 'PUBLISHED' ? { publishedAt: endDate } : {}),
        ...(status === 'APPROVED' || status === 'PUBLISHED' ? { approvedAt: endDate } : {}),
      },
    });
    periods.push(period);
  }

  console.log('Creating 25,000 time entries (500 per user)...');
  const BATCH_SIZE = 500;
  let totalEntries = 0;

  for (const user of users) {
    const entries = [];
    for (let e = 0; e < 500; e++) {
      const periodIdx = randomBetween(0, 23);
      const period = periods[periodIdx];
      const pStart = period.startDate.getTime();
      const pEnd = period.endDate.getTime();
      const startedAt = new Date(pStart + Math.random() * (pEnd - pStart));
      const durationSeconds = randomBetween(900, 28800); // 15min to 8hrs
      const stoppedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

      entries.push({
        userId: user.id,
        projectId: randomItem(projects).id,
        description: randomItem(DESCRIPTIONS),
        startedAt,
        stoppedAt,
        durationSeconds,
        isBillable: Math.random() > 0.15,
        timePeriodId: period.id,
      });
    }

    for (let b = 0; b < entries.length; b += BATCH_SIZE) {
      await prisma.timeEntry.createMany({
        data: entries.slice(b, b + BATCH_SIZE),
      });
    }
    totalEntries += entries.length;
    if (totalEntries % 5000 === 0) {
      console.log(`  ${totalEntries} / 25,000 entries created`);
    }
  }

  console.log(`\nDone! Created:`);
  console.log(`  1 organization`);
  console.log(`  ${users.length} users`);
  console.log(`  ${clients.length} clients`);
  console.log(`  ${projects.length} projects`);
  console.log(`  ${periods.length} billing periods`);
  console.log(`  ${totalEntries} time entries`);
  console.log(`\nLogin: user0@scaletest.com / password123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
