import { Body, Controller, Inject, Post, Res } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterDto } from './dto/register-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('NATS_SERVICE') private readonly clientProxy: ClientProxy,
  ) {}

  @Post('login')
  login(@Body() body: LoginDto, @Res() res: Response) {
    return this.clientProxy.send('LoginUser', body).subscribe({
      next: (response) => {
        const { context, message } = response;
        if (context) {
          res.cookie('cookie', message, { httpOnly: false, path: '/' });
        }
        return res.status(200).send(message);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  @Post('register')
  register(@Body() body: RegisterDto, @Res() res: Response) {
    return this.clientProxy.send('RegisterUser', body).subscribe({
      next: (response) => {
        return res.status(200).send(response);
      },
      error: (err) => {
        return res.status(404).send(err);
      },
    });
  }
}
