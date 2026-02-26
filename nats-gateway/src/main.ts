import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const server = await app.listen(3000);

  // Set timeout on the underlying HTTP server
  server.setTimeout(15000);
  server.headersTimeout = 16000;

  console.log('[GATEWAY] ✓ Server listening on port 3000');
  console.log('[GATEWAY] Request timeout: 15s, Headers timeout: 16s');
}

bootstrap().catch((err) => {
  console.error('[GATEWAY] Bootstrap error:', err);
  process.exit(1);
});

// Keep process alive
setInterval(() => {}, 1000);
