import 'reflect-metadata';
import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

bootstrapHttpApp(AppModule, {
  title: 'Match Service',
  description: 'Match inteligente entre adotante e pet via questionário de estilo de vida',
  globalPrefix: 'v1',
});
