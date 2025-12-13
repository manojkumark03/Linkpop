const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@acme.com';
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Admin User',
      role: 'ADMIN',
      password: adminPassword,
    },
    create: {
      email: adminEmail,
      name: 'Admin User',
      role: 'ADMIN',
      password: adminPassword,
    },
  });

  console.log('Admin user created:', { email: adminEmail, password: 'Admin123!' });

  const demoEmail = 'demo@acme.com';

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { name: 'Demo User' },
    create: {
      email: demoEmail,
      name: 'Demo User',
    },
  });

  const profile = await prisma.profile.upsert({
    where: { slug: 'demo' },
    update: {
      userId: user.id,
      displayName: 'Demo Profile',
      themeSettings: {
        mode: 'dark',
        accent: 'violet',
      },
    },
    create: {
      userId: user.id,
      slug: 'demo',
      displayName: 'Demo Profile',
      bio: 'Seeded profile for local development.',
      themeSettings: {
        mode: 'dark',
        accent: 'violet',
      },
    },
  });

  const links = [
    {
      slug: 'github',
      title: 'GitHub',
      url: 'https://github.com/',
      position: 1,
    },
    {
      slug: 'docs',
      title: 'Docs',
      url: 'https://nextjs.org/docs',
      position: 2,
    },
  ];

  const createdLinks = [];
  for (const link of links) {
    const created = await prisma.link.upsert({
      where: {
        profileId_slug: {
          profileId: profile.id,
          slug: link.slug,
        },
      },
      update: {
        title: link.title,
        url: link.url,
        position: link.position,
      },
      create: {
        profileId: profile.id,
        slug: link.slug,
        title: link.title,
        url: link.url,
        position: link.position,
      },
    });
    createdLinks.push(created);
  }

  await prisma.subscription.upsert({
    where: { providerSubscriptionId: 'sub_demo' },
    update: {
      userId: user.id,
      plan: 'PRO',
      status: 'ACTIVE',
    },
    create: {
      userId: user.id,
      plan: 'PRO',
      status: 'ACTIVE',
      provider: 'stripe',
      providerCustomerId: 'cus_demo',
      providerSubscriptionId: 'sub_demo',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  await prisma.analytics.deleteMany({
    where: { linkId: { in: createdLinks.map((l) => l.id) } },
  });

  await prisma.analytics.createMany({
    data: createdLinks.flatMap((link) => [
      {
        linkId: link.id,
        clickedAt: new Date(Date.now() - 1000 * 60 * 10),
        country: 'US',
        referrer: 'https://google.com',
        deviceType: 'DESKTOP',
        userAgent: 'seed',
      },
      {
        linkId: link.id,
        clickedAt: new Date(Date.now() - 1000 * 60 * 5),
        country: 'DE',
        referrer: 'https://twitter.com',
        deviceType: 'MOBILE',
        userAgent: 'seed',
      },
    ]),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
