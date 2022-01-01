export class RoomLogDto {
  vs: number;
  ds: number;
  ts: number;
  cs: number;
  ks: number;
  hs: number;
  ls: number;
  ws: number;

  //MEASURED

  vm: number;
  dm: number;
  tm: number;
  cm: number;
  km: number;
  hm: number;
  lm: number;
  wm: number;

  //OTHER

  phase: number;
  valveH: number;
  valveC: number;
  tSource: number;

  // T KOMPOST

  tk1: number;
  tk2: number;
  tk3: number;
  tk4: number;
  roomId: number;

  //
  factoryId: number;
  roomKey: string;
}
