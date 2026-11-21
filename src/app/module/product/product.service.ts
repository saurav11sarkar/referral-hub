import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { fileUpload } from 'src/app/helpers/fileUploder';
import { IFilterParams } from 'src/app/helpers/pick';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async createProduct(
    userId: string,
    payload: CreateProductDto,
    files?: Express.Multer.File[],
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User is not found');
    }

    if (files?.length) {
      const images = await Promise.all(
        files.map((file) => fileUpload.uploadToCloudinary(file, 'image')),
      );
      payload.image = images.map(({ url }) => url);
    }

    const result = await this.productModel.create({
      ...payload,
      createBy: user._id,
    });

    return result;
  }

  async getAllProduct(params: IFilterParams, options: IOptions) {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereCondication = buildWhereConditions(params, [
      'name',
      'discription',
      'catagory',
      'status',
    ]);

    const result = await this.productModel
      .find(whereCondication)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });
    const total = await this.productModel.countDocuments(whereCondication);
    return {
      meta: { page, limit, total },
      data: result,
    };
  }

  async getSingleProduct(id: string) {
    const result = await this.productModel.findById(id);
    if (!result) {
      throw new NotFoundException('Product is not found');
    }
    return result;
  }

  async updateProduct(
    id: string,
    payload: Partial<CreateProductDto>,
    files?: Express.Multer.File[],
  ) {
    const existingProduct = await this.productModel.findById(id);
    if (!existingProduct) {
      throw new NotFoundException('Product is not found');
    }

    if (files?.length) {
      const images = await Promise.all(
        files.map((file) => fileUpload.uploadToCloudinary(file, 'image')),
      );
      payload.image = images.map(({ url }) => url);
    }

    const result = await this.productModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    return result;
  }

  async deleteProduct(id: string) {
    const existingProduct = await this.productModel.findById(id);
    if (!existingProduct) {
      throw new NotFoundException('Product is not found');
    }
    await this.productModel.findByIdAndDelete(id);
    return 'Product deleted successfully';
  }
}
