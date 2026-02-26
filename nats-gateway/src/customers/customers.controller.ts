import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    @Inject('NATS_SERVICE') private readonly clientProxy: ClientProxy,
  ) {}

  @Get('findAll')
  getCustomers() {
    return this.clientProxy.send('customers.findCustomers', '');
  }

  @Get(':id')
  getCustomer(@Param('id') id: string) {
    return this.clientProxy.send('customers.findCustomer', id);
  }

  @Post('create')
  createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.clientProxy.send('customers.createCustomer', createCustomerDto);
  }

  @Patch('update/:id')
  updateCustomer(@Body() data: UpdateCustomerDto, @Param('id') id: string) {
    return this.clientProxy.send('customers.updateCustomer', {
      customer: data,
      id,
    });
  }

  @Delete('delete/:id')
  deleteCustomer() {
    return this.clientProxy.send('customers.deleteCustomer', '');
  }
}
