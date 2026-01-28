import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'adminpassword';
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const testUserEmail = 'testuser8388@example.com';
  const testUserPassword = await bcrypt.hash('password123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: testUserEmail },
    update: {
      password: testUserPassword,
    },
    create: {
      email: testUserEmail,
      name: 'Test User',
      password: testUserPassword,
      role: 'ADMIN',
    },
  });

  console.log({ admin, testUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
