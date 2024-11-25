import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'PostgresQl',
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Midomon123',
      database: 'northwind',
      entities: [Product],
      synchronize: false,
    }),
    ProductsModule,
  ],
})
export class AppModule {}
