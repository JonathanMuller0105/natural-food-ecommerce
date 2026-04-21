import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('glutenFree') glutenFree?: string,
    @Query('lactoseFree') lactoseFree?: string,
    @Query('organic') organic?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.getFilteredProducts({
      isGlutenFree: glutenFree === 'true',
      isLactoseFree: lactoseFree === 'true',
      isOrganic: organic === 'true',
      search,
    });
  }
}