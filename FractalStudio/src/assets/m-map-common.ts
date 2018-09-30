
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

  elementCount: number;

  // Current z values
  wAData: Float64Array; // Stores the current A (or real component.)
  wBData: Float64Array; // Stores the current B (or complex component.)

  // The number of times each point has been iterated.
  cnts: Uint16Array;

  // Flag for each point. If set then the point has grown more than 2.
  flags: Uint8Array;

  //getLinearIndex(x: number, y: number): number;
  getLinearIndex(c: IPoint): number;
  doInterationsForAll(iterCount: number): boolean;
  doInterationsForLine(iterCount: number, y: number): boolean;

  getImageData(): ImageData;
  getImageDataForLine(y: number): ImageData;

  updateImageData(imageData: ImageData): void;
  updateImageDataForLine(imageData: ImageData, y: number): void;
}

export class Point implements IPoint {
  constructor(public x: number, public y: number) { }
}

export class MapInfo implements IMapInfo {
  constructor(public bottomLeft: IPoint, public topRight: IPoint, public maxInterations: number) {
  }
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

export class MapWorkingData {

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

  //public alive: boolean = true;

  constructor(public canvasSize: ICanvasSize, public mapInfo: IMapInfo) {

    this.elementCount = this.getNumberOfElementsForCanvas(this.canvasSize);

    this.wAData = new Float64Array(this.elementCount); // All elements now have a value of zero.
    this.wBData = new Float64Array(this.elementCount); // All elements now have a value of zero.

    this.cnts = new Uint16Array(this.elementCount);
    this.flags = new Uint8Array(this.elementCount);

    // X coordinates get larger as one moves from the left of the map to  the right.
    this.xVals = this.buildVals(this.canvasSize.width, this.mapInfo.bottomLeft.x, this.mapInfo.topRight.x);

    // Y coordinates get larger as one moves from the bottom of the map to the top.
    this.yVals = this.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);

    // Assume that this map will contain at least on point in the set, until proven otherwise.
    //this.alive = true;
  }

  // Calculate the number of elements in our single dimension data array needed to cover the
  // two-dimensional map.
  private getNumberOfElementsForCanvas(cs: ICanvasSize): number {
    return cs.width * cs.height;
  }

  // Build the array of 'c' values for one dimension of the map.
  private buildVals(canvasExtent: number, start: number, end: number): number[] {
    let result: number[] = new Array<number>(canvasExtent);

    let mapExtent: number = end - start;
    let unitExtent: number = mapExtent / canvasExtent;

    var i: number;
    for (i = 0; i < canvasExtent; i++) {
      result[i] = start + i * unitExtent;
    }
    return result;
  }

  //public getLinearIndex(x:number, y:number): number {
  //  return x + y * this.canvasSize.width;
  //}

  // Returns the index to use when accessing wAData, wBData, cnts or flags.
  public getLinearIndex(c:IPoint): number {
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

    //const aSize = this.getAbsSizeSquared(z);

    //// Increment the number of times this point has been iterated.
    //this.cnts[ptr] = this.cnts[ptr] + iterCount;

    //if (aSize > 4) {
    //  // This point is done.
    //  this.flags[ptr] = 1;
    //  return true;
    //}
    //else {
    //  // This point is still 'alive'.
    //  return false;
    //}
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
        let pointIsDone = this.iterateElement(new Point(x, y),iterCount);
        if (!pointIsDone) stillAlive = true;
      }
    }
    return stillAlive;
  }

  //public doInterationsForAll_OLD(iterCount: number): boolean {
  //  var i: number;
  //  let stillAlive: boolean = true;

  //  for (i = 0; i < iterCount && stillAlive; i++) {
  //    stillAlive = this.iterateAllElements(iterCount);
  //  }

  //  // Store the value of whether we still alive in our public member for easy access.
  //  this.alive = stillAlive;

  //  return stillAlive;
  //}

  //public doInterationsForLine(iterCount: number, y: number): boolean {
  //  return true;
  //}


  public getImageData(): ImageData {
    const imageData = new ImageData(this.canvasSize.width, this.canvasSize.height);
    this.updateImageData(imageData);
    return imageData;
  }

  public getImageDataForLine(y: number): ImageData {
    const imageData = new ImageData(this.canvasSize.width, 1);
    this.updateImageData(imageData);
    return imageData;
  }

  public updateImageData(imageData: ImageData): void {

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

  public updateImageDataForLine(imageData: ImageData, y: number): void {

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

  // Returns a 'regular' linear array of booleans from the flags TypedArray.
  static getFlagData(mapWorkingData: IMapWorkingData): boolean[] {

    var result: boolean[] = new Array<boolean>(mapWorkingData.elementCount);

    var i: number;
    for (i = 0; i < result.length; i++) {
      result[i] = mapWorkingData.flags[i] !== 0;
    }

    return result;
  }



}

/////////////////

// Handles messages sent from the window that started this web worker.
onmessage = function (e) {

  if (false) {

    let cs: ICanvasSize = new CanvasSize(10, 10);

    let bl: IPoint = new Point(-2, -1);
    let tr: IPoint = new Point(1, 1);
    let maxI: number = 1000;

    let mi: IMapInfo = new MapInfo(bl, tr, maxI);

    let x: IMapWorkingData = new MapWorkingData(cs, mi);

    console.log('Worker created MapWorkingData with element count = ' + x.elementCount);


    console.log('Message received from main script');
    var workerResult = 'Result: ' + (e.data[0] * e.data[1]);
    console.log('Posting message back to main script');
    self.postMessage(workerResult, "*");
  }
}



