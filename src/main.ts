import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('REVOLN E-Commerce API')
    .setDescription('Complete REST API for REVOLN E-Commerce Backend')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  writeFileSync(
    './openapi.json',
    JSON.stringify(document, null, 2),
  );

  await app.listen(process.env.PORT ?? 5000);

  console.log(`Server running on http://localhost:${process.env.PORT ?? 5000}`);
}

bootstrap();