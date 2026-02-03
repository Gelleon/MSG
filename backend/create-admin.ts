import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'pallermo72@gmail.com';
  const password = 'password123'; // Default password
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`Creating/Updating user ${email}...`);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      password: hashedPassword
    },
    create: {
      email,
      name: 'Pallermo',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('User processed successfully:');
  console.log({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });
  console.log(`Password set to: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
