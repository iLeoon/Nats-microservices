import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product, 'PostgresQl')
    private readonly productRepo: Repository<Product>,
  ) { }
  async create(createProductDto: CreateProductDto) {
    const product = await this.productRepo.create(createProductDto);
    await this.productRepo.save(product);
    return product;
  }

  async findAll() {
    return await this.productRepo.find();
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { product_id: id },
    });
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    return await this.productRepo.update(id, updateProductDto);
  }
}
