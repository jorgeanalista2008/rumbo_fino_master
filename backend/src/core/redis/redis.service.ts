import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private isConnected = false;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        // Reintentar suavemente cada 10 segundos sin saturar
        return 10000;
      },
    });

    // Capturar el evento 'error' para evitar que ioredis lance 'Unhandled error event'
    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger.warn(
        `Redis no está corriendo localmente en localhost:6379. El backend seguirá funcionando normalmente con PostgreSQL.`,
      );
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('✅ Conectado exitosamente a Redis.');
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  async updateDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.geoadd('drivers:locations', lng, lat, driverId);
    } catch (e) {
      // Ignorar si Redis no está activo
    }
  }

  async getNearbyDrivers(lat: number, lng: number, radiusKm: number): Promise<string[]> {
    if (!this.isConnected) return [];
    try {
      const results = await this.client.georadius('drivers:locations', lng, lat, radiusKm, 'km');
      return (results as string[]) || [];
    } catch (e) {
      return [];
    }
  }
}
