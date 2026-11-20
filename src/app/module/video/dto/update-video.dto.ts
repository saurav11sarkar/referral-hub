import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CreateVideoDto } from './create-video.dto';

export class UpdateVideoDto extends PartialType(CreateVideoDto) {}

const updateFields = [
  'title',
  'description',
  'videoUrl',
  'thumbnailUrl',
  'status',
] satisfies (keyof CreateVideoDto)[];

for (const field of updateFields) {
  Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )(UpdateVideoDto.prototype, field);
}
