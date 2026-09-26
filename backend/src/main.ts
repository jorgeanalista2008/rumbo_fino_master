import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('RumboFinoBootstrap');
  const app = await NestFactory.create(AppModule);

  // ---------------------------------------------------------------------------
  // Configuración de servicio de archivos estáticos (Carpeta uploads)
  // ---------------------------------------------------------------------------
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ---------------------------------------------------------------------------
  // Configuración de OpenAPI / Swagger UI
  // ---------------------------------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('Rumbo Fino - Executive Mobility & Fleet API')
    .setDescription(
      'Documentación interactiva de la API REST de la plataforma Rumbo Fino. Permite probar endpoints de autenticación, expedientes de vehículos, choferes, turnos, viajes en tiempo real, finanzas y calificaciones.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Introduce el token JWT obtenido desde POST /api/v1/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Endpoints de registro, autenticación JWT y perfil')
    .addTag('Vehicles', 'Gestión de ficha técnica de vehículos y expediente digital (PDFs/Fotos)')
    .addTag('Drivers', 'Perfil de choferes, turnos con odómetro y disponibilidad en línea')
    .addTag('Rides', 'Motor de viajes, máquina de estados y despacho')
    .addTag('Financials', 'Balances de choferes, transacciones y recaudación de comisiones')
    .addTag('Reviews', 'Sistema de valoraciones (1-5 estrellas) y reputación')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Rumbo Fino API Docs - Swagger UI',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Backend escuchando en: http://localhost:${port}/api/v1`);
  logger.log(`📑 Documentación Swagger UI disponible en: http://localhost:${port}/api/docs`);
}

bootstrap();
