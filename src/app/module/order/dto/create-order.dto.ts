import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import {
  DELIVERY_ZONES,
  ORDER_PAYMENT_METHODS,
  type DeliveryZone,
  type OrderPaymentMethod,
} from '../entities/order.entity';

class OrderItemDto {
  @ApiProperty({ example: '6afe9dc464d058c4cdd58b3f' })
  @IsMongoId()
  productId!: string;

  @ApiProperty({ example: 2, minimum: 1, type: 'integer' })
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: () => [OrderItemDto], minItems: 1 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiProperty({ example: 'Rahim Khan' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: 'customer@example.com', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '01700000000' })
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @ApiProperty({ example: 'House 12, Road 3, Mirpur, Dhaka' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @ApiPropertyOptional({
    enum: DELIVERY_ZONES,
    example: 'inside_dhaka',
    description: 'Required for mobile payments and cash on delivery',
  })
  @ValidateIf(
    (order: CreateOrderDto) =>
      order.paymentMethod !== 'token' || order.deliveryZone !== undefined,
  )
  @IsIn(DELIVERY_ZONES)
  deliveryZone?: DeliveryZone;

  @ApiProperty({ enum: ORDER_PAYMENT_METHODS, example: 'bkash' })
  @IsIn(ORDER_PAYMENT_METHODS)
  paymentMethod!: OrderPaymentMethod;

  @ApiPropertyOptional({
    example: '01800000000',
    description: 'Phone number used to send the payment',
  })
  @ValidateIf(
    (order: CreateOrderDto) => !['token', 'cod'].includes(order.paymentMethod),
  )
  @IsString()
  @Matches(/\S/)
  senderPhone?: string;

  @ApiPropertyOptional({ example: 'A1B2C3D4E5' })
  @ValidateIf(
    (order: CreateOrderDto) => !['token', 'cod'].includes(order.paymentMethod),
  )
  @IsString()
  @Matches(/\S/)
  transactionId?: string;

  @ApiPropertyOptional({
    example: 'ed45c2ec-18b4-4c34-a90e-1c7bd2c03594',
    description: 'Unique ID per token checkout. Reuse it when retrying.',
  })
  @ValidateIf((order: CreateOrderDto) => order.paymentMethod === 'token')
  @IsUUID('4')
  checkoutId?: string;
}

export class ApproveOrderDto {
  @ApiProperty({ example: '2026-11-30', format: 'date' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  expectedDeliveryDate!: string;
}

export class DeliverOrderDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Confirm cash collected for a COD order',
  })
  @IsOptional()
  @IsBoolean()
  cashCollected?: boolean;
}
