import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './app/config';
import { ContactModule } from './app/module/contact/contact.module';
import { AuthModule } from './app/module/auth/auth.module';
import { UserModule } from './app/module/user/user.module';
import { AdminPermissionModule } from './app/module/admin-permission/admin-permission.module';
import { TaskModule } from './app/module/task/task.module';
import { VideoModule } from './app/module/video/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(config.mongoUri),
    UserModule,
    AuthModule,
    ContactModule,
    AdminPermissionModule,
    TaskModule,
    VideoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
