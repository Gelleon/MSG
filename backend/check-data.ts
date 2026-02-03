import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking User...');
  const user = await prisma.user.findFirst({
    where: { email: 'pallermo72@gmail.com' }
  });
  console.log('User:', user);

  if (!user) {
    console.log('User not found by email. Searching by part...');
    const users = await prisma.user.findMany();
    console.log('All users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
    return;
  }

  console.log('\nChecking Rooms...');
  const rooms = await prisma.room.findMany({
    include: {
      members: {
        where: { userId: user.id }
      }
    }
  });
  console.log(`Found ${rooms.length} rooms`);

  for (const room of rooms) {
    console.log(`\nRoom: ${room.name} (${room.id})`);
    console.log('User Membership:', room.members[0] || 'Not a member');
    
    const messageCount = await prisma.message.count({
      where: { roomId: room.id }
    });
    console.log(`Total Messages in DB: ${messageCount}`);
    
    const messages = await prisma.message.findMany({
      where: { roomId: room.id },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('Latest 5 messages:', messages.map(m => ({ id: m.id, content: m.content, createdAt: m.createdAt })));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
