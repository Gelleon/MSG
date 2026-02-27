import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const admins = [
    { email: 'pallermo72@gmail.com', name: 'Super Admin 1' },
    { email: 'svzelenin@gmail.com', name: 'Super Admin 2' },
  ];

  // Можно задать временный пароль, который пользователи потом сменят
  const tempPassword = 'AdminPassword123!';
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  console.log('--- Adding Super Admins ---');

  for (const admin of admins) {
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        role: 'ADMIN', // В вашей системе ADMIN используется как высшая роль
        name: admin.name,
      },
      create: {
        email: admin.email,
        name: admin.name,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'OFFLINE',
      },
    });
    console.log(`User ${user.email} is now ${user.role}`);
  }

  console.log('\nTemporary password for new accounts:', tempPassword);
  console.log('--- Done ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
