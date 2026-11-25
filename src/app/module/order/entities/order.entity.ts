import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';

export const MOBILE_PAYMENT_METHODS = ['bkash', 'nagad', 'rocket'] as const;
export const ORDER_PAYMENT_METHODS = [
  ...MOBILE_PAYMENT_METHODS,
  'cod',
  'token',
] as const;
export type OrderPaymentMethod = (typeof ORDER_PAYMENT_METHODS)[number];
export const DELIVERY_ZONES = ['inside_dhaka', 'outside_dhaka'] as const;
export type DeliveryZone = (typeof DELIVERY_ZONES)[number];

@Schema({ _id: false })
class OrderItem {
  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  unitPrice!: number;

  @Prop()
  unitTokenPrice?: number;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'User', default: null })
  userId!: Types.ObjectId | null;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ required: true })
  totalPrice!: number;

  @Prop({ type: String, enum: DELIVERY_ZONES })
  deliveryZone?: DeliveryZone;

  @Prop({ default: 0, min: 0 })
  deliveryCharge!: number;

  @Prop({ default: 0 })
  tokensSpent!: number;

  @Prop({ default: 0 })
  rewardTokens!: number;

  @Prop({ required: true })
  customerName!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  phoneNumber!: string;

  @Prop({ required: true })
  deliveryAddress!: string;

  @Prop({ type: String, enum: ORDER_PAYMENT_METHODS, required: true })
  paymentMethod!: OrderPaymentMethod;

  @Prop()
  senderPhone?: string;

  @Prop()
  transactionId?: string;

  @Prop()
  checkoutId?: string;

  @Prop({ enum: ['pending', 'verified', 'refunded'], default: 'pending' })
  paymentStatus!: string;

  @Prop({
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  })
  orderStatus!: string;

  @Prop()
  expectedDeliveryDate?: Date;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index(
  { paymentMethod: 1, transactionId: 1 },
  {
    unique: true,
    partialFilterExpression: { transactionId: { $type: 'string' } },
  },
);
OrderSchema.index({ userId: 1, _id: -1 });
OrderSchema.index(
  { userId: 1, checkoutId: 1 },
  {
    unique: true,
    partialFilterExpression: { checkoutId: { $type: 'string' } },
  },
);
