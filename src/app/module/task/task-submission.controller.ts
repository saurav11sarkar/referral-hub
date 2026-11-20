import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from '../../helpers/fileUploder';
import pick from '../../helpers/pick';
import AuthGuard from '../../middlewares/auth.guard';
import { AdminPermissionService } from '../admin-permission/admin-permission.service';
import { TaskSubmissionService } from './task-submission.service';

@ApiTags('Task Submissions')
@Controller('task')
export class TaskSubmissionController {
  constructor(
    private readonly submissions: TaskSubmissionService,
    private readonly permissions: AdminPermissionService,
  ) {}

  @Get('available')
  @ApiOperation({ summary: 'Available tasks' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiQuery({ name: 'searchTram', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  @HttpCode(HttpStatus.OK)
  async getAvailableTasks(@Req() req: Request) {
    const params = pick(req.query, ['searchTram', 'status']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.submissions.availableTasks(params, options);
    return {
      message: 'Available tasks retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post(':id/submissions')
  @ApiOperation({ summary: 'Submit a task' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.OK)
  async submitTask(
    @Param('id') id: string,
    @Req() req: Request,
    @UploadedFile()
    image: Express.Multer.File,
  ) {
    const result = await this.submissions.submit(id, req.user!.id, image);
    return { message: 'Task submitted successfully', data: result };
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Get all submissions' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @ApiQuery({ name: 'searchTram', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected', 'all'],
  })
  @HttpCode(HttpStatus.OK)
  async getAllSubmittedTasks(@Req() req: Request) {
    const params = pick(req.query, ['searchTram', 'status']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.submissions.list(params, options);
    return {
      message: 'Submissions retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('submissions/me')
  @ApiOperation({ summary: 'Get My submissions' })
  @ApiQuery({ name: 'searchTram', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected', 'all'],
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  @HttpCode(HttpStatus.OK)
  async mySubmissonList(@Req() req: Request) {
    const params = pick(req.query, ['searchTram', 'status']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.submissions.mySubmissonList(
      params,
      options,
      req.user!.id,
    );
    return {
      message: 'My submissions retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'get single submission' })
  @HttpCode(HttpStatus.OK)
  async getSingleSubmission(@Param('id') id: string) {
    const result = await this.submissions.getSingleSubmission(id);
    return {
      message: 'Submission retrieved successfully',
      data: result,
    };
  }

  @Patch('submissions/:id/approve')
  @ApiOperation({ summary: 'Approve a submission' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @HttpCode(HttpStatus.OK)
  async approveTask(@Param('id') id: string, @Req() req: Request) {
    await this.permissions.requirePermission(
      req.user!.id,
      'submissions.manage',
    );
    const result = await this.submissions.approve(id, req.user!.id);
    return { message: 'Submission approved successfully', data: result };
  }

  @Patch('submissions/:id/reject')
  @ApiOperation({ summary: 'Reject a submission' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @HttpCode(HttpStatus.OK)
  async rejectTask(@Param('id') id: string, @Req() req: Request) {
    await this.permissions.requirePermission(
      req.user!.id,
      'submissions.manage',
    );
    const result = await this.submissions.reject(id, req.user!.id);
    return { message: 'Submission rejected successfully', data: result };
  }

  @Get('rewards/balance')
  @ApiOperation({ summary: 'get Task Reward Balance' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  @HttpCode(HttpStatus.OK)
  async getRewardBalance(@Req() req: Request) {
    const result = await this.submissions.taskRewardBalance(req.user!.id);
    return { message: 'Reward balance retrieved successfully', data: result };
  }
}
