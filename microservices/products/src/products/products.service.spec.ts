import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

type MockRepo = Partial<Record<keyof Repository<Product>, jest.Mock>>;

const mockRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
});

const sampleProduct: Product = {
  product_id: 1,
  product_name: 'Sample',
  unit_price: 5.0,
  units_in_stock: 20,
};

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: MockRepo;

  beforeEach(async () => {
    repo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product, 'PostgresQl'), useValue: repo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  // ── create ───────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('calls repo.create then repo.save and returns the product', async () => {
      const dto = {
        product_name: 'Sample',
        unit_price: 5.0,
        units_in_stock: 20,
      };
      repo.create!.mockReturnValue(sampleProduct);
      repo.save!.mockResolvedValue(sampleProduct);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(sampleProduct);
      expect(result).toEqual(sampleProduct);
    });
  });

  // ── findAll ──────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('returns all products', async () => {
      repo.find!.mockResolvedValue([sampleProduct]);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalled();
      expect(result).toEqual([sampleProduct]);
    });

    it('returns an empty array when no products exist', async () => {
      repo.find!.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ──────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('returns the matching product', async () => {
      repo.findOne!.mockResolvedValue(sampleProduct);

      const result = await service.findOne(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { product_id: 1 } });
      expect(result).toEqual(sampleProduct);
    });

    it('returns undefined when product is not found', async () => {
      repo.findOne!.mockResolvedValue(undefined);
      const result = await service.findOne(999);
      expect(result).toBeUndefined();
    });
  });

  // ── update ───────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('calls repo.update with id and dto', async () => {
      const dto = {
        product_name: 'Updated',
        unit_price: 8.0,
        units_in_stock: 10,
      };
      repo.update!.mockResolvedValue({ affected: 1 });

      await service.update(1, dto);

      expect(repo.update).toHaveBeenCalledWith(1, dto);
    });
  });
});
