"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const rooms_service_1 = require("../src/rooms/rooms.service");
const prisma_service_1 = require("../src/prisma/prisma.service");
async function runLoadTest() {
    console.log('Initializing NestJS application context...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const roomsService = app.get(rooms_service_1.RoomsService);
    const prismaService = app.get(prisma_service_1.PrismaService);
    console.log('Starting load test: Creating 1000 rooms simultaneously...');
    const totalRooms = 1000;
    console.log('Cleaning up previous load test data...');
    await prismaService.room.deleteMany({ where: { name: { startsWith: 'LoadTestRoom-' } } });
    const startTime = Date.now();
    const promises = [];
    for (let i = 0; i < totalRooms; i++) {
        const roomName = `LoadTestRoom-${Date.now()}-${i}`;
        promises.push(roomsService.create({
            name: roomName,
            description: 'Load test room',
            isPrivate: false,
        }).catch(err => {
            console.error(`Failed to create room ${i}:`, err.message);
            return null;
        }));
    }
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    const successCount = results.filter(r => r !== null).length;
    console.log(`Load test completed in ${duration}ms`);
    console.log(`Successfully created: ${successCount}/${totalRooms}`);
    console.log(`Average time per room: ${duration / totalRooms}ms`);
    console.log(`Throughput: ${(successCount / (duration / 1000)).toFixed(2)} rooms/sec`);
    console.log('Testing duplicate creation under load...');
    try {
        await roomsService.create({
            name: `LoadTestRoom-${Date.now()}-0`,
            description: 'Duplicate test',
        });
    }
    catch (e) { }
    const duplicateName = `LoadTestDuplicate-${Date.now()}`;
    await roomsService.create({ name: duplicateName, description: 'Original' });
    try {
        await roomsService.create({ name: duplicateName, description: 'Duplicate' });
        console.error('FAILED: Duplicate room creation should have thrown an error!');
    }
    catch (error) {
        console.log('PASSED: Duplicate room creation blocked:', error.message);
    }
    console.log('Cleaning up...');
    await prismaService.room.deleteMany({ where: { name: { startsWith: 'LoadTestRoom-' } } });
    await prismaService.room.deleteMany({ where: { name: { startsWith: 'LoadTestDuplicate-' } } });
    await app.close();
}
runLoadTest().catch(err => {
    console.error('Fatal error during load test:', err);
    process.exit(1);
});
//# sourceMappingURL=load-test-rooms.js.map