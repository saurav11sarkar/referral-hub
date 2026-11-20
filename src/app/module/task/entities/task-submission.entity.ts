import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { Task } from './task.entity';

@Schema({ timestamps: true })
export class TaskSubmission {
  @Prop({ type: MongoSchema.Types.ObjectId, ref: Task.name, required: true })
  taskId!: Types.ObjectId;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  taskTitle!: string;

  @Prop({ required: true })
  reward?: number;

  @Prop()
  imageUrl?: string;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status!: 'pending' | 'approved' | 'rejected';

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: User.name })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;
}

export const TaskSubmissionSchema =
  SchemaFactory.createForClass(TaskSubmission);
TaskSubmissionSchema.index({ taskId: 1, userId: 1 }, { unique: true });
TaskSubmissionSchema.index({ status: 1, createdAt: -1, _id: -1 });
