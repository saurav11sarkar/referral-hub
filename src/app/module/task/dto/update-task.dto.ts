import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto, {
  skipNullProperties: false,
}) {}

// Swagger can submit empty strings for optional multipart fields.
const updateFields = [
  'title',
  'description',
  'instructions',
  'reward',
  'deadlineAt',
  'image',
  'status',
] satisfies (keyof CreateTaskDto)[];

for (const field of updateFields) {
  Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )(UpdateTaskDto.prototype, field);
}
