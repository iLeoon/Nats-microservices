import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { updateProductPayload } from './payload';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('createProduct')
  async create(@Payload() createProductDto: CreateProductDto) {
    console.log(createProductDto);
    return await this.productsService.create(createProductDto);
  }

  @MessagePattern('findAllProducts')
  async findAll() {
    return await this.productsService.findAll();
  }

  @MessagePattern('findOneProduct')
  findOne(@Payload() id: number) {
    console.log(id);
    return this.productsService.findOne(id);
  }

  @MessagePattern('updateProduct')
  async update(@Payload() { id, updateProductDto }: updateProductPayload) {
    return await this.productsService.update(id, updateProductDto);
  }
}
