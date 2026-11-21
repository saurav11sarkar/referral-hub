import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from '../../helpers/fileUploder';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import pick from 'src/app/helpers/pick';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @UseInterceptors(
    FilesInterceptor('image', undefined, fileUpload.uploadConfig),
  )
  async createProduct(
    @Req() req: Request,
    @Body() dto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const result = await this.productService.createProduct(
      req.user!.id,
      dto,
      files,
    );
    return { message: 'Product created successfully', data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'discription', required: false })
  @ApiQuery({ name: 'catagory', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @HttpCode(HttpStatus.OK)
  async getAllProduct(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'discription',
      'catagory',
      'status',
    ]);

    const options = pick(req.query, ['limit', 'page', 'sortOrder', 'sortBy']);
    const result = await this.productService.getAllProduct(filters, options);
    return {
      message: 'Products fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product' })
  async getSingleProduct(@Param('id') id: string) {
    const result = await this.productService.getSingleProduct(id);
    return { message: 'Product fetched successfully', data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @UseInterceptors(
    FilesInterceptor('image', undefined, fileUpload.uploadConfig),
  )
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const result = await this.productService.updateProduct(id, dto, files);
    return { message: 'Product updated successfully', data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  async deleteProduct(@Param('id') id: string) {
    const result = await this.productService.deleteProduct(id);
    return { message: result };
  }
}
