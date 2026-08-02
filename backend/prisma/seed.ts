// Import Prisma client and the Role enum
import { PrismaClient, Role } from "@prisma/client";
// Import argon2 for password hashing
import * as argon2 from "argon2";

// Instantiate PrismaClient – this will connect to the database
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Generate hashes for the default passwords
  // We use argon2.hash() which is asynchronous and returns a string
  const adminPassword = await argon2.hash("Admin123!");
  const userPassword = await argon2.hash("User123!");

  // Upsert: if user with email exists, do nothing (update: {}) ; else create
  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {}, // No update needed
    create: {
      email: "admin@admin.com",
      password: adminPassword,
      name: "Admin User",
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
      // refreshToken is omitted – it will be null by default
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  const user = await prisma.user.upsert({
    where: { email: "user@user.com" },
    update: {},
    create: {
      email: "user@user.com",
      password: userPassword,
      name: "Regular User",
      role: Role.USER,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ User created: ${user.email}`);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect Prisma client after seeding
    await prisma.$disconnect();
  });
