
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all users...');
  const users = await prisma.user.findMany();
  console.table(users.map(u => ({ id: u.id, email: u.email, role: u.role })));

  console.log('\n--- Simulation ---');
  
  // Simulate getRoomUsers filter
  const nonClients = users.filter(u => u.role !== 'CLIENT');
  console.log(`Users passing "role !== 'CLIENT'" (Backend getRoomUsers): ${nonClients.length}`);
  nonClients.forEach(u => console.log(` - ${u.email} (${u.role})`));

  // Simulate Frontend PrivateSessionModal filter
  // u.role && u.role.toUpperCase() !== 'CLIENT'
  const frontendVisible = users.filter(u => u.role && u.role.toUpperCase() !== 'CLIENT');
  console.log(`\nUsers passing "role && role.toUpperCase() !== 'CLIENT'" (Frontend Modal): ${frontendVisible.length}`);
  frontendVisible.forEach(u => console.log(` - ${u.email} (${u.role})`));

  // Check specifically for Manager
  const managers = users.filter(u => u.role === 'MANAGER');
  console.log(`\nManagers found: ${managers.length}`);
  managers.forEach(m => {
    console.log(`Checking Manager ${m.email}:`);
    console.log(` - role: '${m.role}'`);
    console.log(` - role !== 'CLIENT': ${m.role !== 'CLIENT'}`);
    console.log(` - role.toUpperCase() !== 'CLIENT': ${m.role?.toUpperCase() !== 'CLIENT'}`);
  });

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
