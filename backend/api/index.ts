import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as express from 'express';

const server = express();
let isAppInitialized = false;

async function bootstrap() {
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
    try {
      await bootstrap();
    } catch (err: any) {
      console.error('NestJS Bootstrap Error:', err);
      return res.status(500).json({
        statusCode: 500,
        message: 'Error al inicializar NestJS en Vercel Serverless',
        error: err?.message || String(err),
        stack: err?.stack,
      });
    }
  }

  return server(req, res);
}
