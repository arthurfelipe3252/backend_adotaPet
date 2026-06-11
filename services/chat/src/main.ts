import 'reflect-metadata';
import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

bootstrapHttpApp(AppModule, {
  title: 'Chat Service',
  description: 'Chat integrado entre adotante e protetor/ONG',
  globalPrefix: 'v1',
});
