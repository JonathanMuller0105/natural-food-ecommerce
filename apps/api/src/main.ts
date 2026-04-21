import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita o CORS para que nosso Next.js possa fazer requisições seguras para a API
  app.enableCors({
    origin: 'http://localhost:3000', // Apenas nosso front-end tem permissão
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Alteramos a porta para 3333 (padrão de mercado para Back-end)
  await app.listen(3333);
}
bootstrap();