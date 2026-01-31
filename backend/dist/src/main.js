"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const path_1 = require("path");
async function bootstrap() {
    try {
        console.log('Starting application...');
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        app.enableCors({
            origin: true,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
        });
        app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
            prefix: '/uploads/',
        });
        const port = process.env.PORT ?? 4000;
        console.log(`Listening on port ${port}...`);
        await app.listen(port);
        console.log(`Application started on port ${port}`);
    }
    catch (error) {
        console.error('Error starting application:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map