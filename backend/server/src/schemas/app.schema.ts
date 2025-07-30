import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppDocument = App & Document;

@Schema({ timestamps: true })
export class App {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  appId: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  domain: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  config: {
    sampling?: number;
    enablePerformance?: boolean;
    enableError?: boolean;
    enableBehavior?: boolean;
  };
}

export const AppSchema = SchemaFactory.createForClass(App);