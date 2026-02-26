// Shared configuration for all k6 tests
export const BASE_URL = 'http://localhost:3000';

export const TEST_USER = {
  username: 'testuser_k6',
  email: 'k6test@example.com',
  password: 'Password123!',
};

export const TEST_PRODUCT = {
  product_name: 'k6 Test Product',
  unit_price: 9.99,
  units_in_stock: 100,
};

export const TEST_CUSTOMER = {
  customer_id: 'K6TS',
  contact_name: 'K6 Test User',
  city: 'Cairo',
  country: 'Egypt',
};
