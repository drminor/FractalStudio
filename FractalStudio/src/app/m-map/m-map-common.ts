import { IterableChangeRecord_ } from "@angular/core/src/change_detection/differs/default_iterable_differ";

const MAX_CANVAS_WIDTH: number = 50000;
const MAX_CANVAS_HEIGHT: number = 50000;

export interface IPoint {
  x: number;
  y: number;
}

export interface IBox {
  start: IPoint;
  end: IPoint;
  width: number;
  height: number;

  getNormalizedBox(): IBox;
  toString(): string;
}

export interface IMapInfo {
  coords: IBox;
  bottomLeft: IPoint;
  topRight: IPoint;
  maxIterations: number;
  iterationsPerStep: number;

  toString(): string
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

  curIterations: number;

  colorMap: IColorMap;

  getLinearIndex(c: IPoint): number;
  doIterationsForAll(iterCount: number): boolean;
  doIterationsForLine(iterCount: number, y: number): boolean;

  getPixelData(): Uint8ClampedArray;
  getImageDataForLine(y: number): ImageData;

  updateImageData(imgData: Uint8ClampedArray): void;

  getHistogram(): Histogram;
}

export class HistArrayPair {
  constructor(public vals: Uint16Array, public occurances: Uint16Array) { }
}

export class HistEntry {
  constructor(public val: number, public occurances: number) { }

  public toString(): string {
    return this.val.toString() + ': ' + this.occurances.toString();
  }
}

export class Histogram {

  public entriesMap: Map<number, number>;

  constructor() {
    this.entriesMap = new Map<number, number>();
  }

  public getHistEntriesAsString(): string {

    let result: string = '';
    let hEntries = this.histEntries;

    let ptr: number;

    for (ptr = 0; ptr < hEntries.length; ptr++) {
      let he = hEntries[ptr];
      result = result + he.toString() + '\n';
    }

    return result;
  }

  public get histEntries(): HistEntry[] {

    let result: HistEntry[] = [];

    let lst = Array.from(this.entriesMap.entries());

    let ptr: number;

    for (ptr = 0; ptr < lst.length; ptr++) {
      result.push(new HistEntry(lst[ptr]["0"], lst[ptr]["1"]));
    }

    return result;
  }

  public getHistArrayPair(): HistArrayPair {
    let vals = new Uint16Array(this.entriesMap.size);
    let occs = new Uint16Array(this.entriesMap.size);

    let vlst = Array.from(this.entriesMap.keys());
    let olst = Array.from(this.entriesMap.values());

    let ptr: number;
    for (ptr = 0; ptr < vlst.length; ptr++) {
      vals[ptr] = vlst[ptr];
      occs[ptr] = olst[ptr];
    }

    let result = new HistArrayPair(vals, occs);
    return result;
  }

  addVal(val: number): void {
    let exEntry = this.entriesMap.get(val);

    if (exEntry === undefined) {
      this.entriesMap.set(val, 1);
    }
    else {
      this.entriesMap.set(val, exEntry + 1);
    }
  }

  addVals(vals: Uint16Array): void {

    if (!vals || vals.length === 0) return;

    let lastVal = vals[0];

    let lastOcc = this.entriesMap.get(lastVal);
    lastOcc = lastOcc === undefined ? 1 : lastOcc + 1;

    let ptr: number;

    for (ptr = 1; ptr < vals.length; ptr++) {
      let val = vals[ptr];

      if (val === lastVal) {
        lastOcc++;
      }
      else {
        this.entriesMap.set(lastVal, lastOcc);
        lastOcc = this.entriesMap.get(val);
        lastOcc = lastOcc === undefined ? 1 : lastOcc + 1;
        lastVal = val;
      }
    }

    if (!(lastVal === undefined)) {
      this.entriesMap.set(lastVal, lastOcc);
    }
  }

  public static fromHistArrayPair(arrayPair: HistArrayPair): Histogram {
    let result = new Histogram();

    let ptr: number;
    for (ptr = 0; ptr < arrayPair.vals.length; ptr++) {
      result.entriesMap.set(arrayPair.vals[ptr], arrayPair.occurances[ptr]);
    }
    return result;
  }

  public addFromArrayPair(arrayPair: HistArrayPair): void {
    let ptr: number;
    for (ptr = 0; ptr < arrayPair.vals.length; ptr++) {
      let val = arrayPair.vals[ptr];
      let occ = this.entriesMap.get(val);
      if (occ === undefined) {
        this.entriesMap.set(val, arrayPair.occurances[ptr]);
      }
      else {
        this.entriesMap.set(val, occ + arrayPair.occurances[ptr]);
      }
    }
  }

}

export class MapInfoWithColorMap {
  constructor(public mapInfo: IMapInfo, public colorMapUi: ColorMapUI) { }

  public static fromForExport(miwcm: MapInfoWithColorMapForExport): MapInfoWithColorMap {

    // Create a new MapInfo from the loaded data.
    let mapInfo = MapInfo.fromIMapInfo(miwcm.mapInfo);

    // Create a new ColorMapUI from the loaded data.
    let colorMap = ColorMapUI.FromColorMapForExport(miwcm.colorMap);

    let result = new MapInfoWithColorMap(mapInfo, colorMap);
    return result;
  }
}

export class MapInfoWithColorMapForExport {
  constructor(public mapInfo: IMapInfo, public colorMap: ColorMapForExport) { }
}

export class Point implements IPoint {
  constructor(public x: number, public y: number) { }

  public static fromStringVals(strX: string, strY: string): IPoint {
    let xNum = parseFloat(strX);
    let yNum = parseFloat(strY);
    let result: IPoint = new Point(xNum, yNum);
    return result;
  }
}

export class Box implements IBox {
  constructor(public start: IPoint, public end: IPoint) { }

  public static fromPointExtent(point: IPoint, width: number, height: number): IBox {
    const result: IBox = new Box(point, new Point(point.x + width, point.y + height));

    return result;
  }
  public get width(): number {
    return this.end.x - this.start.x;
  }

  public get height(): number {
    return this.end.y - this.start.y;
  }

  // Return a box of the same size and position
  // but make sure that the width and height are both positive.
  public getNormalizedBox(): IBox {

    let box = this;

    let sx: number;
    let sy: number;

    let ex: number;
    let ey: number;

    if (box.start.x < box.end.x) {
      if (box.start.y < box.end.y) {
        // Already in normal form.
        sx = box.start.x;
        ex = box.end.x;
        sy = box.start.y;
        ey = box.end.y;
      }
      else {
        // Width is already positive, reverse the y values.
        sx = box.start.x;
        ex = box.end.x;
        sy = box.end.y;
        ey = box.start.y;
      }
    }
    else {
      if (box.start.y < box.end.y) {
        // Height is already positive, reverse the x values.
        sx = box.end.x;
        ex = box.start.x;
        sy = box.start.y;
        ey = box.end.y;
      } else {
        // Reverse both x and y values.
        sx = box.end.x;
        ex = box.start.x;
        sy = box.end.y;
        ey = box.start.y;
      }
    }

    let result = new Box(new Point(this.round(sx), this.round(sy)), new Point(this.round(ex), this.round(ey)));

    return result;
  }

  private round(x: number): number {
    const result: number = parseInt((x + 0.5).toString(), 10);

    return result;
  }

  public toString(): string {
    return 'sx:' + this.start.x + ' ex:' + this.end.x + ' sy:' + this.start.y + ' ey:' + this.end.y + '.';
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

export class MapInfo implements IMapInfo {
  constructor(public coords: IBox, public maxIterations: number, public iterationsPerStep: number) {
  }

  public static fromPoints(bottomLeft: IPoint, topRight: IPoint, maxIterations: number, iterationsPerStep: number): IMapInfo {

    let coords: IBox = new Box(bottomLeft, topRight);
    let result: IMapInfo = new MapInfo(coords, maxIterations, iterationsPerStep);
    return result;
  }

  public static fromIMapInfo(mi: IMapInfo) {

    let result: IMapInfo = new MapInfo(mi.coords, mi.maxIterations, mi.iterationsPerStep);
    return result;
  }

  public get bottomLeft(): IPoint {
    return this.coords.start;
  }

  public get topRight(): IPoint {
    return this.coords.end;
  }

  public toString(): string {
    return 'sx:' + this.coords.start.x + ' ex:' + this.coords.end.x + ' sy:' + this.coords.start.y + ' ey:' + this.coords.end.y + ' mi:' + this.maxIterations + ' ips:' + this.iterationsPerStep + '.';
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

  public curIterations: number;

  //public pixelData: Uint8ClampedArray;

  constructor(public canvasSize: ICanvasSize, public mapInfo: IMapInfo, public colorMap: IColorMap, public sectionAnchor: IPoint, forSubDivision: boolean) {

    this.elementCount = this.getNumberOfElementsForCanvas(this.canvasSize);

    this.wAData = new Float64Array(this.elementCount); // All elements now have a value of zero.
    this.wBData = new Float64Array(this.elementCount); // All elements now have a value of zero.

    this.cnts = new Uint16Array(this.elementCount);
    this.flags = new Uint8Array(this.elementCount);

    // X coordinates get larger as one moves from the left of the map to  the right.
    this.xVals = MapWorkingData.buildVals(this.canvasSize.width, this.mapInfo.bottomLeft.x, this.mapInfo.topRight.x);

    // Y coordinates get larger as one moves from the bottom of the map to the top.
    // But ImageData "blocks" are drawn from top to bottom.

    if (forSubDivision) {
      this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
    }
    else {
      // if we only have a single section, then we must reverse the y values.
      this.yVals = MapWorkingData.buildValsRev(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
    }

    this.curIterations = 0;

    console.log('Constructing MapWorkingData, ColorMap = ' + this.colorMap + '.');
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
  public doIterationsForLine(iterCount: number, y: number): boolean {

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
  public doIterationsForAll(iterCount: number): boolean {

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
  static getWorkingDataSections(canvasSize: ICanvasSize, mapInfo: IMapInfo, colorMap: IColorMap, numberOfSections: number): IMapWorkingData[] {

    console.log('At getWorkingDataSections, ColorMap = ' + colorMap + '.');


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

      let coords: IBox = new Box(secBotLeft, secTopRight);
      let secMapInfo = new MapInfo(coords, mapInfo.maxIterations, mapInfo.iterationsPerStep);

      let yOffset = ptr * sectionHeightWN;
      let secAnchor: IPoint = new Point(0, yOffset);
      result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, colorMap, secAnchor, true);

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

    let coords: IBox = new Box(secBotLeft, secTopRight);
    let secMapInfo = new MapInfo(coords, mapInfo.maxIterations, mapInfo.iterationsPerStep);

    let yOffset = ptr * sectionHeightWN;
    let secAnchor: IPoint = new Point(0, yOffset);

    result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, colorMap, secAnchor, true);

    return result;
  }

  public getPixelData(): Uint8ClampedArray {
    const pixelData = new Uint8ClampedArray(this.elementCount * 4);
    this.updateImageData(pixelData);
    return pixelData;
  }
 
  public updateImageData(imgData: Uint8ClampedArray): void {
    if (imgData.length !== this.elementCount * 4) {
      console.log("The imgData data does not have the correct number of elements.");
      return;
    }

    // Address the image data buffer as Int32's
    const pixelData = new Uint32Array(imgData.buffer);

    //let colorMap: ColorMap = this.colorMap;

    let i: number = 0;
    for (; i < this.elementCount; i++) {
      const cnt = this.cnts[i];
      pixelData[i] = this.colorMap.getColor(cnt);
    }
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
  private getFlagData(mapWorkingData: IMapWorkingData): boolean[] {

    var result: boolean[] = new Array<boolean>(mapWorkingData.elementCount);

    var i: number;
    for (i = 0; i < result.length; i++) {
      result[i] = mapWorkingData.flags[i] !== 0;
    }

    return result;
  }

  public getHistogram(): Histogram {
    let result = new Histogram();
    result.addVals(this.cnts);
    return result;
  }

} // End Class MapWorkingData

export interface IColorMapEntry {
  cutOff: number;
  colorNum: number;
}

export class ColorMapEntry implements IColorMapEntry  {
  constructor(public cutOff: number, public colorNum: number) {
  }
}

export class ColorMapEntryForExport {
  constructor(public cutOff: number, public cssColor: string) {
  }
}

export class ColorMapUIEntry implements IColorMapEntry {

  public colorNum: number;
  public r: number;
  public g: number;
  public b: number;
  public alpha: number = 255;

  public get rgbHex(): string {

    let result: string = '#' + ('0' + this.r.toString(16)).slice(-2) + ('0' + this.g.toString(16)).slice(-2) + ('0' + this.b.toString(16)).slice(-2);
    //return "#FFFF00";
    return result;
  }


  public get rgbaString(): string {
    let result: string = 'rgba(' + this.r.toString(10) + ',' + this.g.toString(10) + ',' + this.b.toString(10) + ',1)';
    //return 'rgba(200,20,40,1)';
    return result;
  }

  constructor(public cutOff: number, public colorVals: number[]) {

    if (colorVals.length === 3) {
      this.r = colorVals[0];
      this.g = colorVals[1];
      this.b = colorVals[2];
      this.alpha = 255;
    }
    else if (colorVals.length === 4) {
      this.r = colorVals[0];
      this.g = colorVals[1];
      this.b = colorVals[2];
      this.alpha = colorVals[3];
    }
    else {
      throw new RangeError('colorVals must have exactly 3 or 4 elements.');
    }

    this.colorNum = ColorNumbers.getColor(this.r, this.g, this.b, this.alpha);
  }

  public static fromColorMapEntry(cme: IColorMapEntry): ColorMapUIEntry {
    let result: ColorMapUIEntry;

    if (typeof (cme) === typeof (ColorMapUIEntry)) {
      result = cme as ColorMapUIEntry;
    }
    else {
      result = ColorMapUIEntry.fromOffsetAndColorNum(cme.cutOff, cme.colorNum);
    }
    return result;
  }

  public static fromOffsetAndColorNum(cutOff: number, cNum: number): ColorMapUIEntry {
    let colorComps: number[] = ColorNumbers.getColorComponents(cNum);
    let result = new ColorMapUIEntry(cutOff, colorComps);
    return result;
  }

  public static fromOffsetAndCssColor(cutOff: number, cssColor: string): ColorMapUIEntry {
    let colorComps: number[] = ColorNumbers.getColorComponentsFromCssColor(cssColor);
    let result = new ColorMapUIEntry(cutOff, colorComps);
    return result;
  }

  public static fromOffsetAndRgba(cutOff: number, rgbaColor: string): ColorMapUIEntry {
    let colorComps: number[] = ColorNumbers.getColorComponentsFromRgba(rgbaColor);
    let result = new ColorMapUIEntry(cutOff, colorComps);
    return result;
  }
}

export interface IColorMap {
  ranges: IColorMapEntry[]
  highColor: number;

  getColor(countValue: number): number;
  insertColorMapEntry(entry: IColorMapEntry, index: number);

  getCutOffs(): Uint16Array;
  getColorNums(): Uint32Array;
}

export class ColorMap implements IColorMap {

  constructor(public ranges: IColorMapEntry[], public highColor: number) { }

  public static FromTypedArrays(cutOffs: Uint16Array, colorNums: Uint32Array, highColor: number): IColorMap {
    let workRanges: ColorMapEntry[] = new Array<ColorMapEntry>(cutOffs.length);
    let i: number = 0;

    for (; i < cutOffs.length; i++) {
      workRanges[i] = new ColorMapEntry(cutOffs[i], colorNums[i]);
    }

    let result: ColorMap = new ColorMap(workRanges, highColor);

    return result;
  }

  public insertColorMapEntry(entry: IColorMapEntry, index: number) {
    if (index <= 0) {
      this.ranges.unshift(entry);
    }
    else if (index > this.ranges.length - 1) {
      this.ranges.push(entry);
    }
    else {
      this.ranges.splice(index, 0, entry);
    }
  }

  public getColor(countValue: number): number {
    let result: number;
    let index = this.searchInsert(countValue);
    if (index === this.ranges.length) {
      result = this.highColor;
    }
    else {
      result = this.ranges[index].colorNum;
    }
    return result;
  }

  private searchInsert(countVal: number): number {

    let start = 0;
    let end = this.ranges.length - 1;
    let index = Math.floor((end - start) / 2) + start;

    if (countVal > this.ranges[this.ranges.length - 1].cutOff) {
      // The target is beyond the end of this array.
      index = this.ranges.length;
    }
    else {
      // Start in middle, divide and conquer.
      while (start < end) {
        // Get value at current index.
        let value: number = this.ranges[index].cutOff;

        if (value === countVal) {
          // Found our target.
          //result = index;
          break;
        }
        else if (countVal < value) {
          // Target is lower in array, move the index halfway down.
          end = index;
        }
        else {
          // Target is higher in array, move the index halfway up.
          start = index + 1;
        }

        // Get next mid-point.
        index = Math.floor((end - start) / 2) + start;
      }
    }

    return index;
  }

  public getCutOffs(): Uint16Array {
    let result = new Uint16Array(this.ranges.length);
    let i: number = 0;

    for (; i < this.ranges.length; i++) {
      result[i] = this.ranges[i].cutOff;
    }

    return result;
  }

  public getColorNums(): Uint32Array {
    let result = new Uint32Array(this.ranges.length);
    let i: number = 0;

    for (; i < this.ranges.length; i++) {
      result[i] = this.ranges[i].colorNum;
    }

    return result;
  }
}

export class ColorMapUI extends ColorMap {

  public get uIRanges(): ColorMapUIEntry[] {
    return this.ranges as ColorMapUIEntry[];
  }

  constructor(ranges: ColorMapUIEntry[], highColor: number)
  {
    super(ranges, highColor);
  }

  // TODO: Make the ColorMapUI standalone -- and not extend ColorMap.
  // Override the method in ColorMap
  insertColorMapEntry(entry: IColorMapEntry, index: number) {

    throw new RangeError("Not Implemented.");
  }

  public getRegularColorMap(): ColorMap {

    let uiRanges = this.uIRanges;
    let ranges: ColorMapEntry[] = [];

    let ptr: number;

    for (ptr = 0; ptr < uiRanges.length; ptr++) {
      let uiCme = uiRanges[ptr];
      let cme: ColorMapEntry = new ColorMapEntry(uiCme.cutOff, uiCme.colorNum);
      ranges.push(cme);
    }

    let result = new ColorMap(ranges, this.highColor);
    return result;
  }

  public static FromColorMapForExport(cmfe: ColorMapForExport): ColorMapUI {

    let ranges: ColorMapUIEntry[] = [];

    let ptr: number;

    for (ptr = 0; ptr < cmfe.ranges.length; ptr++) {
      let cmeForExport = cmfe.ranges[ptr];
      let cme: ColorMapUIEntry = ColorMapUIEntry.fromOffsetAndCssColor(cmeForExport.cutOff, cmeForExport.cssColor);
      ranges.push(cme);
    }

    let result = new ColorMapUI(ranges, cmfe.highColor);
    return result;
  }
}

export class ColorMapForExport {

  constructor(public ranges: ColorMapEntryForExport[], public highColor: number) { }

  public static FromColorMap(colorMap: IColorMap): ColorMapForExport {

    let ranges: ColorMapEntryForExport[] = [];

    let ptr: number;

    for (ptr = 0; ptr < colorMap.ranges.length; ptr++) {
      let icme: IColorMapEntry = colorMap.ranges[ptr];
      let cme: ColorMapUIEntry = ColorMapUIEntry.fromColorMapEntry(icme);
      let cssColor: string = cme.rgbHex;
      let cmeForExport = new ColorMapEntryForExport(cme.cutOff, cssColor);
      ranges.push(cmeForExport);
    }

    const result = new ColorMapForExport(ranges, colorMap.highColor);
    return result;
  }
}

export class ColorNumbers {

  black: number = 65536 * 65280; // FF00 0000
  white: number; // = -1 + 65536 * 65536; // FFFF FFFF
  red: number;
  green: number;
  blue: number;

  constructor() {
    this.white = ColorNumbers.getColor(255, 255, 255);
    this.red = ColorNumbers.getColor(255, 0, 0);
    this.green = ColorNumbers.getColor(0, 255, 0);
    this.blue = ColorNumbers.getColor(0, 0, 255);
  }

  //data[y * canvasWidth + x] =
  //  (255 << 24) |	// alpha
  //  (value << 16) |	// blue
  //  (value << 8) |	// green
  //  value;		// red

  public static getColor(r: number, g: number, b: number, alpha?:number): number {

    if (r > 255 || r < 0) throw new RangeError('R must be between 0 and 255.');
    if (g > 255 || g < 0) throw new RangeError('G must be between 0 and 255.');
    if (b > 255 || b < 0) throw new RangeError('B must be between 0 and 255.');

    //let result: number;

    //if (alpha !== null) {
    //  if (alpha > 255 || alpha < 0) throw new RangeError('Alpha must be between 0 and 255.');

    //  result = alpha << 24;
    //  result |= b << 16;
    //  result |= g << 8;
    //  result |= r;
    //}
    //else {
    //  result = 255 << 24; // 65536 * 65280; // FF00 0000 - opaque Black
    //  result |= b << 16;
    //  result |= g << 8;
    //  result |= r;
    //}

    if (alpha === null) {
      alpha = 255;
    } else {
      if (alpha > 255 || alpha < 0) throw new RangeError('Alpha must be between 0 and 255.');
    }

    let result: number = alpha << 24;
    result |= b << 16;
    result |= g << 8;
    result |= r;

    return result;
  }

  // Returns array of numbers: r,g,b,a Where r,g and b are 0-255 integers and a is 0-1 float.
  public static getColorComponents(cNum: number): number[] {
    let result: number[] = new Array<number>(4);

    // Mask all but the lower 8 bits.
    result[0] = cNum & 0x000000FF;

    // Shift down by 8 bits and then mask.
    result[1] = cNum >> 8 & 0x000000FF;
    result[2] = cNum >> 16 & 0x000000FF;
    result[3] = 255; //cNum >> 24 & 0x000000FF;

    return result;
  }

  // Returns array of numbers: r,g,b,a Where r,g and b are 0-255 integers and a is 0-1 float.
  public static getColorComponentsFromCssColor(cssColor: string): number[] {
    let result: number[] = new Array<number>(4);

    let bs = cssColor.slice(1, 3);
    let gs = cssColor.slice(3, 5);
    let rs = cssColor.slice(5, 7);

    result[0] = parseInt(bs, 16);
    result[1] = parseInt(gs, 16);
    result[2] = parseInt(rs, 16);
    result[3] = 255; //parseInt(cssColor.slice(7,8), 16);

    return result;
  }

  public static getColorComponentsFromRgba(rgbaColor: string): number[] {
    let result: number[] = new Array<number>(4);

    //let rgbaObject: object = JSON.parse(rgbaColor);

    //return 'rgba(200,20,40,1)';

    let lst = rgbaColor.replace('rgba(', '');
    lst = lst.replace(')', '');

    let comps: string[] = lst.split(',');

    result[0] = parseInt(comps[0], 10);
    result[1] = parseInt(comps[1], 10);
    result[2] = parseInt(comps[2], 10);
    result[3] = 255; //parseInt(comps[3], 10);

    return result;
  }
}

// ---- WebWorker Message Interfaces ----

export interface IWebWorkerMessage {
  messageKind: string;
}

export interface IWebWorkerStartRequest extends IWebWorkerMessage {
  canvasSize: ICanvasSize;
  mapInfo: IMapInfo;
  colorMap: IColorMap;
  sectionAnchor: IPoint;
  sectionNumber: number;

  getMapWorkingData(): IMapWorkingData;
}

export interface IWebWorkerIterateRequest extends IWebWorkerMessage {
  iterateCount: number;
}

export interface IWebWorkerImageDataRequest extends IWebWorkerMessage {
}

export interface IWebWorkerImageDataResponse extends IWebWorkerMessage {
  sectionNumber: number;
  pixelData: Uint8ClampedArray;

  getImageData(cs: ICanvasSize): ImageData;
}

export interface IWebWorkerAliveFlagsRequest extends IWebWorkerMessage {
}

export interface IWebWorkerAliveFlagsResponse extends IWebWorkerMessage {
  sectionNumber: number;
  flagData: Uint8Array;

  getAliveFlags(): boolean[];
}

export interface IWebWorkerIterCountsRequest extends IWebWorkerMessage {
}

export interface IWebWorkerIterCountsResponse extends IWebWorkerMessage {
  sectionNumber: number;
  iterCountsData: Uint16Array;
}

export interface IWebWorkerHistogramRequest extends IWebWorkerMessage {
}

export interface IWebWorkerHistogramResponse extends IWebWorkerMessage {
  sectionNumber: number;
  vals: Uint16Array;
  occurances: Uint16Array;

  getHistorgram(): Histogram;
  getHistArrayPair(): HistArrayPair;
}

export interface IWebWorkerUpdateColorMapRequest extends IWebWorkerMessage {
  cutOffs: Uint16Array;
  colorNums: Uint32Array;
  highColorNum: number;

  getColorMap(): IColorMap;
}

// -- WebWorker Message Implementations

export class WebWorkerMessage implements IWebWorkerMessage {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerMessage {
    return new WebWorkerMessage(data.messageKind || data || 'no data');
  }
}

export class WebWorkerStartRequest implements IWebWorkerStartRequest {

  constructor(
    public messageKind: string,
    public canvasSize: ICanvasSize,
    public mapInfo: IMapInfo,
    public colorMap: IColorMap,
    public sectionAnchor: IPoint,
    public sectionNumber: number
  ) { }

  static FromEventData(data: any): IWebWorkerStartRequest {
    let result = new WebWorkerStartRequest(
      data.messageKind,
      data.canvasSize,
      // Because the MapInfo class has methods, we must build a new instance from the data.
      MapInfo.fromIMapInfo(data.mapInfo),
      // Because the ColorMap class has methods, we must build a new instance from the data.
      new ColorMap(data.colorMap.ranges, data.colorMap.highColor),
      data.sectionAnchor,
      data.sectionNumber
    );
    return result;
  }

  static CreateRequest(mapWorkingData: IMapWorkingData, sectionNumber: number): IWebWorkerStartRequest {
    let result = new WebWorkerStartRequest(
      'Start',
      mapWorkingData.canvasSize,
      mapWorkingData.mapInfo,
      mapWorkingData.colorMap,
      mapWorkingData.sectionAnchor,
      sectionNumber
    );

    return result;
  }

  public getMapWorkingData(): IMapWorkingData {
    let result = new MapWorkingData(this.canvasSize, this.mapInfo, this.colorMap, this.sectionAnchor, true);
    return result;
  }
}

export class WebWorkerIterateRequest implements IWebWorkerIterateRequest {
  constructor(public messageKind: string, public iterateCount: number) { }

  static FromEventData(data: any): IWebWorkerIterateRequest {
    let result = new WebWorkerIterateRequest(data.messageKind,  data.iterateCount);
    return result;
  }

  static CreateRequest(iterateCount: number): IWebWorkerIterateRequest {
    let result = new WebWorkerIterateRequest('Iterate', iterateCount);
    return result;
  }
}

export class WebWorkerImageDataRequest implements IWebWorkerImageDataRequest {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerImageDataRequest {
    let result = new WebWorkerImageDataRequest(data.messageKind);
    return result;
  }

  static CreateRequest(): IWebWorkerImageDataRequest {
    let result = new WebWorkerImageDataRequest('GetImageData');
    return result;
  }
}

export class WebWorkerImageDataResponse implements IWebWorkerImageDataResponse {

  constructor(public messageKind: string, public sectionNumber: number, public pixelData: Uint8ClampedArray) { }

  static FromEventData(data: any): IWebWorkerImageDataResponse {
    let result = new WebWorkerImageDataResponse(data.messageKind, data.sectionNumber, data.pixelData);

    return result;
  }

  static CreateResponse(sectionNumber: number, pixelData: Uint8ClampedArray): IWebWorkerImageDataResponse {
    let result = new WebWorkerImageDataResponse("ImageDataResponse", sectionNumber, pixelData);
    return result;
  }

  public getImageData(cs: ICanvasSize): ImageData {
    let result: ImageData = null;

    //if (this.pixelData) {
      let pixelCount = this.pixelData.length / 4;
      if (pixelCount !== cs.width * cs.height) {
        console.log('The image data being returned is not the correct size for our canvas.');
      }
      result = new ImageData(this.pixelData, cs.width, cs.height);
    //}
    return result;
  }
}

export class WebWorkerAliveFlagsRequest implements IWebWorkerAliveFlagsRequest {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerAliveFlagsRequest {
    let result = new WebWorkerAliveFlagsRequest(data.messageKind);
    return result;
  }

  static CreateRequest(flagData: Uint8Array): IWebWorkerAliveFlagsRequest {
    let result = new WebWorkerAliveFlagsRequest('GetAliveFlags');
    return result;
  }
}

export class WebWorkerAliveFlagsResponse implements IWebWorkerAliveFlagsResponse {  

  constructor(public messageKind: string, public sectionNumber: number, public flagData: Uint8Array) { }

  static FromEventData(data: any): IWebWorkerImageDataResponse {
    let result = new WebWorkerImageDataResponse(data.messageKind, data.sectionNumber, data.flagData);

    return result;
  }

  static CreateResponse(sectionNumber: number, flagData: Uint8Array): IWebWorkerAliveFlagsResponse {
    let result = new WebWorkerAliveFlagsResponse("AliveFlagResults", sectionNumber, flagData);
    return result;
  }

  public getAliveFlags(): boolean[] {
    let result: boolean[] = new Array<boolean>(this.flagData.length);

    let ptr: number = 0;
    for (; ptr < this.flagData.length; ptr++) {
      result[ptr] = this.flagData[ptr] !== 0;
    }

    return result;
  }
}

export class WebWorkerIterCountsRequest implements IWebWorkerIterCountsRequest {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerAliveFlagsRequest {
    let result = new WebWorkerIterCountsRequest(data.messageKind);
    return result;
  }

  static CreateRequest(flagData: Uint8Array): IWebWorkerAliveFlagsRequest {
    let result = new WebWorkerIterCountsRequest('GetIterCounts');
    return result;
  }

}

export class WebWorkerIterCountsResponse implements IWebWorkerIterCountsResponse {
  constructor(public messageKind: string, public sectionNumber: number, public iterCountsData: Uint16Array) { }

  static FromEventData(data: any): IWebWorkerIterCountsResponse {
    let result = new WebWorkerIterCountsResponse(data.messageKind, data.sectionNumber, data.iterCountsData);

    return result;
  }
  
  static CreateResponse(sectionNumber: number, iterCountsData: Uint16Array): IWebWorkerIterCountsResponse {
    let result = new WebWorkerIterCountsResponse("IterCountsResults", sectionNumber, iterCountsData);
    return result;
  }
}

export class WebWorkerHistogramRequest implements IWebWorkerHistogramRequest {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerHistogramRequest {
    let result = new WebWorkerHistogramRequest(data.messageKind);
    return result;
  }

  static CreateRequest(): IWebWorkerHistogramRequest {
    let result = new WebWorkerHistogramRequest('GetHistogram');
    return result;
  }

}

export class WebWorkerHistorgramResponse implements IWebWorkerHistogramResponse {
  constructor(public messageKind: string, public sectionNumber: number, public vals: Uint16Array, public occurances: Uint16Array) { }

  static FromEventData(data: any): IWebWorkerHistogramResponse {
    let result = new WebWorkerHistorgramResponse(data.messageKind, data.sectionNumber, data.vals, data.occurances);

    return result;
  }

  static CreateResponse(sectionNumber: number, histogram: Histogram): IWebWorkerHistogramResponse {
    let arrayPair = histogram.getHistArrayPair();
    let result = new WebWorkerHistorgramResponse("HistogramResults", sectionNumber, arrayPair.vals, arrayPair.occurances);
    return result;
  }

  public getHistorgram(): Histogram {
    let arrayPair = new HistArrayPair(this.vals, this.occurances);
    let result = Histogram.fromHistArrayPair(arrayPair);

    return result;
  }

  public getHistArrayPair(): HistArrayPair {
    let result = new HistArrayPair(this.vals, this.occurances);
    return result;
  }
}

export class WebWorkerUpdateColorMapRequest implements IWebWorkerUpdateColorMapRequest {
  constructor(public messageKind: string, public cutOffs: Uint16Array, public colorNums: Uint32Array, public highColorNum: number) { }

  static FromEventData(data: any): IWebWorkerUpdateColorMapRequest {
    let result = new WebWorkerUpdateColorMapRequest(data.messageKind, data.cutOffs, data.colorNums, data.highColorNum);

    return result;
  }

  static CreateRequest(colorMap: IColorMap): IWebWorkerUpdateColorMapRequest {

    let cutOffs = colorMap.getCutOffs();
    let colorNums = colorMap.getColorNums();

    let result = new WebWorkerUpdateColorMapRequest("UpdateColorMap", cutOffs, colorNums, colorMap.highColor);
    return result;
  }

  public getColorMap(): IColorMap {
    let result: IColorMap = ColorMap.FromTypedArrays(this.cutOffs, this.colorNums, this.highColorNum);
    return result;
  }

}

//// Only used when the javascript produced from compiling this TypeScript is used to create worker.js

//var mapWorkingData: IMapWorkingData = null;
//var sectionNumber: number = 0;

//// Handles messages sent from the window that started this web worker.
//onmessage = function (e) {

//  var pixelData: Uint8ClampedArray;
//  var imageData: ImageData;
//  var imageDataResponse: IWebWorkerImageDataResponse;

//  //console.log('Worker received message: ' + e.data + '.');
//  let plainMsg: IWebWorkerMessage = WebWorkerMessage.FromEventData(e.data);

//  if (plainMsg.messageKind === 'Start') {
//    let startMsg = WebWorkerStartRequest.FromEventData(e.data);

//    mapWorkingData = startMsg.getMapWorkingData();
//    sectionNumber = startMsg.sectionNumber;
//    console.log('Worker created MapWorkingData with element count = ' + mapWorkingData.elementCount);

//    let responseMsg = new WebWorkerMessage('StartResponse');
//    console.log('Posting ' + responseMsg.messageKind + ' back to main script');
//    self.postMessage(responseMsg, "*");
//  }
//  else if (plainMsg.messageKind === 'Iterate') {
//    let iterateRequestMsg = WebWorkerIterateRequest.FromEventData(e.data);
//    let iterCount = iterateRequestMsg.iterateCount;
//    mapWorkingData.doIterationsForAll(iterCount);
//    pixelData = mapWorkingData.getPixelData();

//    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);

//    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
//    self.postMessage(imageDataResponse, "*", [pixelData.buffer]);
//  }
//  else if (plainMsg.messageKind === 'GetImageData') {
//    //mapWorkingData.doIterationsForAll(1);
//    pixelData = mapWorkingData.getPixelData();
//    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);

//    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
//    self.postMessage(imageDataResponse, "*", [pixelData.buffer]);
//  }
//  else if (plainMsg.messageKind === "UpdateColorMap") {
//    let upColorMapReq = WebWorkerUpdateColorMapRequest.FromEventData(e.data);

//    mapWorkingData.colorMap = upColorMapReq.getColorMap();
//    console.log('WebWorker received an UpdateColorMapRequest with ' + mapWorkingData.colorMap.ranges.length + ' entries.');

//    pixelData = mapWorkingData.getPixelData();

//    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);

//    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
//    self.postMessage(imageDataResponse, "*", [pixelData.buffer]);
//  }
//  else if (plainMsg.messageKind === "GetHistogram") {
//    let histogram = mapWorkingData.getHistogram();
//    let histogramResponse = WebWorkerHistorgramResponse.CreateResponse(sectionNumber, histogram);

//    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
//    self.postMessage(histogramResponse, "*", [histogramResponse.vals.buffer, histogramResponse.occurances.buffer]);
//  }
//  else {
//    console.log('Received unknown message kind: ' + plainMsg.messageKind);
//  }


//};




