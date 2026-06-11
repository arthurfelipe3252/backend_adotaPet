import 'reflect-metadata';
import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

bootstrapHttpApp(AppModule, {
  title: 'Catalog Service',
  description: 'Catálogo de pets disponíveis para adoção (fotos, temperamento, porte)',
  globalPrefix: 'v1',
});
