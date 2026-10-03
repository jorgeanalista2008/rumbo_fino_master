import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserEntity } from '../../core/database/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

const MIN_SESSION_SECONDS = 7 * 24 * 60 * 60; // 7 días
const DEFAULT_SESSION = '30d';

/**
 * jsonwebtoken interpreta un string numérico ("86400") como MILISEGUNDOS,
 * lo que generaba tokens de ~86 segundos en producción. Aquí los números
 * se tratan como segundos y se exige una duración mínima de 7 días.
 */
function resolveJwtExpiresIn(raw?: string): string | number {
  const value = (raw || '').trim();
  if (!value) return DEFAULT_SESSION;
  if (/^\d+$/.test(value)) {
    const seconds = Number(value);
    return seconds >= MIN_SESSION_SECONDS ? seconds : DEFAULT_SESSION;
  }
  const match = value.match(/^(\d+)\s*(s|m|h|d|w|y)$/i);
  if (!match) return DEFAULT_SESSION;
  const mult: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800, y: 31557600 };
  const seconds = Number(match[1]) * mult[match[2].toLowerCase()];
  return seconds >= MIN_SESSION_SECONDS ? value : DEFAULT_SESSION;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'RumboFinoSuperSecretKey2026!'),
        signOptions: {
          expiresIn: resolveJwtExpiresIn(configService.get<string>('JWT_EXPIRES_IN')),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
