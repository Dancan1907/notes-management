// backend/prisma/seed.ts

// Import Prisma client and the Role enum
import { PrismaClient, Role } from '@prisma/client';
// Import argon2 for password hashing
import * as argon2 from 'argon2';

// Instantiate PrismaClient – this will connect to the database
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);

  const isProduction = process.env.NODE_ENV === 'production';

  // ✅ ALWAYS: Create/update real admin account (works everywhere)
  const realAdminPassword = await argon2.hash(
    process.env.REAL_ADMIN_PASSWORD || 'YourStrongPassword123!'
  );

  const realAdmin = await prisma.user.upsert({
    where: { email: 'dancankalerwa@gmail.com' },
    update: {
      name: 'Dancan Kalerwa',
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
      password: realAdminPassword, // Update if password changes
    },
    create: {
      email: 'dancankalerwa@gmail.com',
      password: realAdminPassword,
      name: 'Dancan Kalerwa',
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Real admin: ${realAdmin.email} (${realAdmin.role})`);

  // ⚠️ ONLY IN DEVELOPMENT: Create test users
  if (!isProduction) {
    console.log('🔧 Development mode: Creating test users...');

    // Generate hashes for the default passwords
    const adminPassword = await argon2.hash('Admin123!');
    const userPassword = await argon2.hash('User123!');

    // Upsert: if user with email exists, do nothing (update: {}) ; else create
    const admin = await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: {}, // No update needed
      create: {
        email: 'admin@admin.com',
        password: adminPassword,
        name: 'Admin User',
        role: Role.ADMIN,
        isActive: true,
        emailVerified: true,
      },
    });
    console.log(`✅ Test admin: ${admin.email}`);

    const user = await prisma.user.upsert({
      where: { email: 'user@user.com' },
      update: {},
      create: {
        email: 'user@user.com',
        password: userPassword,
        name: 'Regular User',
        role: Role.USER,
        isActive: true,
        emailVerified: true,
      },
    });
    console.log(`✅ Test user: ${user.email}`);
  } else {
    console.log('🚀 Production mode: Skipping test users');

    // Disable any existing test users in production
    const disabledUsers = await prisma.user.updateMany({
      where: {
        email: {
          in: ['admin@admin.com', 'user@user.com'],
        },
      },
      data: {
        isActive: false,
      },
    });
    console.log(`🔒 Disabled ${disabledUsers.count} test user(s) in production`);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect Prisma client after seeding
    await prisma.$disconnect();
  });
