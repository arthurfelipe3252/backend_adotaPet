import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

bootstrapHttpApp(AppModule, {
  title: 'AdotaPet — Chat Service',
  description: 'Chat entre adotantes e protetores/ONGs',
  globalPrefix: 'v1',
});
