import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'user' })
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

  @Prop({
    type: String,
    default: 'active',
  })
  status!: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
