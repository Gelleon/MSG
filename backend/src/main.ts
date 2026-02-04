import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  try {
    console.log('Starting application...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Global Validation Pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

    // Security Headers
    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow resource loading
      }),
    );

    // CORS Configuration
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    // Serve static files from uploads directory
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: '/uploads/',
    });
    const port = process.env.PORT ?? 4000;
    console.log(`Listening on port ${port}...`);
    await app.listen(port);
    console.log(`Application started on port ${port}`);
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}
bootstrap();
