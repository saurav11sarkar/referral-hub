/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import pick from '../../helpers/pick';
import AuthGuard from '../../middlewares/auth.guard';
import { AdminPermissionService } from '../admin-permission/admin-permission.service';
import {
  ApproveOrderDto,
  CreateOrderDto,
  DeliverOrderDto,
} from './dto/create-order.dto';
import { OrderService } from './order.service';

@ApiTags('Orders')
@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly permissions: AdminPermissionService,
  ) {}

  @Get('payment-methods')
  paymentMethods() {
    return { data: this.orderService.paymentMethods() };
  }

  @Get('delivery-charges')
  deliveryCharges() {
    return { data: this.orderService.deliveryCharges() };
  }

  @Post('guest')
  @ApiBody({ type: CreateOrderDto })
  async createGuestOrder(@Body() dto: CreateOrderDto) {
    const result = await this.orderService.createOrder(dto);
    return { message: 'Order created successfully', data: result };
  }

  @Post()
  @ApiBody({ type: CreateOrderDto })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: Request) {
    const result = await this.orderService.createOrder(dto, req.user!.id);
    return { message: 'Order created successfully', data: result };
  }

  @Get('tokens/balance')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  async getTokenBalance(@Req() req: Request) {
    return { data: await this.orderService.getTokenBalance(req.user!.id) };
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getMyOrders(@Req() req: Request) {
    const options = pick(req.query, ['page', 'limit']);
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    return this.orderService.getOrders(options, status, req.user!.id);
  }

  @Get('me/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  async getMyOrder(@Param('id') id: string, @Req() req: Request) {
    return { data: await this.orderService.getOrder(id, req.user!.id) };
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getAllOrders(@Req() req: Request) {
    await this.permissions.requirePermission(req.user!.id, 'orders.manage');
    const options = pick(req.query, ['page', 'limit']);
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    return this.orderService.getOrders(options, status);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  async getSingleOrder(@Param('id') id: string, @Req() req: Request) {
    await this.permissions.requirePermission(req.user!.id, 'orders.manage');
    return { data: await this.orderService.getOrder(id) };
  }

  @Patch(':id/approve')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  async approveOrder(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: ApproveOrderDto,
  ) {
    await this.permissions.requirePermission(req.user!.id, 'orders.manage');
    const result = await this.orderService.approveOrder(id, req.user!.id, dto);
    return { message: 'Order confirmed successfully', data: result };
  }

  @Patch(':id/ship')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  async shipOrder(@Param('id') id: string, @Req() req: Request) {
    await this.permissions.requirePermission(req.user!.id, 'orders.manage');
    return { data: await this.orderService.shipOrder(id) };
  }

  @Patch(':id/deliver')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  async deliverOrder(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto?: DeliverOrderDto,
  ) {
    await this.permissions.requirePermission(req.user!.id, 'orders.manage');
    return {
      data: await this.orderService.deliverOrder(id, dto?.cashCollected),
    };
  }

  @Patch(':id/cancel')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  async cancelOrder(@Param('id') id: string, @Req() req: Request) {
    await this.permissions.requirePermission(req.user!.id, 'orders.manage');
    return { data: await this.orderService.cancelOrder(id) };
  }
}
