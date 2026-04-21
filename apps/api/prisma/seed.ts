import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// O 'as any' ignora o falso-positivo do TypeScript e injeta a URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
} as any);

async function main() {
  console.log('Iniciando o cadastro massivo de produtos...');

  const produtos = [
    { name: 'Pão de Amêndoas', description: 'Pão artesanal low carb e macio.', price: 22.90, stock: 15, isGlutenFree: true, isLactoseFree: true, isOrganic: false, isVegan: false, image: 'placeholder.jpg' },
    { name: 'Queijo de Caju', description: 'Queijo cremoso fermentado natural.', price: 35.50, stock: 20, isGlutenFree: true, isLactoseFree: true, isOrganic: true, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Granola Premium', description: 'Mix de castanhas e sementes assadas.', price: 28.00, stock: 50, isGlutenFree: false, isLactoseFree: true, isOrganic: true, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Iogurte de Coco', description: 'Iogurte probiótico à base de plantas.', price: 12.90, stock: 30, isGlutenFree: true, isLactoseFree: true, isOrganic: false, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Bolo de Cacau', description: 'Bolo fofinho com cacau 70%.', price: 18.50, stock: 10, isGlutenFree: true, isLactoseFree: true, isOrganic: false, isVegan: false, image: 'placeholder.jpg' },
    { name: 'Leite de Aveia', description: 'Bebida vegetal sem conservantes.', price: 15.90, stock: 40, isGlutenFree: false, isLactoseFree: true, isOrganic: true, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Biscoito de Arroz', description: 'Snack leve e crocante para o dia a dia.', price: 8.50, stock: 100, isGlutenFree: true, isLactoseFree: true, isOrganic: false, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Kombucha Frutas', description: 'Bebida gaseificada fermentada natural.', price: 14.00, stock: 25, isGlutenFree: true, isLactoseFree: true, isOrganic: true, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Tofu Orgânico', description: 'Queijo de soja rico em proteínas.', price: 19.90, stock: 15, isGlutenFree: true, isLactoseFree: true, isOrganic: true, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Pasta de Amendoim', description: 'Integral, sem açúcar adicionado.', price: 24.90, stock: 35, isGlutenFree: true, isLactoseFree: true, isOrganic: false, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Mel Cru Silvestre', description: 'Mel puro e orgânico direto do produtor.', price: 32.00, stock: 20, isGlutenFree: true, isLactoseFree: true, isOrganic: true, isVegan: false, image: 'placeholder.jpg' },
    { name: 'Barra de Proteína', description: 'Barrinha de sementes com tâmara.', price: 9.90, stock: 60, isGlutenFree: true, isLactoseFree: true, isOrganic: false, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Macarrão de Grão', description: 'Massa proteica feita de grão-de-bico.', price: 16.50, stock: 45, isGlutenFree: true, isLactoseFree: true, isOrganic: false, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Azeite Trufado', description: 'Azeite extra virgem com aroma de trufas.', price: 55.00, stock: 12, isGlutenFree: true, isLactoseFree: true, isOrganic: true, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Farinha de Coco', description: 'Ideal para receitas sem glúten.', price: 14.90, stock: 30, isGlutenFree: true, isLactoseFree: true, isOrganic: true, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Snack Grão-de-Bico', description: 'Grãos assados com páprica defumada.', price: 11.50, stock: 50, isGlutenFree: true, isLactoseFree: true, isOrganic: false, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Suco Verde', description: 'Prensado a frio com couve e maçã.', price: 13.50, stock: 20, isGlutenFree: true, isLactoseFree: true, isOrganic: true, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Chocolate 70%', description: 'Barra de chocolate vegano premium.', price: 21.00, stock: 40, isGlutenFree: true, isLactoseFree: true, isOrganic: false, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Hambúrguer Lentilha', description: 'Hambúrguer vegetal congelado.', price: 26.90, stock: 18, isGlutenFree: true, isLactoseFree: true, isOrganic: false, isVegan: true, image: 'placeholder.jpg' },
    { name: 'Tempeh Marinado', description: 'Soja fermentada com especiarias.', price: 29.90, stock: 15, isGlutenFree: true, isLactoseFree: true, isOrganic: true, isVegan: true, image: 'placeholder.jpg' },
  ];

  // Executa a inserção massiva (createMany)
  await prisma.product.createMany({
    data: produtos,
  });

  console.log('✅ 20 produtos cadastrados com sucesso no banco de dados!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao semear o banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });