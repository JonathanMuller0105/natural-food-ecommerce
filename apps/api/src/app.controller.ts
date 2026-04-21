import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller()
export class AppController {
  
  @Get()
  getHello(): string { return "API Natural Food Rodando com Sucesso!"; }

  @Post('/orders')
  async createOrder(@Body() body: any) {
    const { customerName, customerEmail, zipCode, phone, address, number, neighborhood, total, items } = body;
    const order = await prisma.order.create({
      data: {
        customerName, customerEmail, zipCode, phone, address, number, neighborhood, total: Number(total),
        items: { create: items.map((item: any) => ({ quantity: Number(item.quantity), price: Number(item.price), productId: item.productId })) },
      },
    });

    for (const item of items) {
      try {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: Number(item.quantity) } }
        });
      } catch (error) {}
    }
    return { message: 'Pedido salvo!', orderId: order.id };
  }

  @Get('/orders')
  async getAllOrders() {
    return prisma.order.findMany({ include: { items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } });
  }

  @Get('/orders/customer/:email')
  async getCustomerOrders(@Param('email') email: string) {
    return prisma.order.findMany({
      where: { customerEmail: email },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  @Patch('/orders/:id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return prisma.order.update({ where: { id }, data: { status: body.status } });
  }

  @Patch('/orders/:id/nps')
  async updateNps(@Param('id') id: string, @Body() body: { npsScore: number, npsComment: string }) {
    return prisma.order.update({
      where: { id },
      data: { npsScore: body.npsScore, npsComment: body.npsComment }
    });
  }

  @Get('/products')
  async getProducts() { return prisma.product.findMany(); }

  @Post('/products')
  async createProduct(@Body() body: any) {
    return prisma.product.create({
      data: {
        name: body.name, price: Number(body.price), stock: Number(body.stock), image: body.image,
        promotionalPrice: body.promotionalPrice ? Number(body.promotionalPrice) : null,
        promoEndDate: body.promoEndDate ? new Date(body.promoEndDate) : null,
        isGlutenFree: Boolean(body.isGlutenFree), isLactoseFree: Boolean(body.isLactoseFree),
        isOrganic: Boolean(body.isOrganic), isVegan: Boolean(body.isVegan),
      }
    });
  }

  @Patch('/products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    const dataToUpdate: any = {};
    
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.price !== undefined) dataToUpdate.price = Number(body.price);
    if (body.stock !== undefined) dataToUpdate.stock = Number(body.stock);
    if (body.promotionalPrice !== undefined) dataToUpdate.promotionalPrice = body.promotionalPrice === "" || body.promotionalPrice === null ? null : Number(body.promotionalPrice);
    if (body.promoEndDate !== undefined) dataToUpdate.promoEndDate = body.promoEndDate ? new Date(body.promoEndDate) : null;
    
    // CORREÇÃO: Agora o Back-end aceita a atualização das Imagens e Tags!
    if (body.image !== undefined) dataToUpdate.image = body.image;
    if (body.isGlutenFree !== undefined) dataToUpdate.isGlutenFree = Boolean(body.isGlutenFree);
    if (body.isLactoseFree !== undefined) dataToUpdate.isLactoseFree = Boolean(body.isLactoseFree);
    if (body.isOrganic !== undefined) dataToUpdate.isOrganic = Boolean(body.isOrganic);
    if (body.isVegan !== undefined) dataToUpdate.isVegan = Boolean(body.isVegan);

    return prisma.product.update({ where: { id }, data: dataToUpdate });
  }

  @Post('/customers')
  async createCustomer(@Body() body: any) { return prisma.customer.create({ data: body }); }
}