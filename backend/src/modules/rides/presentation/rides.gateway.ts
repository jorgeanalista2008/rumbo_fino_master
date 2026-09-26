import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RedisService } from '../../../core/redis/redis.service';

interface LocationUpdatePayload {
  driverId: string;
  rideId?: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'rides',
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RidesGateway.name);

  constructor(private readonly redisService: RedisService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado a WebSockets: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('driver:location_update')
  async handleDriverLocation(
    @MessageBody() payload: LocationUpdatePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { driverId, rideId, latitude, longitude, heading, speed } = payload;

    // 1. Update fast spatial cache in Redis
    await this.redisService.updateDriverLocation(driverId, latitude, longitude);

    // 2. Broadcast live telemetry stream if trip is active
    if (rideId) {
      this.server.to(`ride:${rideId}`).emit('ride:telemetry_stream', {
        driverId,
        latitude,
        longitude,
        heading,
        speed,
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Broadcast to all dispatchers in Backoffice
    this.server.emit('driver:global_location', {
      driverId,
      rideId,
      latitude,
      longitude,
      heading,
      speed,
      timestamp: new Date().toISOString(),
    });

    return { status: 'acknowledged' };
  }

  @SubscribeMessage('ride:join_room')
  handleJoinRideRoom(
    @MessageBody() payload: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`ride:${payload.rideId}`);
    return { status: 'joined', room: `ride:${payload.rideId}` };
  }

  emitStatusChange(rideId: string, currentStatus: string, metadata?: any) {
    this.server.to(`ride:${rideId}`).emit('ride:status_changed', {
      rideId,
      status: currentStatus,
      metadata,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to backoffice dispatch console
    this.server.emit('ride:global_status', {
      rideId,
      status: currentStatus,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  emitRideCreated(ride: any) {
    this.server.emit('ride:created', {
      ride,
      timestamp: new Date().toISOString(),
    });
  }

  emitBcvRateUpdated(rateData: any) {
    this.server.emit('financials:bcv_rate_updated', {
      ...rateData,
      timestamp: new Date().toISOString(),
    });
  }
}
