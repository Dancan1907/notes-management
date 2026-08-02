// backend/test/db-helper.ts
import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/test_db";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL,
    },
  },
});

export async function setupTestDB() {
  try {
    await execAsync(`npx prisma db push --force-reset`, {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    });
    console.log("✅ Test database synced");
  } catch (error) {
    console.error("❌ Failed to sync test database:", error);
    throw error;
  }
}

export async function cleanTestDB() {
  try {
    // Delete all data (order doesn't matter with deleteMany)
    await prisma.user.deleteMany({});
    console.log("✅ Test database cleaned");
  } catch (error) {
    console.error("❌ Failed to clean test database:", error);
    throw error;
  }
}
