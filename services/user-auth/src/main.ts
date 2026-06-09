import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

bootstrapHttpApp(AppModule, {
  title: 'AdotaPet — User-Auth Service',
  description: 'Autenticação, usuários, adotantes e protetores/ONGs',
  globalPrefix: 'v1',
});
