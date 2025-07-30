import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';
import { MonitorData, MonitorDataSchema } from '../schemas/monitor-data.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MonitorData.name, schema: MonitorDataSchema }]),
  ],
  providers: [MonitorService],
  controllers: [MonitorController],
  exports: [MonitorService],
})
export class MonitorModule {}