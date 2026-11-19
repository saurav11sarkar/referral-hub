import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
export type UserDocument = HydratedDocument<User>;
import * as bcrypt from 'bcrypt';
import config from '../../../config';

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: [true, 'Full name is required'],
    trim: true,
  })
  fullName: string;

  @Prop({
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    default: false,
  })
  emailVerified?: boolean;

  @Prop({
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  })
  password: string;

  @Prop({
    enum: ['user', 'admin', 'superadmin'],
    default: 'user',
  })
  role: string;

  @Prop({ enum: ['male', 'female'] })
  gender: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  address: string;

  @Prop()
  profilePicture: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  otp?: string;

  @Prop()
  otpExpiry?: Date;

  @Prop({ enum: ['active', 'suspended'], default: 'active' })
  status: string;

  @Prop()
  verifiedForget: boolean;

  @Prop()
  referralCode?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  referredBy?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index(
  { referralCode: 1 },
  {
    unique: true,
    partialFilterExpression: { referralCode: { $type: 'string' } },
  },
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcryptSaltRounds),
  );
});
