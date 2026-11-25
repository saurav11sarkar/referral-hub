import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types, mongo } from 'mongoose';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import sendMailer from '../../helpers/sendMailer';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { ApproveOrderDto, CreateOrderDto } from './dto/create-order.dto';
import {
  MOBILE_PAYMENT_METHODS,
  Order,
  type DeliveryZone,
} from './entities/order.entity';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectConnection() private readonly connection: Connection,
    private readonly config: ConfigService,
  ) {}

  async createOrder(dto: CreateOrderDto, userId?: string) {
    const {
      items,
      paymentMethod,
      senderPhone,
      transactionId,
      checkoutId,
      deliveryZone,
      ...customer
    } = dto;
    const usesTokens = paymentMethod === 'token';
    if (usesTokens && !userId) {
      throw new ForbiddenException('Log in to pay with tokens');
    }
    if (
      userId &&
      !(await this.users.exists({
        _id: userId,
        role: 'user',
        status: 'active',
      }))
    ) {
      throw new ForbiddenException('Active user account required');
    }

    if (usesTokens) {
      if (!checkoutId) throw new BadRequestException('Checkout ID is required');
      const previousOrder = await this.orders.findOne({ userId, checkoutId });
      if (previousOrder) return previousOrder;
    }

    const products = await this.products
      .find({
        _id: { $in: items.map((item) => item.productId) },
        status: 'active',
      })
      .lean<(Product & { _id: Types.ObjectId; price?: number })[]>();
    const productsById = new Map(
      products.map((product) => [product._id.toString(), product]),
    );
    let totalPrice = 0;
    let tokensSpent = 0;
    let rewardTokens = 0;

    const orderItems = items.map(({ productId, quantity }) => {
      const product = productsById.get(productId.toLowerCase());
      if (!product) throw new BadRequestException('Product is not available');
      const unitPrice =
        product.discountPrice ?? product.orginalPrice ?? product.price;
      if (
        unitPrice === undefined ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        throw new BadRequestException('Invalid product price');
      }

      totalPrice += unitPrice * quantity;
      if (usesTokens) {
        const tokenPrice = product.tokenPrice;
        if (
          tokenPrice == null ||
          !Number.isSafeInteger(tokenPrice) ||
          tokenPrice < 1
        ) {
          throw new BadRequestException(
            'Product is not available for token checkout',
          );
        }
        tokensSpent += tokenPrice * quantity;
      } else if (userId) {
        rewardTokens += (product.rewardTokens ?? 0) * quantity;
      }

      return {
        productId: product._id,
        name: product.name,
        quantity,
        unitPrice,
        unitTokenPrice: usesTokens
          ? (product.tokenPrice ?? undefined)
          : undefined,
      };
    });
    if (
      !Number.isFinite(totalPrice) ||
      !Number.isSafeInteger(tokensSpent) ||
      !Number.isSafeInteger(rewardTokens) ||
      rewardTokens < 0
    ) {
      throw new BadRequestException('Invalid order total');
    }

    if (!usesTokens && !deliveryZone) {
      throw new BadRequestException('Delivery zone is required');
    }
    const deliveryCharge =
      !usesTokens && deliveryZone ? this.deliveryCharge(deliveryZone) : 0;
    const order = {
      ...customer,
      userId: userId ?? null,
      items: orderItems,
      totalPrice: usesTokens
        ? 0
        : Math.round((totalPrice + deliveryCharge) * 100) / 100,
      deliveryZone,
      deliveryCharge,
      tokensSpent,
      rewardTokens,
      paymentMethod,
      paymentStatus: usesTokens ? 'verified' : 'pending',
    };

    if (usesTokens) {
      await this.orders.init();
      return this.connection.transaction(async (session) => {
        const previousOrder = await this.orders
          .findOne({ userId, checkoutId })
          .session(session);
        if (previousOrder) return previousOrder;

        const result = await this.users.updateOne(
          {
            _id: userId,
            role: 'user',
            status: 'active',
            tokenBalance: { $gte: tokensSpent },
          },
          { $inc: { tokenBalance: -tokensSpent } },
          { session },
        );
        if (!result.matchedCount)
          throw new ConflictException('Insufficient token balance');

        const [created] = await this.orders.create([{ ...order, checkoutId }], {
          session,
        });
        return created;
      });
    }

    if (paymentMethod === 'cod') return this.orders.create(order);

    if (!senderPhone?.trim() || !transactionId?.trim()) {
      throw new BadRequestException(
        'Sender phone and transaction ID are required',
      );
    }
    await this.orders.init();
    try {
      return await this.orders.create({
        ...order,
        senderPhone: senderPhone.trim(),
        transactionId: transactionId.trim().toUpperCase(),
      });
    } catch (error) {
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new ConflictException('Transaction ID already used');
      }
      throw error;
    }
  }

  paymentMethods() {
    const mobileMethods = MOBILE_PAYMENT_METHODS.flatMap((method) => {
      const number = this.config.get<string>(
        `ORDER_${method.toUpperCase()}_NUMBER`,
      );
      return number?.trim() ? [{ method, number: number.trim() }] : [];
    });
    return [...mobileMethods, { method: 'cod', number: null }];
  }

  deliveryCharges() {
    return {
      inside_dhaka: this.deliveryCharge('inside_dhaka'),
      outside_dhaka: this.deliveryCharge('outside_dhaka'),
      currency: 'BDT',
    };
  }

  private deliveryCharge(zone: DeliveryZone) {
    const key =
      zone === 'inside_dhaka'
        ? 'ORDER_DELIVERY_INSIDE_DHAKA'
        : 'ORDER_DELIVERY_OUTSIDE_DHAKA';
    const value = this.config.get<string>(key)?.trim();
    const amount = Number(value);
    if (
      !value ||
      !/^\d+(\.\d{1,2})?$/.test(value) ||
      !Number.isFinite(amount)
    ) {
      throw new ServiceUnavailableException(
        'Delivery charge is not configured',
      );
    }
    return amount;
  }

  async getTokenBalance(userId: string) {
    const user = await this.users.findById(userId).select('+tokenBalance');
    if (!user) throw new NotFoundException('User not found');
    return { tokenBalance: user.tokenBalance ?? 0 };
  }

  async getOrders(options: IOptions, status?: string, userId?: string) {
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper(options);
    if (
      !Number.isSafeInteger(skip) ||
      skip < 0 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new BadRequestException('Invalid pagination');
    }
    const whereConditions = buildWhereConditions(
      status ? { orderStatus: status } : {},
      [],
      userId ? { userId } : {},
    );
    const data = await this.orders
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder, _id: sortOrder })
      .skip(skip)
      .limit(limit);
    const total = await this.orders.countDocuments(whereConditions);
    return { data, meta: { total, page, limit } };
  }

  async getOrder(id: string, userId?: string) {
    const order = await this.orders.findOne(
      userId ? { _id: id, userId } : { _id: id },
    );
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async approveOrder(id: string, adminId: string, dto: ApproveOrderDto) {
    const pendingOrder = await this.getOrder(id);
    const order = await this.orders.findOneAndUpdate(
      { _id: id, orderStatus: 'pending' },
      {
        $set: {
          orderStatus: 'confirmed',
          paymentStatus:
            pendingOrder.paymentMethod === 'cod' ? 'pending' : 'verified',
          approvedBy: adminId,
          expectedDeliveryDate: new Date(dto.expectedDeliveryDate),
        },
      },
      { new: true },
    );
    if (!order) throw new ConflictException('Order is not pending');

    let emailSent = true;
    try {
      const deliveryDate = order.expectedDeliveryDate
        ?.toISOString()
        .slice(0, 10);
      await sendMailer(
        order.email,
        'Order confirmed',
        `<p>Your order ${order.id} has been confirmed.</p><p>Expected delivery: ${deliveryDate}</p>`,
      );
    } catch {
      emailSent = false;
      this.logger.warn(`Confirmation email failed for order ${order.id}`);
    }
    return { order, emailSent };
  }

  async shipOrder(id: string) {
    const order = await this.orders.findOneAndUpdate(
      {
        _id: id,
        orderStatus: 'confirmed',
        $or: [
          { paymentStatus: 'verified' },
          { paymentMethod: 'cod', paymentStatus: 'pending' },
        ],
      },
      { $set: { orderStatus: 'shipped' } },
      { new: true },
    );
    if (!order) throw new ConflictException('Order is not ready to ship');
    return order;
  }

  deliverOrder(id: string, cashCollected?: boolean) {
    return this.connection.transaction(async (session) => {
      const order = await this.orders.findOneAndUpdate(
        {
          _id: id,
          orderStatus: { $in: ['confirmed', 'shipped'] },
          $or: [
            { paymentStatus: 'verified' },
            ...(cashCollected === true
              ? [{ paymentMethod: 'cod', paymentStatus: 'pending' }]
              : []),
          ],
        },
        { $set: { orderStatus: 'delivered', paymentStatus: 'verified' } },
        { new: true, session },
      );
      if (!order)
        throw new ConflictException(
          'Order cannot be delivered. Confirm cash collection for COD orders.',
        );

      if (
        order.userId &&
        order.paymentMethod !== 'token' &&
        order.rewardTokens > 0
      ) {
        const result = await this.users.updateOne(
          { _id: order.userId },
          { $inc: { tokenBalance: order.rewardTokens } },
          { session },
        );
        if (!result.matchedCount)
          throw new NotFoundException('Order user not found');
      }
      return order;
    });
  }

  cancelOrder(id: string) {
    return this.connection.transaction(async (session) => {
      const order = await this.orders.findOneAndUpdate(
        { _id: id, orderStatus: { $in: ['pending', 'confirmed'] } },
        { $set: { orderStatus: 'cancelled' } },
        { new: true, session },
      );
      if (!order) throw new ConflictException('Order cannot be cancelled');

      if (order.paymentMethod === 'token') {
        const result = await this.users.updateOne(
          { _id: order.userId },
          { $inc: { tokenBalance: order.tokensSpent } },
          { session },
        );
        if (!result.matchedCount)
          throw new NotFoundException('Order user not found');
        order.paymentStatus = 'refunded';
        await order.save({ session });
      }
      return order;
    });
  }
}
