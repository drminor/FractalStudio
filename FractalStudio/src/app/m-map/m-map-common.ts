import { element } from "@angular/core/src/render3/instructions";
import * as math from "mathjs";

const MAX_CANVAS_WIDTH: number = 5000;
const MAX_CANVAS_HEIGHT: number = 5000;

export interface IPoint {
  x: number;
  y: number;
}

export interface IMapInfo {
  bottomLeft: IPoint;
  topRight: IPoint;
  maxInterations: number;
}

export interface ICanvasSize {
  width: number;
  height: number
}

export interface IMapWorkingData {
  canvasSize: ICanvasSize;
  mapInfo: IMapInfo;
  sectionAnchor: IPoint;

  elementCount: number;

  // Current z values
  wAData: Float64Array; // Stores the current A (or real component.)
  wBData: Float64Array; // Stores the current B (or complex component.)

  xVals: number[];
  yVals: number[];

  // The number of times each point has been iterated.
  cnts: Uint16Array;

  // Flag for each point. If set then the point has grown more than 2.
  flags: Uint8Array;

  curInterations: number;

  //getLinearIndex(x: number, y: number): number;
  getLinearIndex(c: IPoint): number;
  doInterationsForAll(iterCount: number): boolean;
  doInterationsForLine(iterCount: number, y: number): boolean;

  getImageData(): ImageData;
  getImageDataForLine(y: number): ImageData;
}

export class Point implements IPoint {
  constructor(public x: number, public y: number) { }
}

export class CanvasSize implements ICanvasSize {

  constructor(public width: number, public height: number) {
    if (!this.isReasonableExtent(this.width, MAX_CANVAS_WIDTH)) {
      alert('Width is invalid');
    }
    if (!this.isReasonableExtent(this.height, MAX_CANVAS_HEIGHT)) {
      alert('Height is invalid');
    }
  }

  isReasonableExtent(nVal:number, max:number): boolean {
    return isFinite(nVal) && nVal > 0 && nVal <= max && Math.floor(nVal) === nVal;
  }
}

export class MapInfo implements IMapInfo {
  constructor(public bottomLeft: IPoint, public topRight: IPoint, public maxInterations: number) {
  }
}

export class MapWorkingData implements IMapWorkingData {

  public elementCount: number;

  // Current z values
  public wAData: Float64Array; // Stores the current A (or real component.)
  public wBData: Float64Array; // Stores the current B (or complex component.)

  // The number of times each point has been iterated.
  public cnts: Uint16Array;

  // Flag for each point. If set then the point has grown more than 2.
  public flags: Uint8Array;

  public xVals: number[];
  public yVals: number[];

  public curInterations: number;

  constructor(public canvasSize: ICanvasSize, public mapInfo: IMapInfo, public sectionAnchor: IPoint) {

    this.elementCount = this.getNumberOfElementsForCanvas(this.canvasSize);

    this.wAData = new Float64Array(this.elementCount); // All elements now have a value of zero.
    this.wBData = new Float64Array(this.elementCount); // All elements now have a value of zero.

    this.cnts = new Uint16Array(this.elementCount);
    this.flags = new Uint8Array(this.elementCount);

    // X coordinates get larger as one moves from the left of the map to  the right.
    this.xVals = MapWorkingData.buildVals(this.canvasSize.width, this.mapInfo.bottomLeft.x, this.mapInfo.topRight.x);

    // Y coordinates get larger as one moves from the bottom of the map to the top.
    // But ImageData "blocks" are drawn from top to bottom.
    //this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);

    // if we only have a single section, then we must reverse the y values.
    this.yVals = MapWorkingData.buildValsRev(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);

    this.curInterations = 0;
  }

  // Calculate the number of elements in our single dimension data array needed to cover the
  // two-dimensional map.
  private getNumberOfElementsForCanvas(cs: ICanvasSize): number {
    return cs.width * cs.height;
  }

  // Build the array of 'c' values for one dimension of the map.
  static buildVals(canvasExtent: number, start: number, end: number): number[] {
    let result: number[] = new Array<number>(canvasExtent);

    let mapExtent: number = end - start;
    let unitExtent: number = mapExtent / canvasExtent;

    var i: number;
    for (i = 0; i < canvasExtent; i++) {
      result[i] = start + i * unitExtent;
    }
    return result;
  }

  // Build the array of 'c' values for one dimension of the map.
  static buildValsRev(canvasExtent: number, start: number, end: number): number[] {
    let result: number[] = new Array<number>(canvasExtent);

    let mapExtent: number = end - start;
    let unitExtent: number = mapExtent / canvasExtent;

    var i: number;
    var ptr: number = 0;
    for (i = canvasExtent - 1; i > -1; i--) {
      result[ptr++] = start + i * unitExtent;
    }
    return result;
  }

  //public getLinearIndex(x:number, y:number): number {
  //  return x + y * this.canvasSize.width;
  //}

  // Returns the index to use when accessing wAData, wBData, cnts or flags.
  public getLinearIndex(c: IPoint): number {
    return c.x + c.y * this.canvasSize.width;
  }

  // Calculates z squared + c
  getNextVal(z: IPoint, c: IPoint): IPoint {
    const result: IPoint = new Point(
      z.x * z.x - z.y * z.y + c.x,
      2 * z.x * z.y + c.y
    );

    return result;
  }

  // Returns the square of the magnitude of a complex number where a is the real component and b is the complex component.
  private getAbsSizeSquared(z: IPoint): number {
    const result:number = z.x * z.x + z.y * z.y;
    return result;
  }

  // Takes the current value of z for a given coordinate,
  // calculates the next value
  // and updates the current value with this next value.
  // If the 'done' flag is set, no update is made.
  //
  // If the magnitude of the new value is greater than 2 (the square of the magnitude > 4) then it sets the 'done' flag
  // Returns the (new) value of the 'done' flag for this coordinate.
  private iterateElement(mapCoordinate:IPoint, iterCount:number): boolean {
    const ptr = this.getLinearIndex(mapCoordinate);

    if (this.flags[ptr] === 1) {
      // This point has been flagged, don't iterate.
      return true;
    }

    let z:IPoint = new Point(this.wAData[ptr], this.wBData[ptr]);
    const c: IPoint = new Point(this.xVals[mapCoordinate.x], this.yVals[mapCoordinate.y]);

    let cntr: number;

    for (cntr = 0; cntr < iterCount; cntr++) {
      z = this.getNextVal(z, c);

      if (this.getAbsSizeSquared(z) > 4) {
        // This point is done.
        this.flags[ptr] = 1;
        break;
      }
    }

    // Store the new value back to our Working Data.
    this.wAData[ptr] = z.x;
    this.wBData[ptr] = z.y;

    // Increment the number of times this point has been iterated.
    this.cnts[ptr] = this.cnts[ptr] + cntr;

    return this.flags[ptr] === 1;
  }

  // Updates each element for a given line by performing a single interation.
  // Returns true if at least one point is not done.
  public doInterationsForLine(iterCount: number, y: number): boolean {

    let stillAlive: boolean = false; // Assume all done until one is found that is not done.

    let x: number;

    for (x = 0; x < this.canvasSize.width; x++) {
      let pointIsDone = this.iterateElement(new Point(x, y), iterCount);
      if (!pointIsDone) stillAlive = true;
    }

    return stillAlive;
  }

  // Updates each element by performing a single interation.
  // Returns true if at least one point is not done.
  public doInterationsForAll(iterCount: number): boolean {

    let stillAlive: boolean = false; // Assume all done until one is found that is not done.

    let x: number;
    let y: number;

    for (y = 0; y < this.canvasSize.height; y++) {
      for (x = 0; x < this.canvasSize.width; x++) {
        let pointIsDone = this.iterateElement(new Point(x, y), iterCount);
        if (!pointIsDone) stillAlive = true;
      }
    }
    return stillAlive;
  }

  // Divides the specified MapWorking data into the specified vertical sections, each having the width of the original Map.
  static getWorkingDataSections(canvasSize: ICanvasSize, mapInfo: IMapInfo, numberOfSections: number): IMapWorkingData[] {
    let result: IMapWorkingData[] = Array<IMapWorkingData>(numberOfSections);

    // Calculate the heigth of each section, rounded down to the nearest whole number.
    let sectionHeight = canvasSize.height / numberOfSections;
    let sectionHeightWN = parseInt(sectionHeight.toString(), 10);

    // Calculate the height of the last section.
    let lastSectionHeight: number = canvasSize.height - sectionHeightWN * (numberOfSections - 1);

    let left = mapInfo.bottomLeft.x;
    let right = mapInfo.topRight.x;

    let bottomPtr = 0;
    let topPtr = sectionHeightWN;

    let yVals: number[];
    yVals = MapWorkingData.buildValsRev(canvasSize.height, mapInfo.bottomLeft.y, mapInfo.topRight.y);

    let ptr: number = 0;

    // Build all but the last section.
    for (; ptr < numberOfSections - 1; ptr++) {

      let secCanvasSize = new CanvasSize(canvasSize.width, sectionHeightWN);

      let secBottom = yVals[bottomPtr];
      let secTop = yVals[topPtr];

      let secBotLeft = new Point(left, secBottom);
      let secTopRight = new Point(right, secTop);

      let secMapInfo = new MapInfo(secBotLeft, secTopRight, mapInfo.maxInterations);

      let yOffset = ptr * sectionHeightWN;
      let secAnchor: IPoint = new Point(0, yOffset);
      result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, secAnchor);

      // The next bottomPtr should point to one immediately following the last top.
      bottomPtr = topPtr + 1;
      topPtr += sectionHeightWN;
    }

    // Build the last section.
    let secCanvasSize = new CanvasSize(canvasSize.width, lastSectionHeight);

    let secBottom = yVals[bottomPtr];
    let secBotLeft = new Point(left, secBottom);

    topPtr = yVals.length - 1;
    let secTop = yVals[topPtr];
    let secTopRight = new Point(right, secTop);

    let secMapInfo = new MapInfo(secBotLeft, secTopRight, mapInfo.maxInterations);

    let yOffset = ptr * sectionHeightWN;
    let secAnchor: IPoint = new Point(0, yOffset);

    result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, secAnchor);

    return result;
  }

  public getImageData(): ImageData {

    const pixelData = new Uint32Array(this.elementCount);

    this.updateImageDataNew(pixelData);

    const imgData = new Uint8ClampedArray(pixelData.buffer);
    const imageData = new ImageData(imgData, this.canvasSize.width, this.canvasSize.height);

    return imageData;
  }
 
  private updateImageDataNew(pixelData: Uint32Array): void {
    if (pixelData.length !== this.elementCount) {
      console.log("The pixel data does not have the correct number of elements.");
      return;
    }

    let i: number = 0;
    let colorNums = new ColorNumbers();

    //for (; i < this.elementCount; i++) {
    //  const inTheSet: boolean = this.flags[i] === 0;
    //  this.setPixelValueBinaryByInt(inTheSet, i, pixelData, colorNums);
    //}

    for (; i < this.elementCount; i++) {
      const cnt = this.cnts[i];
      this.setPixelValueFromCount(cnt, i, pixelData, colorNums);
    }
  }
  
  private setPixelValueBinaryByInt(on: boolean, ptr: number, imageData: Uint32Array, colorNums: ColorNumbers) {
    if (on) {
      // Points within the set are drawn in black.
      imageData[ptr] = colorNums.red;
    } else {
      // Points outside the set are drawn in white.
      let tt: number = colorNums.white;

      //tt = ‭math.pow(2, 32);

      imageData[ptr] = tt; //math.pow(2, 32).valueOf() as number;
    }
  }

  private setPixelValueFromCount(cnt: number, ptr: number, imageData: Uint32Array, colorNums: ColorNumbers) {

    let cNum: number;

    if (cnt < 10) {
      cNum = colorNums.white;
    }
    else if (cnt < 20) {
      cNum = colorNums.red;
    }
    else if (cnt < 50) {
      cNum = colorNums.green;
    }
    else if (cnt < 200) {
      cNum = colorNums.blue;
    }
    else {
      cNum = colorNums.black;
    }

    imageData[ptr] = cNum;
  }

  public getImageDataForLine(y: number): ImageData {
    const imageData = new ImageData(this.canvasSize.width, 1);
    this.updateImageDataForLine(imageData, y);
    return imageData;
  }

  private updateImageDataForLine(imageData: ImageData, y: number): void {
    let data: Uint8ClampedArray = imageData.data;
    if (data.length !== 4 * this.canvasSize.width) {
      console.log("The imagedata data does not have the correct number of elements.");
      return;
    }

    let start: number = this.getLinearIndex(new Point(0, y));
    let end: number = start + this.canvasSize.width;

    let i: number;

    for (i = start; i < end; i++) {
      const inTheSet: boolean = this.flags[i] === 0;
      this.setPixelValueBinary(inTheSet, i * 4, data);
    }
  }

  private updateImageData(imageData: ImageData): void {
    let data: Uint8ClampedArray = imageData.data;
    if (data.length !== 4 * this.elementCount) {
      console.log("The imagedata data does not have the correct number of elements.");
      return;
    }

    let i: number = 0;

    for (; i < this.elementCount; i++) {
      const inTheSet: boolean = this.flags[i] === 0;
      this.setPixelValueBinary(inTheSet, i * 4, data);
    }
  }

  private setPixelValueBinary(on: boolean, ptr: number, imageData: Uint8ClampedArray) {
    if (on) {
      // Points within the set are drawn in black.
      imageData[ptr] = 0;
      imageData[ptr + 1] = 0;
      imageData[ptr + 2] = 0;
      imageData[ptr + 3] = 255;
    } else {
      // Points outside the set are drawn in white.
      imageData[ptr] = 255;
      imageData[ptr + 1] = 255;
      imageData[ptr + 2] = 255;
      imageData[ptr + 3] = 255;
    }
  }

  public getImageDataOld(): ImageData {
    const imageData = new ImageData(this.canvasSize.width, this.canvasSize.height);
    this.updateImageData(imageData);
    return imageData;
  }

  // Returns a 'regular' linear array of booleans from the flags TypedArray.
  private getFlagData(mapWorkingData: IMapWorkingData): boolean[] {

    var result: boolean[] = new Array<boolean>(mapWorkingData.elementCount);

    var i: number;
    for (i = 0; i < result.length; i++) {
      result[i] = mapWorkingData.flags[i] !== 0;
    }

    return result;
  }
} // End Class MapWorkingData


export class ColorNumbers {

  black: number = 65536 * 65280; // FF00 0000
  white: number; // = -1 + 65536 * 65536; // FFFF FFFF
  red: number;
  green: number;
  blue: number;

  constructor() {
    this.white = this.getColorNumber(255, 255, 255);
    this.red = this.getColorNumber(255, 0, 0);
    this.green = this.getColorNumber(0, 255, 0);
    this.blue = this.getColorNumber(0, 0, 255);
  }

  private getColorNumber(r: number, g: number, b: number): number {

    if (r > 255 || r < 0) throw new RangeError('R must be between 0 and 255.');
    if (g > 255 || g < 0) throw new RangeError('G must be between 0 and 255.');
    if (b > 255 || b < 0) throw new RangeError('B must be between 0 and 255.');

    let result: number = this.black;
    result += b << 16;
    result += g << 8;
    result += r;

    return result;
  }
}

// ---- WebWorker Messages ----

export interface IWebWorkerMessage {
  messageKind: string;
}

export interface IWebWorkerMapUpdateResponse extends IWebWorkerMessage {
  sectionNumber?: number;
  imgData?: Uint8ClampedArray;

  getImageData(cs: ICanvasSize): ImageData;
}

export interface IWebWorkerStartRequest extends IWebWorkerMessage {
  canvasSize: ICanvasSize;
  mapInfo: IMapInfo;
  sectionAnchor: IPoint;
  sectionNumber: number;
}

export interface IWebWorkerIterateRequest extends IWebWorkerMessage {
  iterateCount: number;
}

export class WebWorkerMessage implements IWebWorkerMessage {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerMessage {
    return new WebWorkerMessage(data.messageKind || data || 'no data');
  }
}

export class WebWorkerMapUpdateResponse implements IWebWorkerMapUpdateResponse {

  constructor(public messageKind: string, public sectionNumber: number, public imgData?: Uint8ClampedArray) { }

  static FromEventData(data: any): IWebWorkerMapUpdateResponse {
    let result = new WebWorkerMapUpdateResponse(data.messageKind, data.sectionNumber, data.imgData);

    return result;
  }

  static ForUpdateMap(sectionNumber: number, imageData: ImageData): IWebWorkerMapUpdateResponse {
    let result = new WebWorkerMapUpdateResponse("UpdatedMapData", sectionNumber, imageData.data);
    return result;
  }

  public getImageData(cs: ICanvasSize): ImageData {
    let result: ImageData = null;

    if (this.imgData) {
      let pixelCount = this.imgData.length / 4;
      if (pixelCount !== cs.width * cs.height) {
        console.log('The image data being returned is not the correct size for our canvas.');
      }
      result = new ImageData(this.imgData, cs.width, cs.height);
    }
    return result;
  }
}

export class WebWorkerStartRequest implements IWebWorkerStartRequest {

  constructor(public messageKind: string, public canvasSize: ICanvasSize, public mapInfo: IMapInfo, public sectionAnchor: IPoint, public sectionNumber: number) { }

  static FromEventData(data: any): IWebWorkerStartRequest {
    let result = new WebWorkerStartRequest(
      data.messageKind,
      data.canvasSize,
      data.mapInfo,
      data.sectionAnchor,
      data.sectionNumber
    );
    return result;
  }

  static ForStart(mapWorkingData: IMapWorkingData, sectionNumber: number): IWebWorkerStartRequest {
    let result = new WebWorkerStartRequest('Start', mapWorkingData.canvasSize, mapWorkingData.mapInfo, mapWorkingData.sectionAnchor, sectionNumber);
    return result;
  }
}

export class WebWorkerIterateRequest implements IWebWorkerIterateRequest {
  constructor(public messageKind: string, public iterateCount: number) { }

  static FromEventData(data: any): IWebWorkerIterateRequest {
    let result = new WebWorkerIterateRequest(data.messageKind,  data.iterateCount);
    return result;
  }

  static ForIterate(iterateCount: number): IWebWorkerIterateRequest {
    let result = new WebWorkerIterateRequest('Iterate', iterateCount);
    return result;
  }
}

/// Only used when the javascript produced from compiling this TypeScript is used to create worker.js

//var mapWorkingData: IMapWorkingData = null;
//var sectionNumber: number = 0;

//// Handles messages sent from the window that started this web worker.
//onmessage = function (e) {
//  //console.log('Worker received message: ' + e.data + '.');
//  let plainMsg: IWebWorkerMessage = WebWorkerMessage.FromEventData(e.data);

//  if (plainMsg.messageKind === 'Start') {
//    let startMsg = WebWorkerStartRequest.FromEventData(e.data);
//    mapWorkingData = new MapWorkingData(startMsg.canvasSize, startMsg.mapInfo, startMsg.sectionAnchor);
//    sectionNumber = startMsg.sectionNumber;
//    console.log('Worker created MapWorkingData with element count = ' + mapWorkingData.elementCount);

//    let responseMsg = new WebWorkerMessage('StartResponse');
//    console.log('Posting ' + responseMsg.messageKind + ' back to main script');
//    self.postMessage(responseMsg, "*");
//  }
//  else if (plainMsg.messageKind === 'Iterate') {
//    mapWorkingData.doInterationsForAll(1);
//    var imageData = mapWorkingData.getImageData();
//    let workerResult: IWebWorkerMapUpdateResponse =
//      WebWorkerMapUpdateResponse.ForUpdateMap(sectionNumber, imageData);

//    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
//    self.postMessage(workerResult, "*", [imageData.data.buffer]);
//  }
//  else {
//    console.log('Received unknown message kind: ' + plainMsg.messageKind);
//  }


//};




