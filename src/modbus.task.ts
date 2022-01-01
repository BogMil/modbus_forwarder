import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';

import { ModbusService } from './modbus.service';

enum PlcRoomStatuses {
  room_A_active = 4,
  room_B_active = 5,
}

class RoomData {
  readonly vs: number;
  readonly ds: number;
  readonly ts: number;
  readonly cs: number;
  readonly ks: number;
  readonly hs: number;
  readonly ls: number;
  readonly ws: number;
  readonly vm: number;
  readonly dm: number;
  readonly tm: number;
  readonly cm: number;
  readonly km: number;
  readonly hm: number;
  readonly lm: number;
  readonly wm: number;
  readonly phase: number;
  readonly valveH: number;
  readonly valveC: number;
  readonly tSource: number;
  readonly tk1: number;
  readonly tk2: number;
  readonly tk3: number;
  readonly tk4: number;
  constructor(data: number[]) {
    //TODO:check if there are 64

    this.vs = data[0];
    this.ds = data[1];
    this.ts = data[2];
    this.cs = data[3];
    this.ks = data[4];
    this.hs = data[5];
    this.ls = data[6];
    this.ws = data[7];
    this.vm = data[8];
    this.dm = data[9];
    this.tm = data[10];
    this.cm = data[11];
    this.km = data[12];
    this.hm = data[13];
    this.lm = data[14];
    this.wm = data[15];
    this.phase = data[16];
    this.valveH = data[17];
    this.valveC = data[18];
    this.tSource = data[19];
    this.tk1 = data[20];
    this.tk2 = data[21];
    this.tk3 = data[22];
    this.tk4 = data[23];
  }

  toPostData() {
    return {
      vs: this.vs.toFixed(1),
      ds: this.ds.toFixed(1),
      ts: (this.ts / 10).toFixed(1),
      cs: this.cs.toFixed(1),
      ks: (this.ks / 10).toFixed(1),
      hs: this.hs.toFixed(1),
      ls: this.ls.toFixed(1),
      ws: this.ws.toFixed(1),
      vm: this.vm.toFixed(1),
      dm: this.dm.toFixed(1),
      tm: (this.tm / 10).toFixed(1),
      cm: this.cm.toFixed(1),
      km: (this.km / 10).toFixed(1),
      hm: this.hm.toFixed(1),
      lm: this.lm.toFixed(1),
      wm: this.wm.toFixed(1),
      phase: this.phase,
      valveH: this.valveH.toFixed(1),
      valveC: this.valveC.toFixed(1),
      tSource: (this.tSource / 10).toFixed(1),
      tk1: (this.tk1 / 10).toFixed(1),
      tk2: (this.tk2 / 10).toFixed(1),
      tk3: (this.tk3 / 10).toFixed(1),
      tk4: (this.tk4 / 10).toFixed(1),
    };
  }
}
@Injectable()
export class HttpLoggerService {
  constructor(private httpService: HttpService) {}
  async logRoom(key: string, data: number[]) {
    try {
      var roomData = new RoomData(data);
      console.log(data);
      this.httpService
        .post(
          `http://localhost:3333/log/factory/3/room/${key}`,
          roomData.toPostData(),
        )
        .subscribe(
          {
            // next: (v) => console.log('success'),
            error: (e) => console.error(e?.response?.status, e?.response?.data),
            // complete: () => console.info('complete'),
          },
          // (s) => console.log(s),
          // (e) => console.log(e),
        );

      console.log(`loog room ${key}`);
    } catch (e) {
      console.log(e);
    }
  }
}

interface ModbusDevice {
  id: number;
  status: number[];
}
class Co2Monitor implements ModbusDevice {
  id: number;
  status: number[];
  scadaReader: ScadaReader;
  httpLoggerService: HttpLoggerService;
  constructor(
    id: number,
    status: number[],
    scadaReader: ScadaReader,
    httpLoggerService: HttpLoggerService,
  ) {
    this.id = id;
    this.status = status;
    this.scadaReader = scadaReader;
    this.httpLoggerService = httpLoggerService;
  }
}
class Station implements ModbusDevice {
  id: number;
  status: number[];
  scadaReader: ScadaReader;
  httpLoggerService: HttpLoggerService;

  constructor(
    id: number,
    status: number[],
    scadaReader: ScadaReader,
    httpLoggerService: HttpLoggerService,
  ) {
    this.id = id;
    this.status = status;
    this.scadaReader = scadaReader;
    this.httpLoggerService = httpLoggerService;
  }

  isActiveRoomA() {
    return this.status[PlcRoomStatuses.room_A_active] == 1;
  }

  isActiveRoomB() {
    return this.status[PlcRoomStatuses.room_B_active] == 1;
  }

  async scanRooms() {
    const [roomAData, roomBData] = await this.getRoomsData();

    if (roomAData) {
      // console.log(roomAData);
      this.httpLoggerService.logRoom(`${this.id}A`, roomAData);
    }

    if (roomBData) {
      // console.log(roomAData);
      this.httpLoggerService.logRoom(`${this.id}B`, roomBData);
    }
  }

  private async getRoomsData(): Promise<number[][]> {
    const isActiveRoomA = this.isActiveRoomA();
    const isActiveRoomB = this.isActiveRoomB();

    let roomAData: number[];
    let roomBData: number[];

    if (isActiveRoomA && isActiveRoomB) {
      [roomAData, roomBData] = await this.scadaReader.readRoomsAsync(this.id);
    } else if (isActiveRoomA && !isActiveRoomB) {
      roomAData = await this.scadaReader.readRoomADataAsync(this.id);
    } else if (!isActiveRoomA && isActiveRoomB) {
      roomBData = await this.scadaReader.readRoomBDataAsync(this.id);
    }

    return Promise.resolve([roomAData, roomBData]);
  }
}

const PLC_SERVER = {
  STATUSES_START_REGISTER: 6000,
  STATUSES_LENGTH: 64,
  GET_STATION_ROOMS_START_REGISTER: (stationId: number) =>
    6000 + stationId * 64,

  STATION_ROOMS_DATA_LENGTH: 64,
  STATION_FIRST_INDEX: 0,
  STATION_LAST_INDEX: 31,

  C02_FIRST_INDEX: 32,
  C02_LAST_INDEX: 35,
};

@Injectable()
export class ScadaReader {
  constructor(private modbusService: ModbusService) {}

  async readStationsAsync(): Promise<number[]> {
    return await this.modbusService.readHoldingRegistersAsync(
      PLC_SERVER.STATUSES_START_REGISTER,
      PLC_SERVER.STATUSES_LENGTH,
    );
  }

  async readRoomsAsync(stationId): Promise<number[][]> {
    var roomsData = await this.readRoomsDataAsync(stationId);
    var roomAData = roomsData.slice(0, 32);
    var roomBData = roomsData.slice(32);

    return Promise.resolve([roomAData, roomBData]);
  }

  private async readRoomsDataAsync(stationId: number) {
    return await this.modbusService.readHoldingRegistersAsync(
      PLC_SERVER.GET_STATION_ROOMS_START_REGISTER(stationId),
      PLC_SERVER.STATION_ROOMS_DATA_LENGTH,
    );
  }

  async readRoomADataAsync(stationId: number) {
    return await this.modbusService.readHoldingRegistersAsync(
      PLC_SERVER.GET_STATION_ROOMS_START_REGISTER(stationId),
      PLC_SERVER.STATION_ROOMS_DATA_LENGTH / 2,
    );
  }

  async readRoomBDataAsync(stationId: number) {
    return await this.modbusService.readHoldingRegistersAsync(
      PLC_SERVER.GET_STATION_ROOMS_START_REGISTER(stationId) +
        PLC_SERVER.STATION_ROOMS_DATA_LENGTH / 2,
      PLC_SERVER.STATION_ROOMS_DATA_LENGTH / 2,
    );
  }
}

@Injectable()
export class PlcServer {
  private statuses: number[];
  constructor(
    private httpLoggerService: HttpLoggerService,
    private scadaReader: ScadaReader,
  ) {}

  async scanAsync() {
    await this.scanStatusesAsync();

    await this.scanStations();
    await this.scanCo2Monitors();
  }

  async scanStations() {
    var stations = await this.getExistingStationsAsync();

    for (var i = 0; i < stations.length; i++) {
      const station = stations[i];

      if (station.status.length != 16) {
        //TODO: something is wrong
      }

      //TODO: handle statuses - first four

      await station.scanRooms();
    }
  }

  async scanCo2Monitors() {
    var co2Monitors = await this.getExistingCo2MonitorAsync();
    // console.log(co2Monitors);
    // for (var i = 0; i < co2Monitors.length; i++) {
    //   const co2Monitor = co2Monitors[i];

    //   if (co2Monitor.status.length != 16) {
    //     //TODO: something is wrong
    //   }

    //   //TODO: handle statuses - first four

    //   await co2Monitor.scanRooms();
    // }
  }

  async scanStatusesAsync() {
    this.statuses = await this.scadaReader.readStationsAsync();
  }

  private async getExistingStationsAsync(): Promise<Station[]> {
    return this.statuses
      .slice(PLC_SERVER.STATION_FIRST_INDEX, PLC_SERVER.STATION_LAST_INDEX + 1)
      .map((status, i) => {
        return new Station(
          PLC_SERVER.STATION_FIRST_INDEX + i + 1,
          this.toInversedBitArray(status),
          this.scadaReader,
          this.httpLoggerService,
        );
      })
      .filter((s) => {
        return s.status.reduce((total = 0, num) => (total += num)) != 0;
      });
  }

  private async getExistingCo2MonitorAsync(): Promise<Co2Monitor[]> {
    return this.statuses
      .slice(PLC_SERVER.C02_FIRST_INDEX, PLC_SERVER.C02_LAST_INDEX + 1)
      .map((status, i) => {
        return new Co2Monitor(
          PLC_SERVER.C02_FIRST_INDEX + i + 1,
          this.toInversedBitArray(status),
          this.scadaReader,
          this.httpLoggerService,
        );
      })
      .filter((s) => s.status.reduce((total = 0, num) => (total += num)) != 0);
  }

  toInversedBitArray(status: number): number[] {
    const binaryStatus = (status >>> 0).toString(2);
    const padded = binaryStatus.padStart(16, '0');
    var statusBitArray = padded
      .split('')
      .reverse()
      .map((s) => parseInt(s));

    return statusBitArray;
  }
}
@Injectable()
export class ModbusTask {
  constructor(private httpService: HttpService, private plcServer: PlcServer) {}

  @Timeout(200)
  async handleTimeout() {
    while (true) {
      try {
        this.plcServer.scanAsync();
      } catch (e) {
        console.log(e);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
