import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { MonitorService } from './monitor.service';

@Controller('monitor')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Post('report')
  async report(@Body() data: any) {
    return this.monitorService.create(data);
  }

  @Get(':appId/data')
  async getData(
    @Param('appId') appId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.monitorService.findByApp(appId, page, limit);
  }

  @Get(':appId/statistics')
  async getStatistics(
    @Param('appId') appId: string,
    @Query('start') start?: number,
    @Query('end') end?: number
  ) {
    const timeRange = start && end ? { start, end } : undefined;
    return this.monitorService.getStatistics(appId, timeRange);
  }

  @Get(':appId/performance')
  async getPerformanceMetrics(
    @Param('appId') appId: string,
    @Query('start') start?: number,
    @Query('end') end?: number
  ) {
    const timeRange = start && end ? { start, end } : undefined;
    return this.monitorService.getPerformanceMetrics(appId, timeRange);
  }

  @Get(':appId/errors')
  async getErrorStats(
    @Param('appId') appId: string,
    @Query('start') start?: number,
    @Query('end') end?: number
  ) {
    const timeRange = start && end ? { start, end } : undefined;
    return this.monitorService.getErrorStats(appId, timeRange);
  }

  @Get(':appId/pageviews')
  async getPageViews(
    @Param('appId') appId: string,
    @Query('start') start?: number,
    @Query('end') end?: number
  ) {
    const timeRange = start && end ? { start, end } : undefined;
    return this.monitorService.getPageViews(appId, timeRange);
  }
}