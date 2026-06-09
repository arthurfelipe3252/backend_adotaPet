import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

bootstrapHttpApp(AppModule, {
  title: 'AdotaPet — Adoption Service',
  description: 'Gerenciamento de solicitações de adoção',
  globalPrefix: 'v1',
});
