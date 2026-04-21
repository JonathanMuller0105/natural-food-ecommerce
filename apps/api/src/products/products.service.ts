import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getFilteredProducts(filters: any) {
    const { isGlutenFree, isLactoseFree, isOrganic, search } = filters;

    return this.prisma.product.findMany({
      where: {
        ...(isGlutenFree && { isGlutenFree: true }),
        ...(isLactoseFree && { isLactoseFree: true }),
        ...(isOrganic && { isOrganic: true }),
        ...(search && {
          name: { contains: search, mode: 'insensitive' },
        }),
      },
      orderBy: { name: 'asc' },
    });
  }
}