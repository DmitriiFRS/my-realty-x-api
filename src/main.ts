import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  BigInt.prototype['toJSON'] = function () {
    return this.toString();
  };
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://admin-realty-x.kelyanmedia.com',
    'https://realty-x.kelyanmedia.com',
    'https://done-theaters-insulin-tropical.trycloudflare.com/',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Домен не разрешен политикой CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const uploadsPath = join(__dirname, '..', '..', 'uploads');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res: import('express').Response) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
  });
  await app.listen(process.env.PORT ?? 4000);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
