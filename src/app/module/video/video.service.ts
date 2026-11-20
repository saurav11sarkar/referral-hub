import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Model } from 'mongoose';
import { Video, VideoDocument } from './entities/video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { fileUpload } from 'src/app/helpers/fileUploder';
import { IFilterParams } from 'src/app/helpers/pick';
import paginationHelper, { IOptions } from 'src/app/helpers/pagenation';
import buildWhereConditions from 'src/app/helpers/buildWhereConditions';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Video.name) private readonly videoModel: Model<VideoDocument>,
  ) {}

  async createVideo(
    userId: string,
    payload: CreateVideoDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User is not found');
    }
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      throw new UnauthorizedException('Only create admin or superadmin');
    }

    if (file) {
      const { url } = await fileUpload.uploadToCloudinary(file);
      payload.thumbnailUrl = url;
    }

    const result = await this.videoModel.create({
      ...payload,
      createdBy: user.id,
    });

    return result;
  }

  async getAllVideos(params: IFilterParams, options: IOptions) {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(options);
    const whereConditions = buildWhereConditions(params, [
      'title',
      'description',
      'status',
    ]);

    const result = await this.videoModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await this.videoModel.countDocuments(whereConditions);
    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getSingleVideo(id: string) {
    const video = await this.videoModel.findById(id);
    if (!video) throw new NotFoundException('Video not found');

    return video;
  }

  async updateVideo(
    id: string,
    payload: UpdateVideoDto,
    file?: Express.Multer.File,
  ) {
    if (file) {
      await this.getSingleVideo(id);
      const { url } = await fileUpload.uploadToCloudinary(file);
      payload.thumbnailUrl = url;
    }

    const video = await this.videoModel.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true },
    );
    if (!video) throw new NotFoundException('Video not found');

    return video;
  }

  async deleteVideo(id: string) {
    const video = await this.videoModel.findByIdAndDelete(id);
    if (!video) throw new NotFoundException('Video not found');

    return video;
  }
}
