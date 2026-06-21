import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  const port = Number(process.env.PORT || process.env.BACKEND_PORT || 3001);
  
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('古籍修复排程系统 API')
    .setDescription('图书馆古籍修复排程系统的 RESTful API 接口文档')
    .setVersion('1.0')
    .addTag('古籍')
    .addTag('修复')
    .addTag('排程')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API documentation: http://localhost:${port}/api`);
}

bootstrap();
