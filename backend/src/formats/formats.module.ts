import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Format } from './entities/format.entity';
import { FormatsService } from './formats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Format])],
  providers: [FormatsService],
  exports: [FormatsService, TypeOrmModule],
})
export class FormatsModule {}
