import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminPermissionModule } from '../admin-permission/admin-permission.module';
import { Product, ProductSchema } from '../product/entities/product.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Order, OrderSchema } from './entities/order.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@Module({
  imports: [
    AdminPermissionModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
