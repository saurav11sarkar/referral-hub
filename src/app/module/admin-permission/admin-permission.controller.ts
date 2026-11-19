import {
  Controller,
  // Get,
  Post,
  Body,
  // Patch,
  Param,
  // Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminPermissionService } from './admin-permission.service';
import { CreateAdminPermissionDto } from './dto/create-admin-permission.dto';
// import { UpdateAdminPermissionDto } from './dto/update-admin-permission.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';

@ApiTags('admin-permission')
@Controller('admin-permission')
export class AdminPermissionController {
  constructor(
    private readonly adminPermissionService: AdminPermissionService,
  ) {}

  @Post('/:adminId')
  @ApiOperation({ summary: 'add admin permisation' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('superadmin'))
  @HttpCode(HttpStatus.CREATED)
  async addAdminPermision(
    @Param('adminId') adminId: string,
    @Body() createAdminPermissionDto: CreateAdminPermissionDto,
  ) {
    const result = await this.adminPermissionService.addPermisionAdmin(
      adminId,
      createAdminPermissionDto,
    );
    return {
      message: 'Add admin permisation successfully',
      data: result,
    };
  }
}
