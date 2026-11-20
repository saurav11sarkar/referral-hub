import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  createBy!: Types.ObjectId;

  @Prop()
  title!: string;

  @Prop()
  description!: string;

  @Prop()
  instructions!: string;

  @Prop()
  reward!: number;

  @Prop()
  deadlineAt!: Date;

  @Prop()
  image?: string;

  @Prop({ default: null })
  videoUrl?: string;

  @Prop({ default: null })
  url?: string;

  @Prop({
    type: String,
    default: 'active',
  })
  status!: string;

  @Prop()
  archivedAt?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
