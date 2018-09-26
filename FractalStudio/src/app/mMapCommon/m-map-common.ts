
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

  getLinearIndex(x: number, y: number): number;
  doInterations(iterationCnt: number): boolean;
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

  // Returns the index to use when accessing wAData, wBData, cnts or flags.
  public getLinearIndex(x: number, y: number): number {
    return x + y * this.canvasSize.width;
  }

  // Calculates z squared + c
  // a and b are the real and complex components of z
  // cx and cy are the real and complex components of c
  getNextVal(a: number, b: number, cx: number, cy: number): { newA: number, newB: number } {
    let na: number = a * a - b * b + cx;
    let nb: number = 2 * a * b + cy;

    return { newA: na, newB: nb };
  }

  // Returns the square of the magnitude of a complex number where a is the real component and b is the complex component.
  private getAbsSizeSquared(a: number, b: number): number {
    //let na = a < 0 ? -1 * a : a;
    //let nb = b < 0 ? -1 * b : b;
    //let result = na * na + nb * nb;

    let result = a * a + b * b;
    return result;
  }

  // Takes the current value of z for a given coordinate,
  // calculates the next value
  // and updates the current value with this next value.
  // If the 'done' flag is set, no update is made.
  //
  // If the magnitude of the new value is greater than 2 (the square of the magnitude > 4) then it sets the 'done' flag
  // Returns the (new) value of the 'done' flag for this coordinate.
  private iterateElement(x: number, y: number): boolean {
    let ptr = this.getLinearIndex(x, y);

    if (this.flags[ptr]) {
      // This point has been flagged, don't interate.
      return true;
    }

    let ea = this.wAData[ptr];
    let eb = this.wBData[ptr];

    let cx = this.xVals[x];
    let cy = this.yVals[y];

    let newResult = this.getNextVal(ea, eb, cx, cy);
    let na: number = newResult.newA;
    let nb: number = newResult.newB;

    this.wAData[ptr] = na;
    this.wBData[ptr] = nb;

    let aSize = this.getAbsSizeSquared(na, nb);

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
        var pointIsDone = this.iterateElement(j, i);
        
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



