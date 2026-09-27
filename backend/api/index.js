require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('../dist/src/app.module');
const express = require('express');

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

module.exports = async (req, res) => {
  if (!isAppInitialized) {
    try {
      await bootstrap();
    } catch (err) {
      console.error('NestJS Bootstrap Error:', err);
      return res.status(500).json({
        statusCode: 500,
        message: 'Error al inicializar NestJS en Vercel Serverless',
        error: err?.message || String(err),
      });
    }
  }

  return server(req, res);
};
