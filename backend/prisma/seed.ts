import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial authentication data...');

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'System Administrator with full permissions',
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Standard employee role',
    },
  });

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Active Administrator User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@peoplepay360.com' },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      email: 'admin@peoplepay360.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      isActive: true,
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  // Inactive User (for testing inactive rejection)
  await prisma.user.upsert({
    where: { email: 'inactive@peoplepay360.com' },
    update: {
      passwordHash,
      isActive: false,
    },
    create: {
      email: 'inactive@peoplepay360.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Disabled',
      isActive: false,
      roles: {
        create: {
          roleId: employeeRole.id,
        },
      },
    },
  });

  console.log(`Seeded Admin User: ${adminUser.email}`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
