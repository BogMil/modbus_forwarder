import { HttpException, HttpStatus } from '@nestjs/common';

export class ModbusException extends HttpException {
  constructor() {
    super('ModbusException', HttpStatus.I_AM_A_TEAPOT);
  }
}
