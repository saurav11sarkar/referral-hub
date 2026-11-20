import { Module } from '@nestjs/common';
import { AdminPermissionService } from './admin-permission.service';
import { AdminPermissionController } from './admin-permission.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  AdminPermission,
  AdminPermissionSchema,
} from './entities/admin-permission.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AdminPermission.name, schema: AdminPermissionSchema },
    ]),
  ],
  controllers: [AdminPermissionController],
  providers: [AdminPermissionService],
  exports: [AdminPermissionService],
})
export class AdminPermissionModule {}
