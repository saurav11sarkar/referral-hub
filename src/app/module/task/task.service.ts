import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { fileUpload } from 'src/app/helpers/fileUploder';
import { IFilterParams } from 'src/app/helpers/pick';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(User.name) private readonly UserModel: Model<UserDocument>,
    @InjectModel(Task.name) private readonly TaskModule: Model<TaskDocument>,
  ) {}

  async createTask(
    adminId: string,
    payload: CreateTaskDto,
    file?: Express.Multer.File,
  ) {
    const admin = await this.UserModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('admin is not found');
    }

    if (file) {
      const { url } = await fileUpload.uploadToCloudinary(file);
      payload.image = url;
    }
    const task = await this.TaskModule.create({
      ...payload,
      createBy: admin.id,
    });

    return task;
  }

  async getAllTask(param: IFilterParams, option: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(option);

    const whereConditions = buildWhereConditions(
      param,
      ['title', 'description', 'instructions', 'status'],
      { archivedAt: { $exists: false } },
    );

    const result = await this.TaskModule.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });

    const total = await this.TaskModule.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getSingleTask(id: string) {
    const task = await this.TaskModule.findOne({
      _id: id,
      archivedAt: { $exists: false },
    });
    if (!task) throw new NotFoundException('Task not found');

    return task;
  }

  async updateTask(
    id: string,
    payload: UpdateTaskDto,
    file?: Express.Multer.File,
  ) {
    const task = await this.getSingleTask(id);
    const changes = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );
    task.set(changes);

    if (file) {
      const { url } = await fileUpload.uploadToCloudinary(file);
      task.image = url;
    }

    return task.save();
  }

  async deleteTask(id: string) {
    const task = await this.TaskModule.findOneAndUpdate(
      { _id: id, archivedAt: { $exists: false } },
      { $set: { archivedAt: new Date() } },
      { new: true },
    );
    if (!task) throw new NotFoundException('Task not found');

    return task;
  }
}
