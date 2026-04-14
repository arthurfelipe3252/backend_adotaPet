import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DomainExceptionFilter } from '@shared/infra/http/filters/domain-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
