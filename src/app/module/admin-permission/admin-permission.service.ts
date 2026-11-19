import { BadRequestException, Injectable } from '@nestjs/common';
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
    adminId: string,
    createAdminPermissionDto: CreateAdminPermissionDto,
  ) {
    const admin = await this.userModel.findById(adminId);
    if (!admin || admin.role === '"admi') {
      throw new BadRequestException('Admin not found or not authorized');
    }

    const result = await this.adminPermissionModel.create({
      adminId: admin.id,
      ...createAdminPermissionDto,
    });

    return result;
  }
}
