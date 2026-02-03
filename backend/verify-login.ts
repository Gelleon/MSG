import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'pallermo72@gmail.com';
  const password = 'password123';

  console.log(`Checking login for ${email} with password '${password}'...`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  console.log('User found:', { id: user.id, email: user.email, role: user.role, passwordHash: user.password.substring(0, 10) + '...' });

  const isMatch = await bcrypt.compare(password, user.password);
  console.log(`Password match result: ${isMatch}`);

  if (!isMatch) {
    console.log('Generating new hash for verification...');
    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash would be:', newHash.substring(0, 10) + '...');
    const matchNew = await bcrypt.compare(password, newHash);
    console.log(`Match against new hash: ${matchNew}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
