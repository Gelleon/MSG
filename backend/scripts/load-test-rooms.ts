import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RoomsService } from '../src/rooms/rooms.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function runLoadTest() {
  console.log('Initializing NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const roomsService = app.get(RoomsService);
  const prismaService = app.get(PrismaService);

  console.log('Starting load test: Creating 1000 rooms simultaneously...');

  const totalRooms = 1000;
  
  // Cleanup before test to ensure clean state
  console.log('Cleaning up previous load test data...');
  await prismaService.room.deleteMany({ where: { name: { startsWith: 'LoadTestRoom-' } } });

  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < totalRooms; i++) {
    const roomName = `LoadTestRoom-${Date.now()}-${i}`;
    promises.push(
      roomsService.create({
        name: roomName,
        description: 'Load test room',
        isPrivate: false,
      }).catch(err => {
        console.error(`Failed to create room ${i}:`, err.message);
        return null;
      })
    );
  }

  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  const successCount = results.filter(r => r !== null).length;

  console.log(`Load test completed in ${duration}ms`);
  console.log(`Successfully created: ${successCount}/${totalRooms}`);
  console.log(`Average time per room: ${duration / totalRooms}ms`);
  console.log(`Throughput: ${(successCount / (duration / 1000)).toFixed(2)} rooms/sec`);

  // Verification of unique constraint under load
  // Try to create a duplicate
  console.log('Testing duplicate creation under load...');
  try {
    await roomsService.create({
      name: `LoadTestRoom-${Date.now()}-0`, // Should ideally exist or we use a fixed name
      description: 'Duplicate test',
    });
    // Note: The specific name above might not exist if it was cleaned up or generation changed, 
    // but let's try to create two with SAME name now.
  } catch (e) {}

  const duplicateName = `LoadTestDuplicate-${Date.now()}`;
  await roomsService.create({ name: duplicateName, description: 'Original' });
  try {
    await roomsService.create({ name: duplicateName, description: 'Duplicate' });
    console.error('FAILED: Duplicate room creation should have thrown an error!');
  } catch (error) {
    console.log('PASSED: Duplicate room creation blocked:', error.message);
  }

  // Cleanup
  console.log('Cleaning up...');
  await prismaService.room.deleteMany({ where: { name: { startsWith: 'LoadTestRoom-' } } });
  await prismaService.room.deleteMany({ where: { name: { startsWith: 'LoadTestDuplicate-' } } });
  
  await app.close();
}

runLoadTest().catch(err => {
  console.error('Fatal error during load test:', err);
  process.exit(1);
});
