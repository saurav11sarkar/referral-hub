import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateAdminPermissionDto } from './dto/create-admin-permission.dto';
// import { UpdateAdminPermissionDto } from './dto/update-admin-permission.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Model } from 'mongoose';
import {
  AdminPermission,
  AdminPermissionDocument,
} from './entities/admin-permission.entity';

@Injectable()
export class AdminPermissionService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AdminPermission.name)
    private readonly adminPermissionModel: Model<AdminPermissionDocument>,
  ) {}

  async addPermisionAdmin(
    actorId: string,
    adminId: string,
    createAdminPermissionDto: CreateAdminPermissionDto,
  ) {
    const actor = await this.userModel.exists({
      _id: actorId,
      role: 'superadmin',
      status: 'active',
    });
    if (!actor) throw new ForbiddenException('Active super admin required');

    const admin = await this.userModel.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new BadRequestException('Admin not found or not authorized');
    }

    const result = await this.adminPermissionModel.create({
      adminId: admin.id,
      ...createAdminPermissionDto,
    });

    return result;
  }

  async requirePermission(actorId: string, permission: string) {
    const actor = await this.userModel.findById(actorId).select('role status');
    if (actor?.status === 'active' && actor.role === 'superadmin') return;

    if (actor?.status === 'active' && actor.role === 'admin') {
      const grants = await this.adminPermissionModel
        .findOne({ adminId: actor._id })
        .sort({ createdAt: -1, _id: -1 });
      if (grants?.permissions.includes(permission)) return;
    }

    throw new ForbiddenException('Permission denied');
  }
}
