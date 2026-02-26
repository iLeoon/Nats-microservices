import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { of } from 'rxjs';

const mockClientProxy = { send: jest.fn() };

const sampleProduct = {
  product_id: 1,
  product_name: 'Widget',
  unit_price: 9.99,
  units_in_stock: 50,
};

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: 'NATS_SERVICE', useValue: mockClientProxy }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    jest.clearAllMocks();
  });

  it('create() sends products.createProduct with payload', () => {
    const dto = {
      product_name: 'Widget',
      unit_price: 9.99,
      units_in_stock: 50,
    };
    mockClientProxy.send.mockReturnValue(of(sampleProduct));

    const result = controller.create(dto);

    expect(mockClientProxy.send).toHaveBeenCalledWith(
      'products.createProduct',
      dto,
    );
    result.subscribe((r) => expect(r).toEqual(sampleProduct));
  });

  it('findAll() sends products.findAllProducts', () => {
    mockClientProxy.send.mockReturnValue(of([sampleProduct]));

    const result = controller.findAll();

    expect(mockClientProxy.send).toHaveBeenCalledWith(
      'products.findAllProducts',
      '',
    );
    result.subscribe((r) => expect(r).toEqual([sampleProduct]));
  });

  it('findOne() sends products.findOneProduct with numeric id', () => {
    mockClientProxy.send.mockReturnValue(of(sampleProduct));

    const result = controller.findOne(1);

    expect(mockClientProxy.send).toHaveBeenCalledWith(
      'products.findOneProduct',
      1,
    );
    result.subscribe((r) => expect(r).toEqual(sampleProduct));
  });

  it('update() sends products.updateProduct with id and dto', () => {
    const dto = { product_name: 'Updated Widget' };
    mockClientProxy.send.mockReturnValue(of({ ...sampleProduct, ...dto }));

    const result = controller.update(1, dto);

    expect(mockClientProxy.send).toHaveBeenCalledWith(
      'products.updateProduct',
      {
        id: 1,
        updateProductDto: dto,
      },
    );
  });

  it('JwtAuthGuard is applied on the controller', () => {
    const guards = Reflect.getMetadata('__guards__', ProductsController);
    expect(guards).toBeDefined();
    expect(guards.length).toBeGreaterThan(0);
  });
});
