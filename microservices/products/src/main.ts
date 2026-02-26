import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: process.env.NATS_SERVER,
      },
    },
  );

  await app.listen();
}
bootstrap();

// Keep process alive (NATS microservice event loop guard)
setInterval(() => {}, 1000);
