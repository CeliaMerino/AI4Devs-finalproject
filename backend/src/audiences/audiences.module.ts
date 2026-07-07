import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudiencesService } from './audiences.service';
import { Audience } from './entities/audience.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Audience])],
  providers: [AudiencesService],
  exports: [AudiencesService, TypeOrmModule],
})
export class AudiencesModule {}
