import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { Task, TaskSchema } from './entities/task.entity';
import { AdminPermissionModule } from '../admin-permission/admin-permission.module';
import {
  TaskSubmission,
  TaskSubmissionSchema,
} from './entities/task-submission.entity';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from './entities/wallet-transaction.entity';
import { TaskSubmissionController } from './task-submission.controller';
import { TaskSubmissionService } from './task-submission.service';

@Module({
  imports: [
    AdminPermissionModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
      { name: TaskSubmission.name, schema: TaskSubmissionSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
    ]),
  ],
  controllers: [TaskSubmissionController, TaskController],
  providers: [TaskService, TaskSubmissionService],
})
export class TaskModule {}
