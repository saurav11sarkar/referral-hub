import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AdminPermissionDocument = HydratedDocument<AdminPermission>;

@Schema({ timestamps: true })
export class AdminPermission {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  adminId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  permissions!: string[];
}

export const AdminPermissionSchema =
  SchemaFactory.createForClass(AdminPermission);
