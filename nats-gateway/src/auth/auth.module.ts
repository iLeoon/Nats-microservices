import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from 'src/guards/jwt.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1h' },
    }),

    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: process.env.NATS_SERVER,
          timeout: 5000,
          maxReconnectAttempts: 3,
          reconnectTimeWait: 100,
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard],
})
export class AuthModule {}
