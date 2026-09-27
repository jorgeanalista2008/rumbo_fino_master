import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as express from 'express';

const createExpressServer = () => {
  const exp: any = express;
  if (typeof exp === 'function') {
    return exp();
  }
  if (exp && typeof exp.default === 'function') {
    return exp.default();
  }
  return (express as any)();
};

const server = createExpressServer();
let isAppInitialized = false;
let initPromise: Promise<void> | null = null;

async function bootstrapServer() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  isAppInitialized = true;
}

export default async function handler(req: any, res: any) {
  if (!isAppInitialized) {
    if (!initPromise) {
      initPromise = bootstrapServer();
    }
    await initPromise;
  }

  return server(req, res);
}
