import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import pick from 'src/app/helpers/pick';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileUpload } from 'src/app/helpers/fileUploder';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  @ApiOperation({ summary: 'Video create' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @UseInterceptors(FileInterceptor('thumbnailUrl', fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createVideo(
    @Req() req: Request,
    @Body() dto: CreateVideoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.videoService.createVideo(req.user!.id, dto, file);
    return {
      message: 'Videos create successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Video list' })
  @HttpCode(HttpStatus.OK)
  async getAllVideos(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'title',
      'description',
      'status',
    ]);
    const options = pick(req.query, ['sortBy', 'sortOrder', 'page', 'limit']);

    const result = await this.videoService.getAllVideos(filters, options);
    return {
      message: 'Videos retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a video' })
  async getSingleVideo(@Param('id') id: string) {
    const result = await this.videoService.getSingleVideo(id);
    return { message: 'Video retrieved successfully', data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a video' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  @UseInterceptors(FileInterceptor('thumbnailUrl', fileUpload.uploadConfig))
  async updateVideo(
    @Param('id') id: string,
    @Body() dto: UpdateVideoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.videoService.updateVideo(id, dto, file);
    return { message: 'Video updated successfully', data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a video' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('admin', 'superadmin'))
  async deleteVideo(@Param('id') id: string) {
    const result = await this.videoService.deleteVideo(id);
    return { message: 'Video deleted successfully', data: result };
  }
}
