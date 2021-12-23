import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';
import { ModbusService } from './modbus.service';

@Injectable()
export class ModbusTask {
  constructor(
    private httpService: HttpService,
    private modbusService: ModbusService,
  ) {}

  @Timeout(200)
  async handleTimeout() {
    while (true) {
      try {
        var x = await this.modbusService.readHoldingRegistersAsync(32, 10);
        console.log(x);
      } catch (e) {
        console.log(e);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
