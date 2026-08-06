import { PrismaClient, RoleType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: RoleType.ADMIN },
    update: {},
    create: {
      name: RoleType.ADMIN,
      description: 'System Administrator',
    },
  });

  await prisma.role.upsert({
    where: { name: RoleType.CUSTOMER },
    update: {},
    create: {
      name: RoleType.CUSTOMER,
      description: 'Customer',
    },
  });

  console.log('✅ Roles seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });