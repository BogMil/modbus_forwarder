import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ModbusRTU from 'modbus-serial';
import { ModbusException } from './exceptions/modbus.exception';

@Injectable()
export class ModbusService {
  private client;
  private serialPort;
  constructor(configService: ConfigService) {
    this.initModbusClient(configService);
  }

  private initModbusClient(configService: ConfigService) {
    this.serialPort = configService.get<string>('MODBUS_SERIAL_PORT');
    this.client = new ModbusRTU();
    this.client.setID(33);
    this.connect();
  }

  private connect() {
    this.client.connectRTUBuffered(this.serialPort, { baudRate: 9600 });
  }

  async readHoldingRegistersAsync(
    addr: number,
    length: number,
  ): Promise<number[]> {
    if (!this.client.isOpen) {
      this.connect();
    }

    let res = await this.client.readHoldingRegisters(addr, length);

    if (res.err) {
      throw new ModbusException();
    }
    return res.data;
  }

  async readHoldingRegisterAsync(addr: number) {
    return await this.readHoldingRegistersAsync(addr, 1);
  }
}
