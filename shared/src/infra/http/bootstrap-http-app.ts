import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';

interface BootstrapOptions {
  title: string;
  description: string;
  globalPrefix?: string;
}

export async function bootstrapHttpApp(
  AppModule: new (...args: unknown[]) => unknown,
  options: BootstrapOptions,
): Promise<void> {
  const app = await NestFactory.create(AppModule as any);

  app.enableCors({ origin: true, credentials: true });
  app.use(json({ limit: '20mb' }));

  const prefix = options.globalPrefix ?? 'v1';
  app.setGlobalPrefix(prefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Cole o access token JWT obtido em /auth/login',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[${options.title}] running on port ${port} — /${prefix}/docs`);
}
