import 'reflect-metadata';
import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

bootstrapHttpApp(AppModule, {
  title: 'User Auth Service',
  description: 'Autenticação, registro e gestão de usuários (adotantes, protetores, ONGs)',
  globalPrefix: 'v1',
});
