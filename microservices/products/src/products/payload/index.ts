import { UpdateProductDto } from '../dto/update-product.dto';

export type updateProductPayload = {
  id: number;
  updateProductDto: UpdateProductDto;
};
