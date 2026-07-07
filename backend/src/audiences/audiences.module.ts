import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudiencesController } from './audiences.controller';
import { AudiencesService } from './audiences.service';
import { Audience } from './entities/audience.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Audience])],
  controllers: [AudiencesController],
  providers: [AudiencesService],
  exports: [AudiencesService, TypeOrmModule],
})
export class AudiencesModule {}
