import { Controller, Get } from '@nestjs/common';
import { timeout } from 'rxjs';
import { AppService } from './app.service';
var ModbusRTU = require('modbus-serial');

@Controller()
export class AppController {
  private client;
  constructor(private readonly appService: AppService) {
    this.client = new ModbusRTU();
    this.client.setID(1);
    this.client.connectRTUBuffered('COM4', { baudRate: 9600 });
  }

  @Get()
  async getHello(): Promise<any> {
    if (!this.client.isOpen) {
      try {
        var res = await this.client.connectRTUBuffered('COM4', {
          baudRate: 9600,
        });
      } catch (e) {
        return e.message;
      }
    }
    var mmbsResponse = await this.client.readHoldingRegisters(32, 10);

    // console.log('=>>>', mmbsResponse);
    // if (this.client.isOpen) this.client.close();
    return mmbsResponse.data ?? mmbsResponse.err;
  }
}
