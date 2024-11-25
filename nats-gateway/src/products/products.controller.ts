import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Inject,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from 'src/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(
    @Inject('NATS_SERVICE') private readonly clientProxy: ClientProxy,
  ) {}

  @Post('create')
  create(@Body() createProductDto: CreateProductDto) {
    return this.clientProxy.send('createProduct', createProductDto);
  }

  @Get('findAll')
  findAll() {
    return this.clientProxy.send('findAllProducts', '');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientProxy.send('findOneProduct', id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.clientProxy.send('updateProduct', { id, updateProductDto });
  }
}
