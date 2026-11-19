import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiConsumes,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { fileUpload } from '../../helpers/fileUploder';
import pick from '../../helpers/pick';
import AuthGuard from '../../middlewares/auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @ApiOperation({ summary: 'Create task' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  async createTask(
    @Req() req: Request,
    @Body() createTaskDto: CreateTaskDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.taskService.createTask(
      req.user!.id,
      createTaskDto,
      file,
    );
    return { message: 'Task created successfully', data: result };
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiQuery({ name: 'title', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'title', 'reward', 'deadlineAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async getAllTask(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'title',
      'description',
      'instructions',
      'status',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.taskService.getAllTask(filters, options);

    return {
      message: 'Tasks retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @ApiBearerAuth('access-token')
  async getSingleTask(@Param('id') id: string) {
    const result = await this.taskService.getSingleTask(id);
    return { message: 'Task retrieved successfully', data: result };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('image', fileUpload.uploadConfig))
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.taskService.updateTask(id, updateTaskDto, file);
    return { message: 'Task updated successfully', data: result };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @ApiBearerAuth('access-token')
  async deleteTask(@Param('id') id: string) {
    const result = await this.taskService.deleteTask(id);
    return { message: 'Task deleted successfully', data: result };
  }
}
