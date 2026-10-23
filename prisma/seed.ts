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

  const category = await prisma.category.upsert({
    where: { name: "Men's Wear" },
    update: {},
    create: {
      name: "Men's Wear",
      description: 'Premium menswear and essentials',
    },
  });

  const products = [
    { sku: 'REV-POLO-BLK', name: 'REVOLN Classic Polo - Black' },
    { sku: 'REV-POLO-MAR', name: 'REVOLN Classic Polo - Marron' },
    { sku: 'REV-POLO-OLV', name: 'REVOLN Classic Polo - Olive Green' },
    { sku: 'REV-POLO-BGE', name: 'REVOLN Classic Polo - Beige' },
  ];

  for (const product of products) {
    const productData = {
      name: product.name,
      description:
        'A premium polo crafted for refined everyday wear, with a comfortable fit and considered detailing.',
      price: 1999,
      stock: 20,
      isActive: true,
      category: { connect: { id: category.id } },
    };

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        sku: product.sku,
        ...productData,
      },
    });
  }

  console.log('✅ Roles, category, and polo products seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });