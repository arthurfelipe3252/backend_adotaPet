import 'reflect-metadata';
import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

bootstrapHttpApp(AppModule, {
  title: 'Adoption Service',
  description: 'Pipeline de adoção — solicitações, aprovações e acompanhamento',
  globalPrefix: 'v1',
});
