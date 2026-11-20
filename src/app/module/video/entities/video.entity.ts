import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';

export type VideoDocument = HydratedDocument<Video>;

@Schema({ timestamps: true })
export class Video {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  createdBy: Types.ObjectId;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  videoUrl: string;

  @Prop()
  thumbnailUrl: string;

  @Prop({ default: 'active' })
  status: string;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
