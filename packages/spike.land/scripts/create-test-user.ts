import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash("TestPassword123!", 10);

    const user = await prisma.user.upsert({
      where: { email: "claude-test@spike.land" },
      update: {
        passwordHash: hashedPassword,
      },
      create: {
        id: "test-user-claude-001",
        email: "claude-test@spike.land",
        name: "Claude Test User",
        emailVerified: new Date(),
        passwordHash: hashedPassword,
        role: "USER",
      },
    });

    console.log("✅ Test user created/updated successfully!");
    console.log("   Email: claude-test@spike.land");
    console.log("   Password: TestPassword123!");
    console.log("   User ID:", user.id);
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
