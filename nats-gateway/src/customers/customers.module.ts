import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: process.env.NATS_SERVER,
        },
      },
    ]),
  ],
  controllers: [CustomersController],
  providers: [],
})
export class CustomersModule {}
