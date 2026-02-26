import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { of } from 'rxjs';

const mockClientProxy = { send: jest.fn() };

const sample = {
  customer_id: 'ABCD',
  contact_name: 'Alice',
  city: 'Cairo',
  country: 'Egypt',
};

describe('CustomersController', () => {
  let controller: CustomersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [{ provide: 'NATS_SERVICE', useValue: mockClientProxy }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CustomersController>(CustomersController);
    jest.clearAllMocks();
  });

  it('getCustomers() sends customers.findCustomers', () => {
    mockClientProxy.send.mockReturnValue(of([sample]));
    const result = controller.getCustomers();
    expect(mockClientProxy.send).toHaveBeenCalledWith(
      'customers.findCustomers',
      '',
    );
    result.subscribe((r) => expect(r).toEqual([sample]));
  });

  it('getCustomer() sends customers.findCustomer with id', () => {
    mockClientProxy.send.mockReturnValue(of(sample));
    const result = controller.getCustomer('ABCD');
    expect(mockClientProxy.send).toHaveBeenCalledWith(
      'customers.findCustomer',
      'ABCD',
    );
    result.subscribe((r) => expect(r).toEqual(sample));
  });

  it('createCustomer() sends customers.createCustomer with dto', () => {
    mockClientProxy.send.mockReturnValue(of(sample));
    const dto = {
      customer_id: 'ABCD',
      contact_name: 'Alice',
      city: 'Cairo',
      country: 'Egypt',
    };
    const result = controller.createCustomer(dto);
    expect(mockClientProxy.send).toHaveBeenCalledWith(
      'customers.createCustomer',
      dto,
    );
    result.subscribe((r) => expect(r).toEqual(sample));
  });

  it('updateCustomer() sends customers.updateCustomer with data and id', () => {
    mockClientProxy.send.mockReturnValue(of({ ...sample, city: 'Alex' }));
    const dto = { city: 'Alex' };
    controller.updateCustomer(dto, 'ABCD');
    expect(mockClientProxy.send).toHaveBeenCalledWith(
      'customers.updateCustomer',
      {
        customer: dto,
        id: 'ABCD',
      },
    );
  });

  it('deleteCustomer() sends customers.deleteCustomer', () => {
    mockClientProxy.send.mockReturnValue(of(null));
    controller.deleteCustomer();
    expect(mockClientProxy.send).toHaveBeenCalledWith(
      'customers.deleteCustomer',
      '',
    );
  });

  it('JwtAuthGuard is applied on the controller', () => {
    const guards = Reflect.getMetadata('__guards__', CustomersController);
    expect(guards).toBeDefined();
    expect(guards.length).toBeGreaterThan(0);
  });
});
