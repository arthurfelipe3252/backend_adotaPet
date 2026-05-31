import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import { DomainExceptionFilter } from '@shared/infra/http/filters/domain-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Limite de body JSON elevado: cadastros de protetor/ONG enviam foto +
  // documento comprobatório em base64 inline. Cada um vai até ~5 MB de
  // arquivo binário (~7 MB em base64); 20 MB cobre o pior caso (foto +
  // documento) com folga.
  app.use(json({ limit: '20mb' }));

  // Prefixo global de API. Todas as rotas viram /api/v1/<rota>.
  app.setGlobalPrefix('api/v1');

  // Validação automática de DTOs em todos os endpoints.
  // - whitelist: remove campos não declarados nos DTOs
  // - forbidNonWhitelisted: rejeita request com 400 se enviar campo extra
  // - transform: instancia DTO class (essencial pra @Transform funcionar)
  // - enableImplicitConversion: converte string -> number nos params
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Captura DomainException (lançada por entidades quando regra de negócio
  // é violada) e mapeia pra HTTP 400 — em vez do 500 default do Nest.
  app.useGlobalFilters(new DomainExceptionFilter());

  app.enableCors({ origin: true, credentials: true });

  // -------- Swagger --------
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AdotaPet API')
    .setDescription('Backend da plataforma de adoção responsável de pets')
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
    .addTag('Users', 'Gerenciamento de usuários')
    .addTag('Auth', 'Autenticação, login, refresh e logout')
    .addTag('Adotantes', 'Cadastro de adotantes (pessoa física)')
    .addTag('Protetores e ONGs', 'Cadastro de protetores e organizações')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}


void bootstrap();


