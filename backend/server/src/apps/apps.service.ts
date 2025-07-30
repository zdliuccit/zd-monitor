import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { App, AppDocument } from '../schemas/app.schema';

@Injectable()
export class AppsService {
  constructor(
    @InjectModel(App.name) private appModel: Model<AppDocument>,
  ) {}

  async create(userId: string, appData: Partial<App>) {
    const app = new this.appModel({
      ...appData,
      userId,
      appId: this.generateAppId(),
    });
    return app.save();
  }

  async findByUser(userId: string) {
    return this.appModel.find({ userId }).exec();
  }

  async findOne(id: string) {
    return this.appModel.findById(id).exec();
  }

  async update(id: string, updateData: Partial<App>) {
    return this.appModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string) {
    return this.appModel.findByIdAndDelete(id).exec();
  }

  private generateAppId(): string {
    return 'app_' + Math.random().toString(36).substr(2, 16);
  }
}