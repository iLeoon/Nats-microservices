import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { updateProductPayload } from './payload';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @MessagePattern('products.createProduct')
  async create(@Payload() createProductDto: CreateProductDto) {
    console.log(createProductDto);
    return await this.productsService.create(createProductDto);
  }

  @MessagePattern('products.findAllProducts')
  async findAll(@Payload() query: { page?: number; limit?: number }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    return await this.productsService.findAll(page, limit);
  }

  @MessagePattern('products.findOneProduct')
  findOne(@Payload() id: number) {
    console.log(id);
    return this.productsService.findOne(id);
  }

  @MessagePattern('products.updateProduct')
  async update(@Payload() { id, updateProductDto }: updateProductPayload) {
    return await this.productsService.update(id, updateProductDto);
  }
}
