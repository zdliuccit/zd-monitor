import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MonitorDataDocument = MonitorData & Document;

@Schema({ timestamps: true })
export class MonitorData {
  @Prop({ required: true })
  appId: string;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true, enum: ['performance', 'error', 'behavior'] })
  type: string;

  @Prop({ type: Object, required: true })
  data: any;

  @Prop({ type: Array, default: [] })
  breadcrumbs: any[];

  @Prop({ required: true })
  sessionId: string;

  @Prop()
  userId?: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string;
}

export const MonitorDataSchema = SchemaFactory.createForClass(MonitorData);