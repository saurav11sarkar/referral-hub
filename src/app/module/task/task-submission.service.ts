import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { fileUpload } from '../../helpers/fileUploder';
import buildWhereConditions from '../../helpers/buildWhereConditions';
import paginationHelper, { IOptions } from '../../helpers/pagenation';
import { User } from '../user/entities/user.entity';
import { Task } from './entities/task.entity';
import { TaskSubmission } from './entities/task-submission.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { IFilterParams } from 'src/app/helpers/pick';
import { ClientSession, Connection, Model, Types } from 'mongoose';

const submissionFields =
  'taskId userId taskTitle reward imageUrl status note reviewedBy reviewedAt createdAt updatedAt __v';

@Injectable()
export class TaskSubmissionService {
  constructor(
    @InjectModel(Task.name) private readonly tasks: Model<Task>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(TaskSubmission.name)
    private readonly submissions: Model<TaskSubmission>,
    @InjectModel(WalletTransaction.name)
    private readonly walletTransactions: Model<WalletTransaction>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async availableTasks(
    params: IFilterParams,
    options: IOptions,
    userId: string,
  ) {
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper(options);
    const submittedTaskIds = await this.submissions.distinct('taskId', {
      userId,
    });
    const whereConditions = buildWhereConditions(params, ['status'], {
      _id: { $nin: submittedTaskIds },
      status: 'active',
      archivedAt: { $exists: false },
      deadlineAt: { $gte: new Date() },
    });

    const result = await this.tasks
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await this.tasks.countDocuments(whereConditions);

    return { data: result, meta: { total, page, limit } };
  }

  async submit(taskId: string, userId: string, proof: Express.Multer.File) {
    const user = await this.users.exists({
      _id: userId,
      role: 'user',
      status: 'active',
    });
    if (!user) {
      throw new ForbiddenException('Active user account required');
    }

    const task = await this.tasks.findById(taskId);
    if (!task) throw new NotFoundException('Available task not found');

    await this.submissions.init();
    if (await this.submissions.exists({ taskId: task._id, userId })) {
      throw new ConflictException('Task already submitted');
    }

    const reward = task.reward;
    if (!Number.isFinite(reward) || reward < 0) {
      throw new BadRequestException('Invalid task reward');
    }

    const image = await fileUpload.uploadToCloudinary(proof, 'image');

    const submission = await this.submissions.create({
      taskId: task._id,
      taskTitle: task.title,
      userId,
      reward,
      imageUrl: image.url,
    });

    return {
      id: submission.id,
      taskId: submission.taskId,
      status: submission.status,
      reward,
      imageUrl: submission.imageUrl,
    };
  }

  async list(params: IFilterParams, options: IOptions) {
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = buildWhereConditions(params, ['status']);
    const [data, total] = await Promise.all([
      this.submissions
        .find(whereConditions)
        .select(submissionFields)
        .populate('userId', 'fullName')
        .populate('taskId', 'title reward')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.submissions.countDocuments(whereConditions),
    ]);
    return {
      data,
      meta: { total, page, limit },
    };
  }

  async mySubmissonList(
    params: IFilterParams,
    options: IOptions,
    userId: string,
  ) {
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper(options);

    const whereConditions = buildWhereConditions(params, ['status'], {
      userId,
    });
    const [data, total] = await Promise.all([
      this.submissions
        .find(whereConditions)
        .select(submissionFields)
        .populate('userId', 'fullName')
        .populate('taskId', 'title reward')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.submissions.countDocuments(whereConditions),
    ]);

    return {
      data,
      meta: { total, page, limit },
    };
  }

  async getSingleSubmission(id: string) {
    const submission = await this.submissions
      .findById(id)
      .select(submissionFields)
      .populate('userId', 'fullName')
      .populate('taskId', 'title reward');

    if (!submission) throw new NotFoundException('Submission not found');

    return submission;
  }

  async approve(id: string, adminId: string) {
    await this.walletTransactions.init();

    return this.connection.transaction(async (session) => {
      const submission = await this.reviewPending(
        id,
        adminId,
        'approved',
        session,
      );

      const reward = submission.reward;
      if (reward === undefined) {
        throw new BadRequestException('Submission reward is missing');
      }

      // Save approval and reward together.
      await this.walletTransactions.create(
        [
          {
            userId: submission.userId,
            submissionId: submission._id,
            amount: reward,
          },
        ],
        { session },
      );
      return submission;
    });
  }

  async reject(id: string, adminId: string, note?: string) {
    const submission = await this.reviewPending(
      id,
      adminId,
      'rejected',
      undefined,
      note,
    );
    return submission;
  }

  async deleteSubmission(id: string) {
    const submission = await this.submissions
      .findOneAndDelete({ _id: id, status: { $in: ['pending', 'rejected'] } })
      .select(submissionFields);
    if (!submission) {
      throw new NotFoundException('Pending or rejected submission not found');
    }

    return submission;
  }

  async resubmit(id: string, userId: string, image: Express.Multer.File) {
    const user = await this.users.exists({
      _id: userId,
      role: 'user',
      status: 'active',
    });
    if (!user) throw new ForbiddenException('Active user account required');

    const filter = { _id: id, userId, status: 'rejected' };
    const submission = await this.submissions
      .findOne(filter)
      .select('taskId reward');
    if (!submission)
      throw new NotFoundException('Rejected submission not found');

    const task = await this.tasks
      .findOne({
        _id: submission.taskId,
        status: 'active',
        archivedAt: { $exists: false },
        deadlineAt: { $gte: new Date() },
      })
      .select('reward');
    if (!task) throw new NotFoundException('Available task not found');

    const reward = submission.reward ?? task.reward;
    if (!Number.isFinite(reward) || reward < 0) {
      throw new BadRequestException('Invalid task reward');
    }

    const { url } = await fileUpload.uploadToCloudinary(image, 'image');
    const result = await this.submissions
      .findOneAndUpdate(
        filter,
        {
          $set: { status: 'pending', imageUrl: url, reward },
          $unset: { note: '', reviewedBy: '', reviewedAt: '' },
        },
        { new: true },
      )
      .select(submissionFields);
    if (!result)
      throw new ConflictException('Submission is no longer rejected');

    return result;
  }

  private async reviewPending(
    id: string,
    adminId: string,
    status: 'approved' | 'rejected',
    session?: ClientSession,
    note?: string,
  ) {
    const submission = await this.submissions
      .findOneAndUpdate(
        { _id: id, status: 'pending' },
        {
          $set: {
            status,
            note: note?.trim() || undefined,
            reviewedBy: adminId,
            reviewedAt: new Date(),
          },
        },
        { new: true, session },
      )
      .select(submissionFields);
    if (!submission) throw new ConflictException('Submission is not pending');
    return submission;
  }

  async taskRewardBalance(userId: string) {
    const [balance] = await this.walletTransactions.aggregate<{
      total: number;
    }>([
      { $match: { userId: new Types.ObjectId(userId), type: 'task_reward' } },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $ifNull: ['$amount', { $divide: ['$amountMinor', 100] }] },
          },
        },
      },
    ]);
    return { balance: balance?.total ?? 0, currency: 'BDT' };
  }
}
