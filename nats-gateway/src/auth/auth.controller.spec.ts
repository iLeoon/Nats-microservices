import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { of, throwError } from 'rxjs';
import { Response } from 'express';

const mockClientProxy = {
  send: jest.fn(),
};

const mockResponse = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
});

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: 'NATS_SERVICE', useValue: mockClientProxy }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  // ── login ────────────────────────────────────────────────────────────────
  describe('POST /auth/login', () => {
    it('sets cookie and sends token when context is true', () => {
      const token = 'jwt.token.here';
      mockClientProxy.send.mockReturnValue(
        of({ context: true, message: token }),
      );
      const res = mockResponse() as Response;

      controller.login({ email: 'user@test.com', password: 'pass' }, res);

      expect(mockClientProxy.send).toHaveBeenCalledWith('auth.loginUser', {
        email: 'user@test.com',
        password: 'pass',
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'cookie',
        token,
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(token);
    });

    it('sends message body without setting cookie when context is false', () => {
      mockClientProxy.send.mockReturnValue(
        of({ context: false, message: 'Invalid credentials' }),
      );
      const res = mockResponse() as Response;

      controller.login({ email: 'bad@test.com', password: 'wrong' }, res);

      expect(res.cookie).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('Invalid credentials');
    });

    it('forwards to NATS subject auth.loginUser', () => {
      mockClientProxy.send.mockReturnValue(of({ context: false, message: '' }));
      const res = mockResponse() as Response;
      const body = { email: 'a@b.com', password: '123' };

      controller.login(body, res);

      expect(mockClientProxy.send).toHaveBeenCalledWith('auth.loginUser', body);
    });
  });

  // ── register ─────────────────────────────────────────────────────────────
  describe('POST /auth/register', () => {
    it('returns 200 and response on success', () => {
      const successResponse = {
        message: 'Created the new user',
        context: true,
      };
      mockClientProxy.send.mockReturnValue(of(successResponse));
      const res = mockResponse() as Response;

      controller.register(
        { username: 'newuser', email: 'new@test.com', password: 'pass' },
        res,
      );

      expect(mockClientProxy.send).toHaveBeenCalledWith('auth.registerUser', {
        username: 'newuser',
        email: 'new@test.com',
        password: 'pass',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(successResponse);
    });

    it('returns 404 when NATS emits an error', () => {
      mockClientProxy.send.mockReturnValue(
        throwError(() => ({ message: 'Email exists' })),
      );
      const res = mockResponse() as Response;

      controller.register(
        { username: 'dup', email: 'dup@test.com', password: 'pass' },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('forwards to NATS subject auth.registerUser', () => {
      mockClientProxy.send.mockReturnValue(of({}));
      const res = mockResponse() as Response;
      const body = { username: 'u', email: 'u@u.com', password: 'p' };

      controller.register(body, res);

      expect(mockClientProxy.send).toHaveBeenCalledWith(
        'auth.registerUser',
        body,
      );
    });
  });
});
