import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  createBy!: Types.ObjectId;

  @Prop()
  name!: string;

  @Prop()
  discription: string;

  @Prop()
  price: number;

  @Prop()
  catagory: string;

  @Prop({ default: [] })
  image: string[];

  @Prop({ default: 'active' })
  status: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
