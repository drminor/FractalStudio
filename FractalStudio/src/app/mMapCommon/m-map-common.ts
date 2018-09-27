
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
  doInterations(iterationCnt: number): boolean;
  getImageData(): Uint8ClampedArray;
  updateImageData(imageData: Uint8ClampedArray): void;
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
  };
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
      result[i] = start + (i * unitExtent);
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
  private iterateElement(mapCoordinate:IPoint): boolean {
    const ptr = this.getLinearIndex(mapCoordinate);

    if (this.flags[ptr]) {
      // This point has been flagged, don't interate.
      return true;
    }

    const z:IPoint = new Point(this.wAData[ptr], this.wBData[ptr]);
    const c: IPoint = new Point(this.xVals[mapCoordinate.x], this.yVals[mapCoordinate.y]);

    const newZ = this.getNextVal(z, c);

    // Store the new value back to our Working Data.
    this.wAData[ptr] = newZ.x;
    this.wBData[ptr] = newZ.y;

    const aSize = this.getAbsSizeSquared(newZ);

    // Increment the number of times this point has been iterated.
    this.cnts[ptr] = this.cnts[ptr] + 1;

    if (aSize > 4) {
      // This point is done.
      this.flags[ptr] = 1;
      return true;
    }
    else {
      // This point is still 'alive'.
      return false;
    }
  }

  // Updates each element by performing a single interation.
  // Returns true if at least one point is not done.
  private iterateAllElementsOnce(): boolean {

    var result: boolean = false; // Assume all done until one is found that is not done.

    var i: number;
    var j: number;

    for (i = 0; i < this.canvasSize.height; i++) {
      for (j = 0; j < this.canvasSize.width; j++) {
        var pointIsDone = this.iterateElement(new Point(j, i));
        
        if (!pointIsDone) result = true;
      }

    }
    return result;
  }

  public doInterations(iterationCnt: number): boolean {
    var i: number;
    var alive: boolean = true;

    for (i = 0; i < iterationCnt && alive; i++) {
      var alive = this.iterateAllElementsOnce();
    }
    return alive;
  }

  public getImageData(): Uint8ClampedArray {
    const resultLen = 4 * this.elementCount;
    const result: Uint8ClampedArray = new Uint8ClampedArray(resultLen);

    this.updateImageData(result);
    return result;
  }

  public updateImageData(imageData: Uint8ClampedArray): void {

    if (imageData.length != 4 * this.elementCount) {
      console.log("The imagedata data does not have the correct number of elements.");
      return;
    }

    var i: number;

    for (i = 0; i < this.elementCount; i++) {
      const inTheSet: boolean = this.flags[i] === 0;
      this.setPixelValueBinary(inTheSet, i * 4, imageData);
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
      result[i] = mapWorkingData.flags[i] != 0;
    }

    return result;
  }

}



