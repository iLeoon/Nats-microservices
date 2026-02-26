import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const sampleProduct = {
  product_id: 1,
  product_name: 'Test Widget',
  unit_price: 19.99,
  units_in_stock: 100,
};

describe('ProductsController (NATS microservice)', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    jest.clearAllMocks();
  });

  it('create() calls service.create with the dto and returns result', async () => {
    const dto = {
      product_name: 'Test Widget',
      unit_price: 19.99,
      units_in_stock: 100,
    };
    mockService.create.mockResolvedValue(sampleProduct);

    const result = await controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(sampleProduct);
  });

  it('findAll() returns all products from the service', async () => {
    mockService.findAll.mockResolvedValue([sampleProduct]);

    const result = await controller.findAll();

    expect(mockService.findAll).toHaveBeenCalled();
    expect(result).toEqual([sampleProduct]);
  });

  it('findOne() returns a single product by id', async () => {
    mockService.findOne.mockResolvedValue(sampleProduct);

    const result = await controller.findOne(1);

    expect(mockService.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(sampleProduct);
  });

  it('findOne() returns undefined when product does not exist', async () => {
    mockService.findOne.mockResolvedValue(undefined);

    const result = await controller.findOne(999);

    expect(result).toBeUndefined();
  });

  it('update() calls service.update with id and dto', async () => {
    const dto = {
      product_name: 'Renamed',
      unit_price: 29.99,
      units_in_stock: 5,
    };
    const updated = { ...sampleProduct, ...dto };
    mockService.update.mockResolvedValue(updated);

    const result = await controller.update({ id: 1, updateProductDto: dto });

    expect(mockService.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(updated);
  });
});
