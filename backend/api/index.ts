import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as express from 'express';

const server = express();
let isAppInitialized = false;
let initError: any = null;
const logger = new Logger('VercelServerless');

async function bootstrapServer() {
  try {
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
    logger.log('✅ NestJS Serverless Application initialized successfully on Vercel');
  } catch (err: any) {
    initError = err;
    logger.error('❌ Error initializing NestJS Serverless App:', err?.message || err);
  }
}

export default async function handler(req: any, res: any) {
  if (!isAppInitialized) {
    await bootstrapServer();
  }

  if (initError && !isAppInitialized) {
    return res.status(500).json({
      statusCode: 500,
      message: 'Error al inicializar el backend en Vercel',
      error: initError?.message || String(initError),
    });
  }

  return server(req, res);
}
