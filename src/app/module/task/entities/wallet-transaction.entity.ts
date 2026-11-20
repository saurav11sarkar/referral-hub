import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { TaskSubmission } from './task-submission.entity';

@Schema({ timestamps: true })
export class WalletTransaction {
  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: TaskSubmission.name,
    required: true,
    unique: true,
  })
  submissionId!: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop()
  amountMinor?: number;

  @Prop({ type: String, default: 'task_reward' })
  type!: string;
}

export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);
