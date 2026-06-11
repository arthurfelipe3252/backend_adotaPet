import 'reflect-metadata';
import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

bootstrapHttpApp(AppModule, {
  title: 'Reports Service',
  description: 'Dashboard de KPIs e métricas para ONGs e protetores',
  globalPrefix: 'v1',
});
