import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonitorData, MonitorDataDocument } from '../schemas/monitor-data.schema';

@Injectable()
export class MonitorService {
  constructor(
    @InjectModel(MonitorData.name) private monitorDataModel: Model<MonitorDataDocument>,
  ) {}

  async create(data: Partial<MonitorData>) {
    const monitorData = new this.monitorDataModel(data);
    return monitorData.save();
  }

  async findByApp(appId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.monitorDataModel
      .find({ appId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async getStatistics(appId: string, timeRange?: { start: number; end: number }) {
    const match: any = { appId };
    if (timeRange) {
      match.timestamp = { $gte: timeRange.start, $lte: timeRange.end };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgValue: { $avg: { $ifNull: ['$data.value', 0] } }
        }
      }
    ];

    return this.monitorDataModel.aggregate(pipeline).exec();
  }

  async getPerformanceMetrics(appId: string, timeRange?: { start: number; end: number }) {
    const match: any = { appId, type: 'performance' };
    if (timeRange) {
      match.timestamp = { $gte: timeRange.start, $lte: timeRange.end };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$data.type',
          count: { $sum: 1 },
          avgValue: { $avg: '$data.value' },
          maxValue: { $max: '$data.value' },
          minValue: { $min: '$data.value' }
        }
      }
    ];

    return this.monitorDataModel.aggregate(pipeline).exec();
  }

  async getErrorStats(appId: string, timeRange?: { start: number; end: number }) {
    const match: any = { appId, type: 'error' };
    if (timeRange) {
      match.timestamp = { $gte: timeRange.start, $lte: timeRange.end };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$data.type',
          count: { $sum: 1 },
          messages: { $push: '$data.message' }
        }
      }
    ];

    return this.monitorDataModel.aggregate(pipeline).exec();
  }

  async getPageViews(appId: string, timeRange?: { start: number; end: number }) {
    const match: any = { appId };
    if (timeRange) {
      match.timestamp = { $gte: timeRange.start, $lte: timeRange.end };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$url',
          count: { $sum: 1 },
          uniqueSessions: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          uniqueSessionCount: { $size: '$uniqueSessions' }
        }
      },
      { $sort: { count: -1 } }
    ];

    return this.monitorDataModel.aggregate(pipeline).exec();
  }
}