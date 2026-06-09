import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

bootstrapHttpApp(AppModule, {
  title: 'AdotaPet — Catalog Service',
  description: 'Gerenciamento do catálogo de pets disponíveis para adoção',
  globalPrefix: 'v1',
});
