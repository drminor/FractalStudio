
import { ColorNumbers } from './ColorNumbers';

const MAX_CANVAS_WIDTH: number = 50000;
const MAX_CANVAS_HEIGHT: number = 50000;

export interface IPoint {
  x: number;
  y: number;

  add(amount: number): IPoint;
  mult(amount: number): IPoint;

  scale(factor: IPoint): IPoint;
  translate(factor: IPoint): IPoint;

  isEqual(p: IPoint): boolean;
}

export interface IBox {
  botLeft: IPoint;  
  topRight: IPoint;
  width: number;
  height: number;

  isUpsideDown: boolean;
  isBackwards: boolean;

  absHeight: number;
  absTop: number;
  absWidth: number;
  absLeft: number;

  size: ICanvasSize;
  absSize: ICanvasSize;

  addX(amount: number): IBox;
  addY(amount: number): IBox;

  mult(amount: number): IBox;
  scale(factor: ICanvasSize): IBox;
  translate(factor: IBox): IBox;

  getNormalizedBox(): IBox;
  getShiftedBox(dir: string, percent: number): IBox;
  getExpandedBox(percent: number): IBox;

  isEqual(box: IBox): boolean;
  toString(): string;
}

export interface IMapInfo {
  coords: IBox;
  bottomLeft: IPoint;
  topRight: IPoint;
  maxIterations: number;
  threshold: number;
  iterationsPerStep: number;
  upsideDown: boolean;
  isEqual(other: IMapInfo): boolean;

  toString(): string
}

export interface ICanvasSize {
  width: number;
  height: number;

  //getScaledCanvas(amount: number): ICanvasSize;
  mult(amount: number): ICanvasSize;
  scale(factor: ICanvasSize): ICanvasSize;
}

export interface IMapWorkingData {
  canvasSize: ICanvasSize;
  mapInfo: IMapInfo;
  sectionAnchor: IPoint;

  elementCount: number;

  workingVals: CurWorkVal[];

  //// Current z values
  //wAData: Float64Array; // Stores the current A (or real component.)
  //wBData: Float64Array; // Stores the current B (or complex component.)

  //xVals: number[];
  //yVals: number[];

  //// The number of times each point has been iterated.
  cnts: Uint16Array;

  //// Flag for each point. If set then the point has grown more than 2.
  //flags: Uint8Array;

  curIterations: number;

  colorMap: ColorMap;

  getLinearIndex(c: IPoint): number;
  doIterationsForAll(iterCount: number): boolean;
  //doIterationsForLine(iterCount: number, y: number): boolean;

  getPixelData(): Uint8ClampedArray;
  //getImageDataForLine(y: number): ImageData;

  //updateImageData(imgData: Uint8ClampedArray): void;
  iterationCountForNextStep(): number;
  getHistogram(): Histogram;
}

export class Point implements IPoint {
  constructor(public x: number, public y: number) { }

  public static fromStringVals(strX: string, strY: string): IPoint {
    let xNum = parseFloat(strX);
    let yNum = parseFloat(strY);
    let result: IPoint = new Point(xNum, yNum);
    return result;
  }

  public add(amount: number): IPoint {
    return new Point(this.x + amount, this.y + amount);
  }

  public mult(amount: number): IPoint {
    return new Point(this.x * amount, this.y * amount);

  }

  public scale(factor: IPoint): IPoint {
    return new Point(this.x * factor.x, this.y * factor.y);
  }

  public translate(factor: IPoint): IPoint {
    return new Point(this.x + factor.x, this.y + factor.y);
  }

  public isEqual(p: IPoint): boolean {
    if (p === null) return false;
    if (p.x !== this.x) return false;
    if (p.y !== this.y) return false;

    return true;
  }
}

export class Box implements IBox {
  constructor(public botLeft: IPoint, public topRight: IPoint) { }

  public static fromPointExtent(botLeft: IPoint, width: number, height: number): IBox {
    const result: IBox = new Box(botLeft, new Point(botLeft.x + width, botLeft.y + height));

    return result;
  }

  public get width(): number {
    return this.topRight.x - this.botLeft.x;
  }

  public get height(): number {
    return this.topRight.y - this.botLeft.y;
  }

  public get isUpsideDown(): boolean {
    return this.topRight.y < this.botLeft.y;
  }

  public get isBackwards(): boolean {
    return this.topRight.x < this.botLeft.x;
  }

  public get absHeight(): number {
    if (this.isUpsideDown) {
      return this.botLeft.y - this.topRight.y;
    }
    else {
      return this.height;
    }
  }

  public get absTop(): number {
    if (this.isUpsideDown) {
      return this.botLeft.y;
    }
    else {
      return this.topRight.y;
    }
  }

  public get absWidth(): number {
    if (this.isBackwards) {
      return this.botLeft.x - this.topRight.x;
    }
    else {
      return this.width;
    }
  }

  public get absLeft(): number {
    if (this.isBackwards) {
      return this.botLeft.x;
    }
    else {
      return this.topRight.x;
    }
  }

  public get size(): ICanvasSize {
    return new CanvasSize(this.width, this.height);
  }

  public get absSize(): ICanvasSize {
    return new CanvasSize(this.absWidth, this.absHeight);
  }

  public getShiftedBox(dir: string, percent: number): IBox {
    let result: IBox;
    let delta: number;

    switch (dir) {
      case 'r':
        delta = this.width * percent / 100;
        result = this.addX(delta);
        break;
      case 'l':
        delta = this.width * percent / 100;
        result = this.addX(-1 * delta);
        break;
      case 'u':
        delta = this.height * percent / 100;
        result = this.addY(delta);
        break;
      case 'd':
        delta = this.height * percent / 100;
        result = this.addY(-1 * delta);
        break;
      default:
        console.log('GetShiftedCoords received unrecognized dir ' + dir + '.');
        result = this;
    }
    return result;
  }

  public addX(amount: number): IBox {
    let result = new Box(
      new Point(this.botLeft.x + amount, this.botLeft.y),
      new Point(this.topRight.x + amount, this.topRight.y)
    );
    return result;
  }

  public addY(amount: number): IBox {
    let result = new Box(
      new Point(this.botLeft.x, this.botLeft.y + amount),
      new Point(this.topRight.x, this.topRight.y + amount)
    );
    return result;
  }

  public mult(amount: number): IBox {

    let botLeft = new Point(this.botLeft.x * amount, this.botLeft.y * amount);
    let topRight = new Point(this.topRight.x * amount, this.topRight.y * amount);

    let result = new Box(botLeft, topRight);
    return result;
  }

  public scale(factor: ICanvasSize): IBox {

    console.log('The dif in x vs y factor on getScaledBox is ' + (factor.width - factor.height) + '.');

    let result = new Box(
      new Point(this.botLeft.x * factor.width, this.botLeft.y * factor.height),
      new Point(this.topRight.x * factor.width, this.topRight.y * factor.height)
    );
    return result;
  }

  public translate(factor: IBox): IBox {
    return new Box(this.botLeft.translate(factor.botLeft), this.topRight.translate(factor.topRight));
  }

  public getExpandedBox(percent: number): IBox {

    // 1/2 the amount of change for the width
    let deltaX = this.width * percent / 200;

    // 1/2 the amount of change for the width
    let deltaY = this.height * percent / 200;

    let botLeft = new Point(this.botLeft.x - deltaX, this.botLeft.y - deltaY);
    let topRight = new Point(this.topRight.x + deltaX, this.topRight.y + deltaY);

    let result = new Box(botLeft, topRight);
    return result;
  }

  public isEqual(box: IBox): boolean {

    if (box === null) {
      console.log('Comparing this box to null, returning NOT-EQUAL.');
      return false;
    }
    else
    {
      if (!this.botLeft.isEqual(box.botLeft)) {
        console.log('Comparing two boxes and found that they are NOT-EQUAL.');
        return false;
      }

      if (!this.topRight.isEqual(box.topRight)) {
        console.log('Comparing two boxes and found that they are NOT-EQUAL.');
        return false;
      }
    }

    console.log('Comparing two boxes and found that they are equal.');

    return true;
  }

  // Return a box of the same size and position
  // but make sure that the width and height are both positive.
  public getNormalizedBox(): IBox {

    let box = this;

    let sx: number;
    let sy: number;

    let ex: number;
    let ey: number;

    if (box.botLeft.x < box.topRight.x) {
      if (box.botLeft.y < box.topRight.y) {
        // Already in normal form.
        sx = box.botLeft.x;
        ex = box.topRight.x;
        sy = box.botLeft.y;
        ey = box.topRight.y;
      }
      else {
        // Width is already positive, reverse the y values.
        sx = box.botLeft.x;
        ex = box.topRight.x;
        sy = box.topRight.y;
        ey = box.botLeft.y;
      }
    }
    else {
      if (box.botLeft.y < box.topRight.y) {
        // Height is already positive, reverse the x values.
        sx = box.topRight.x;
        ex = box.botLeft.x;
        sy = box.botLeft.y;
        ey = box.topRight.y;
      } else {
        // Reverse both x and y values.
        sx = box.topRight.x;
        ex = box.botLeft.x;
        sy = box.topRight.y;
        ey = box.botLeft.y;
      }
    }

    let result = new Box(new Point(sx, sy), new Point(ex, ey));
    return result;
  }

  //private round(x: number): number {
  //  const result: number = parseInt((x + 0.5).toString(), 10);

  //  return result;
  //}

  public toString(): string {
    return 'sx:' + this.botLeft.x + ' ex:' + this.topRight.x + ' sy:' + this.botLeft.y + ' ey:' + this.topRight.y + '.';
  }
}

export class CanvasSize implements ICanvasSize {

  constructor(public width: number, public height: number) {
    if (!this.isReasonableExtent(this.width, MAX_CANVAS_WIDTH)) {
      console.log('A CanvasSize is being contructed with an invalid width.');
      alert('Width is invalid');
    }
    if (!this.isReasonableExtent(this.height, MAX_CANVAS_HEIGHT)) {
      console.log('A CanvasSize is being contructed with an invalid height.');
      alert('Height is invalid');
    }
  }

  public getScaledCanvas(amount: number): ICanvasSize {
    let result = new CanvasSize(this.width * amount, this.height * amount);
    return result;
  }

  public mult(amount: number): ICanvasSize {
    let result = new CanvasSize(this.width * amount, this.height * amount);
    return result;
  }

  public scale(factor: ICanvasSize): ICanvasSize {
    let result = new CanvasSize(this.width * factor.width, this.height * factor.height);
    return result;
  }

  isReasonableExtent(nVal:number, max:number): boolean {
    //return isFinite(nVal) && nVal > 0 && nVal <= max && Math.floor(nVal) === nVal;
    return isFinite(nVal) && nVal > 0 && nVal <= max;

  }
}

export class MapInfo implements IMapInfo {
  constructor(public coords: IBox, public maxIterations: number, public threshold: number, public iterationsPerStep: number) {
    if (coords === null) {
      throw new Error('When creating a MapInfo, the coords argument cannot be null.');
    }
  }

  public static fromPoints(bottomLeft: IPoint, topRight: IPoint, maxIterations: number, threshold: number, iterationsPerStep: number): IMapInfo {
    let coords: IBox = new Box(bottomLeft, topRight);
    let result: IMapInfo = new MapInfo(coords, maxIterations, threshold, iterationsPerStep);
    return result;
  }

  public static fromIMapInfo(mi: IMapInfo) {
    let bl = new Point(mi.coords.botLeft.x, mi.coords.botLeft.y);
    let tr = new Point(mi.coords.topRight.x, mi.coords.topRight.y);

    let coords: IBox = new Box(bl, tr);

    let threshold: number;
    if (mi.threshold === undefined) {
      threshold = 4;
    }
    else {
      threshold = mi.threshold;
    }

    let result: IMapInfo = new MapInfo(coords, mi.maxIterations, threshold, mi.iterationsPerStep);
    return result;

  }

  public get bottomLeft(): IPoint {
    return this.coords.botLeft;
  }

  public get topRight(): IPoint {
    return this.coords.topRight;
  }

  public get upsideDown(): boolean {
    return this.coords.isUpsideDown;
  }

  public isEqual(other: IMapInfo): boolean {
    if (other === null) return false;
    if (!this.coords.isEqual(other.coords)) return false;
    if (this.maxIterations !== other.maxIterations) return false;
    if (this.iterationsPerStep !== other.iterationsPerStep) return false;
    if (this.threshold !== other.threshold) return false;

    return true;
  }

  public toString(): string {
    return 'sx:' + this.coords.botLeft.x + ' ex:' + this.coords.topRight.x + ' sy:' + this.coords.botLeft.y + ' ey:' + this.coords.topRight.y + ' mi:' + this.maxIterations + ' ips:' + this.iterationsPerStep + '.';
  }
}

export class Divisions {

  public children: Divisions[];

  //constructor(total: number, startVal: number, startIdx: number, numberOfDivs: number) {
  //  this._numberOfDivs = 1;
  //  this.total = total;
  //  this.startVal = startVal;
  //  this.startIdx = startIdx;
  //  this.numberOfDivs = numberOfDivs;
  //}

  constructor(numberOfDivs: number) {
    this._numberOfDivs = 1;
    this.total = 1;
    this.startVal = 0;
    this.startIdx = 0;
    this.numberOfDivs = numberOfDivs;
  }

  protected static createWithStartVal(total: number, startVal: number, startIdx: number, numberOfDivs: number): Divisions {
    let result = new Divisions(numberOfDivs);
    result.setTotalAndStart(total, startVal, startIdx);

    return result;
  }

  private _total: number;
  public get total(): number {
    return this._total;
  }

  public set total(value: number) {
    this._total = value;
    if (this._numberOfDivs > 1) {
      let workDivs = this.buildDivisions(this._total, this._startVal, this._startIdx, this._numberOfDivs);

      let curStartIdx = this._startIdx + 1;
      let ptr: number;
      for (ptr = 0; ptr < this.children.length; ptr++) {
        curStartIdx = this.children[ptr].setTotalAndStart(workDivs[ptr].total, workDivs[ptr].startVal, curStartIdx);
      }
    }
  }

  private _startVal: number;
  public get startVal(): number {
    return this._startVal;
  }

  public set startVal(value: number) {
    this._startVal = value;
    if (this._numberOfDivs > 1) {
      let workDivs = this.buildDivisions(this._total, this._startVal, this._startIdx, this._numberOfDivs);

      let curStartIdx = this._startIdx + 1;
      let ptr: number;
      for (ptr = 0; ptr < this.children.length; ptr++) {
        curStartIdx = this.children[ptr].setTotalAndStart(workDivs[ptr].total, workDivs[ptr].startVal, curStartIdx);
      }    }
  }

  private _startIdx: number;
  public get startIdx(): number {
    return this._startIdx;
  }

  public set startIdx(value: number) {
    this._startIdx = value;
    if (this._numberOfDivs > 1) {
      let curStartIdx = value + 1;

      let ptr: number;
      for (ptr = 0; ptr < this.children.length; ptr++) {
        curStartIdx = this.children[ptr].setTotalAndStart(this.total, this.startVal, curStartIdx);
      }
    }
  }

  private _numberOfDivs: number;
  public get numberOfDivs(): number {
    return this._numberOfDivs;
  }

  public set numberOfDivs(value: number) {
    if (value < 1 || parseInt(value.toString()) !== value) {
      throw new RangeError('The numberOfDivs must be a whole number greater than 0.');
    }

    this._numberOfDivs = value;

    if (value === 1) {
      this.children = null;
    }
    else {
      this.children = this.buildDivisions(this.total, this.startVal, this._startIdx, value);
    }
  }

  public setTotalAndStart(total: number, startVal: number, startIdx: number): number {
    this._total = total;
    this._startVal = startVal;
    this._startIdx = startIdx;

    let curStartIdx = startIdx + 1;
    if (this._numberOfDivs > 1) {
      let workDivs = this.buildDivisions(this._total, this._startVal, this._startIdx, this._numberOfDivs);

      let ptr: number;
      for (ptr = 0; ptr < this.children.length; ptr++) {
        curStartIdx = this.children[ptr].setTotalAndStart(workDivs[ptr].total, workDivs[ptr].startVal, curStartIdx);
      }
    }

    return curStartIdx;

  }

  public insertChild(newChild: Divisions, index: number): void {
    if (index < 0 || index > this._numberOfDivs) {
      throw new RangeError('The index is out of bounds.');
    }

    this._numberOfDivs++;
    let workDivs = this.buildDivisions(this._total, this._startVal, this._startIdx, this._numberOfDivs);

    if (this._numberOfDivs === 2) {
      this.children = new Array<Divisions>(2);
      if (index === 0) {
        newChild.setTotalAndStart(this._total, this._startVal, this._startIdx + 1);
        this.children.push(newChild);
        this.children.push(workDivs[1]);
      }
      else {
        newChild.setTotalAndStart(this._total, this._startVal, this._startIdx + 2);
        this.children.push(workDivs[0]);
        this.children.push(newChild);
      }
    }
    else {
      this.children.splice(index, 0, newChild);

      let curStartIdx = this._startIdx + 1;
      let ptr: number;
      for (ptr = 0; ptr < this.children.length; ptr++) {
        curStartIdx = this.children[ptr].setTotalAndStart(workDivs[ptr].total, workDivs[ptr].startVal, curStartIdx);
      }
    }
  }

  public deleteChild(index: number): void {
    if (index < 0 || index > this._numberOfDivs) {
      throw new RangeError('The index is out of bounds.');
    }

    this._numberOfDivs--;
    let workDivs = this.buildDivisions(this._total, this._startVal, this._startIdx, this._numberOfDivs);

    this.children.splice(index, 1);

    let curStartIdx = this._startIdx + 1;
    let ptr: number;
    for (ptr = 0; ptr < this.children.length; ptr++) {
      curStartIdx = this.children[ptr].setTotalAndStart(workDivs[ptr].total, workDivs[ptr].startVal, curStartIdx);
    }

  }

  private buildDivisions(total: number, startVal: number, startIdx: number, divs: number): Divisions[] {
    let result = new Array<Divisions>(divs);
    let unit = total / divs;
    let curStartVal = startVal;
    let firstChildStartIdx = startIdx + 1;

    let ptr: number;
    for (ptr = 0; ptr < divs; ptr++) {
      result[ptr] = new Divisions(1);
      result[ptr].setTotalAndStart(unit, curStartVal, firstChildStartIdx++);
      curStartVal += unit;
    }

    return result;
  }

  public getStartingValsAsPercentages(): string[] {
    let result: string[] = [];
    let startingVals = this.getStartingVals();

    let ptr: number;
    for (ptr = 0; ptr < startingVals.length; ptr++) {
      result.push(Divisions.formatAsPercentage(startingVals[ptr]));
    }
    return result;
  }

  // Running percentages
  // Returns a list of numeric values, each value is between 0 and 1.
  public getStartingVals(): number[] {
    let curResult: number[] = [];
    let result = this.getStartingValsInternal(curResult);
    return result;
  }

  private getStartingValsInternal(curResult: number[]): number[] {
    if (this._numberOfDivs === 1) {
      curResult.push(this.startVal);
    }
    else {
      let ptr: number;
      for (ptr = 0; ptr < this.children.length; ptr++) {
        curResult = this.children[ptr].getStartingValsInternal(curResult);
      }
    }
    return curResult;
  }

  // Individual percentage values
  // Returns a list of numeric values, each value is between 0 and 1.
  public getVals(): number[] {
    let curResult: number[] = [];
    let result = this.getValsInternal(curResult);
    return result;
  }

  private getValsInternal(curResult: number[]): number[] {
    if (this._numberOfDivs === 1) {
      curResult.push(this.total);
    }
    else {
      let ptr: number;
      for (ptr = 0; ptr < this.children.length; ptr++) {
        curResult = this.children[ptr].getValsInternal(curResult);
      }
    }
    return curResult;
  }

  public toString(): string {
    return this.toStringInternal('');
  }

  private toStringInternal(curResult: string): string {
    let result = curResult;

    if (this._numberOfDivs === 1) {
      if (result !== '') {
        result += ', ';
      }
      result = '\n(entry:' + this.startIdx + '-' + this.startVal + ':' + this.total + ')';
    }
    else {
      result = '';
      let ptr: number;
      for (ptr = 0; ptr < this.children.length; ptr++) {
        if (result !== '') {
          result += ', ';
        }
        result += this.children[ptr].toStringInternal(result);
      }
      result = '\n(entry:' + this.startIdx + '-' + this.startVal + ':' + this.total + ')' + '[' + result + ']';
    }

    return result;
  }

  public static X100With3DecPlaces (val: number): number {
    if (val === 0) {
      return 0;
    }
    else {
      let percentX1000: number = parseInt((100000 * val + 0.5).toString(), 10);
      let p = percentX1000 / 1000;

      //let s = percentX1000.toString();
      //let res = s.slice(0, s.length - 3) + '.' + s.slice(s.length - 3);
      //if (percentX1000 < 100) {
      //  res = '0' + res;
      //}
      //return parseFloat(res);
      return p;
    }
  }

  public staticFormatX100AsPercentage(val: number): string {
    let result = val.toString() + '%';
    return result;
  }

  public static formatAsPercentage(val: number): string {
    if (val === 0) {
      return '0.0%';
    }
    else {
      let percentX1000: number = parseInt((100000 * val + 0.5).toString(), 10);
      let p = percentX1000 / 1000;
      //let s = percentX1000.toString();
      //let res = s.slice(0, s.length - 3) + '.' + s.slice(s.length - 3) + '%';
      //if (percentX1000 < 1000) {
      //  res = '0' + res;
      //}
      let res = p.toString() + '%';
      return res;
    }
  }

}


class IndexAndRunningSum {
  constructor(public idx: number, public runningSum: number) { }
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

  private _maxVal: number = -1;

  public get maxVal(): number {
    if (this._maxVal === -1) {
      // The getHistEntries method also sets the value of _maxVal.
      this.getHistEntries();
    }

    return this._maxVal;
  }

  constructor() {
    this.entriesMap = new Map<number, number>();
  }

  /// ---  By Division ----

  public getEqualGroupsForAll(numberOfGroups: number): number[] {
    let result = this.getEqualGroupsForSubset(numberOfGroups, 0, -1);

    return result;
  }

  public getEqualGroupsForSubset(numberOfGroups: number, startCutOff: number, endCutOff: number): number[] {
    console.log('GetEqualGroupsForSubset is being called with cnt:' + numberOfGroups + ' sc:' + startCutOff + ' ec:' + endCutOff + '.');

    let hes = this.getHistEntries();

    // Get index of starting cutoff;
    let startIdx = this.getIndexFromVal(hes, startCutOff, 0);

    // Get index of ending cutoff;
    let maxIdx = this.getIndexOfMaxIter(hes, 5);
    maxIdx-- // Don't include the entry at the end that corresponds to the maxIterations.

    let endIdx: number;

    if (endCutOff === -1) {
      endIdx = maxIdx;
    }
    else {
      endIdx = this.getIndexFromVal(hes, endCutOff, startIdx);
      if (endIdx > maxIdx) endIdx = maxIdx;
    }

    let cnt = 1 + endIdx - startIdx;
    let result = this.getEqualGroupsForSubset_Int(hes, numberOfGroups, startIdx, cnt);
    return result;
  }

  public getEqualGroupsForSubset_Int(hes: HistEntry[], numberOfGroups: number, startIdx: number, cnt: number): number[] {
    console.log('GetEqualGroupsForSubset_Int is being called with cnt:' + numberOfGroups + ' si:' + startIdx + ' cnt:' + cnt + '.');

    let numOfResultsRemaining = numberOfGroups; // - 2;
    let result = Array<number>(numOfResultsRemaining);

    let resultPtr = 0;
    let resultEndPtr = numberOfGroups - 1; // - 3;

    while (cnt > 0 && numOfResultsRemaining > 0) {
      let sum = this.getSumHits(hes, startIdx, cnt);
      let target = parseInt((0.5 + sum / numberOfGroups).toString(), 10);

      if (hes[startIdx].occurances >= target) {
        result[resultPtr++] = hes[startIdx].val;
        startIdx++;
        cnt--;
      }
      else if (hes[startIdx + cnt - 1].occurances >= target) {
        result[resultEndPtr--] = hes[startIdx + cnt - 1].val;
        cnt--;
      }
      else {
        let bp = this.getForwardBreakPoint(hes, startIdx, cnt, target);
        result[resultPtr++] = hes[bp].val;
        let newStart = bp + 1;
        let ac = newStart - startIdx;
        startIdx = newStart;
        cnt -= ac;
      }

      numOfResultsRemaining--;
      numberOfGroups--;
    }

    return result;
  }

  // Returns the index into hes where the runnng sum is >= target.
  getForwardBreakPoint(hes: HistEntry[], startIdx: number, cnt: number, target: number): number {
    let runSum: number = 0;

    let ptr: number;
    for (ptr = startIdx; ptr < startIdx + cnt; ptr++) {
      runSum += hes[ptr].occurances;
      if (runSum >= target) {
        // We have found the breakpoint at ptr.
        return ptr;
      }
    }

    // The breakpoint is the last index into hes.
    let result = startIdx + cnt - 1;
    return result;
  }

  private getIndexFromVal(hes: HistEntry[], val: number, startIdx: number): number {

    let found = false;
    let result: number;

    let ptr: number;
    for (ptr = startIdx; ptr < hes.length; ptr++) {
      if (hes[ptr].val === val) {
        result = ptr;
        found = true;
        break;
      }
      if (hes[ptr].val > val) {
        result = ptr - 1;
        if (result < 0) result = 0;
        found = true;
        break;
      }
    }

    if (!found) {
      result = hes.length - 1;
    }

    return result;
  }

  getSumHits(hes: HistEntry[], startIdx: number, cnt: number): number {
    let result: number = 0;

    let ptr: number;
    for (ptr = startIdx; ptr < startIdx + cnt; ptr++) {
      result += hes[ptr].occurances;
    }

    return result;
  }

  getAverageOcc(hes: HistEntry[], startIdx: number, cnt: number): number {
    let total = this.getSumHits(hes, startIdx, cnt);
    let avg = total / cnt;

    return avg;
  }

  //private getFirstLargerThan(hes: HistEntry[], cutOff: number): number {
  //  let ptr: number;
  //  for (ptr = 0; ptr < hes.length; ptr++) {
  //    if (hes[ptr].val > cutOff) {
  //      break;
  //    }
  //  }
  //  return ptr;
  //}

  private getIndexOfMaxIter(hes: HistEntry[], numberOfEntriesToCheck: number): number {

    let result = 0;
    let curMaxVal: number = -1;

    let ptr: number;
    let start = hes.length - 1;
    let end = start - numberOfEntriesToCheck;
    if (end < 0) end = 0;

    for (ptr = start; ptr >= end; ptr--) {
      if (hes[ptr].occurances > curMaxVal) {
        curMaxVal = hes[ptr].occurances;
        result = ptr;
      }
    }

    if (result !== start) {
      // Perhaps there is no large entry at the end for the maxInterations
      // If the maximum value found is less than 5 times the average occurances
      // then just use the last entry.
      let avg = this.getAverageOcc(hes, 0, hes.length);

      if (curMaxVal < avg * 5) {
        result = start;
      }
      else {
        // We did find a large entry near the end, but it was not at the very end.
        let cnt = end - start;
        console.log('The maximum value of the last ' + cnt + ' histogram entries is not the last entry.');
      }
    }

    return result;
  }

  /// --- End By Division ---

  /// --- By Percentages ---

  public getCutoffs(percentages: number[]): number[] {
    let result = new Array<number>(percentages.length);

    let hes = this.getHistEntries();

    // Get Total hits excluding the hits from those points that reached the maxium iteration count.
    let maxIterIndex = this.getIndexOfMaxIter(hes, 5);
    let total = this.getSumHits(hes, 0, maxIterIndex);

    let runningPercent = 0;

    let idxAndSum = new IndexAndRunningSum(0, 0);

    let ptr: number;
    for (ptr = 0; ptr < percentages.length; ptr++) {
      runningPercent += percentages[ptr]; // / 100;
      let target = runningPercent * total;
      idxAndSum = this.getCutOff(target, hes, idxAndSum);
      if (idxAndSum.idx < hes.length) {
        result[ptr] = hes[idxAndSum.idx].val;
      }
      else {
        // Use the value of the last entry and exit.
        result[ptr] = hes[hes.length - 1].val;
        break;
      }
    }

    return result;
  }

  public getCutOff(targetVal: number, hes: HistEntry[], startIdxAndSum: IndexAndRunningSum): IndexAndRunningSum {

    let ptr = startIdxAndSum.idx;
    let rs = startIdxAndSum.runningSum;

    //if (targetVal > rs) {
    //  throw new RangeError('targetVal > running sum on call to getCutOff.');
    //}

    let haveAdvanced = false;
    while (ptr < hes.length) {
      let newRs = rs + hes[ptr].occurances;

      if (newRs > targetVal) {
        if (haveAdvanced) {
          let diffPrev = targetVal - rs;
          let diffNext = newRs - targetVal;

          if (diffNext <= diffPrev) {
            rs = newRs;
            ptr++;
          }
        }
        else {
          // Must use the next value because we have not yet advanced any -- which means the current value has already been used.
          rs = newRs;
          ptr++;
        }
        break;
      }
      else {
        rs = newRs;
        ptr++;
        haveAdvanced = true;
      }
    }

    let result = new IndexAndRunningSum(ptr, rs);
    return result;
  }

  /// --- End Target Percentage ---

  public getHistEntries(): HistEntry[] {
    let result: HistEntry[] = new Array<HistEntry>(this.entriesMap.size);

    let vals = Array.from(this.entriesMap.keys());
    let occs = Array.from(this.entriesMap.values());

    let ptr: number;
    for (ptr = 0; ptr < this.entriesMap.size; ptr++) {
      result[ptr] = new HistEntry(vals[ptr], occs[ptr]);
    }

    result.sort((a, b) => a.val - b.val);

    // Set our maxVal, while since we have gone to the trouble of getting sorting our map.
    this._maxVal = result[result.length - 1].val;
    return result;
  }

  public getHistArrayPair(): HistArrayPair {
    let vals = new Uint16Array(Array.from(this.entriesMap.keys()));
    let occs = new Uint16Array(Array.from(this.entriesMap.values()));

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
    if (vals === undefined || vals.length === 0) return;

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

  public getGroupCnts(breakPoints: number[]): number[] {
    let result = new Array<number>(breakPoints.length);

    let hes = this.getHistEntries();
    let lastIdx = 0;

    let ptr: number;
    for (ptr = 0; ptr < breakPoints.length; ptr++) {

      let accum = 0;

      let thisBp = breakPoints[ptr];
      let p2: number;
      for (p2 = lastIdx; p2 < hes.length; p2++) {
        if (hes[p2].val <= thisBp) {
          accum += hes[p2].occurances;
        }
        else {
          break;
        }
      }

      result[ptr] = accum;
      lastIdx = p2;
    }

    // Add up all occurances after the last break point.
    let accum2 = 0;
    let p3: number;
    for (p3 = lastIdx; p3 < hes.length; p3++) {
      accum2 += hes[p3].occurances;
    }

    result.push(accum2);

    return result;
  }

  public getGroupPercentages(groupCounts: number[]): number[] {
    let result = new Array<number>(groupCounts.length);

    let hes = this.getHistEntries();
    let maxIterIndex = this.getIndexOfMaxIter(hes, 5);
    let total = this.getSumHits(hes, 0, maxIterIndex);

    let ptr: number;
    for (ptr = 0; ptr < groupCounts.length; ptr++) {
      result[ptr] = groupCounts[ptr] / total;
    }

    return result;
  }

  public toString(): string {

    let result: string = '';
    let hEntries = this.getHistEntries();

    let ptr: number;

    for (ptr = 0; ptr < hEntries.length; ptr++) {
      let he = hEntries[ptr];
      result = result + he.toString() + '\n';
    }

    return result;
  }

  public static getBreakPointsDisplay(bps: number[]): string {
    let result: string = '';

    let startRange = 0;

    let ptr: number;
    for (ptr = 0; ptr < bps.length; ptr++) {
      let endRange = bps[ptr];
      result += 'Range ' + ptr + ': ' + startRange + '-' + endRange + '\n';
      startRange = endRange;
    }

    return result;
  }
}

export class MapInfoWithColorMap {
  constructor(public mapInfo: IMapInfo, public colorMapUi: ColorMapUI) { }

  public static fromForExport(miwcmfe: MapInfoWithColorMapForExport, serialNumber: number): MapInfoWithColorMap {

    if (typeof miwcmfe.version === 'undefined') {
      miwcmfe.version = 1.0;
    }
    //console.log('Loaded the MapInfoWithColorMapForExport and it has version = ' + miwcmfe.version + '.');

    // Create a new MapInfo from the loaded data.
    let mapInfo = MapInfo.fromIMapInfo(miwcmfe.mapInfo);

    // Create a new ColorMapUI from the loaded data.
    let colorMap = ColorMapUI.fromColorMapForExport(miwcmfe.colorMap, serialNumber);

    let result = new MapInfoWithColorMap(mapInfo, colorMap);
    return result;
  }
}

export class MapInfoWithColorMapForExport {
  public version: number = 1.0;

  constructor(public mapInfo: IMapInfo, public colorMap: ColorMapForExport) { }
}

export class CurWorkVal {
  public z: IPoint;
  public cnt: number;
  public escapeVel: number;
  public done: boolean;

  constructor() {
    this.z = new Point(0, 0);
    this.cnt = 0;
    this.escapeVel = 0;
    this.done = false;
  }
}

export class MapWorkingData implements IMapWorkingData {

  public elementCount: number;
  public workingVals: CurWorkVal[];

  // The number of times each point has been iterated.
  public get cnts(): Uint16Array {
    let result = new Uint16Array(this.elementCount);

    let ptr: number;
    for (ptr = 0; ptr < this.elementCount; ptr++) {
      result[ptr] = this.workingVals[ptr].cnt;
    }

    return result;
  }

  public xVals: number[];
  public yVals: number[];

  public curIterations: number;

  private log2: number;

  constructor(public canvasSize: ICanvasSize, public mapInfo: IMapInfo, public colorMap: ColorMap, public sectionAnchor: IPoint) {

    this.elementCount = this.getNumberOfElementsForCanvas(this.canvasSize);
    this.workingVals = this.buildWorkingVals(this.elementCount);

    // X coordinates get larger as one moves from the left of the map to  the right.
    this.xVals = MapWorkingData.buildVals(this.canvasSize.width, this.mapInfo.bottomLeft.x, this.mapInfo.topRight.x);

    // Y coordinates get larger as one moves from the bottom of the map to the top.
    // But ImageData "blocks" are drawn from top to bottom.

    if (mapInfo.upsideDown) {
      // The y coordinates are already reversed, just use buildVals
      this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
    }
    else {
      // if we only have a single section, then we must reverse the y values.
      // The y coordinates are not reversed, reverse them here.
      this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.topRight.y, this.mapInfo.bottomLeft.y);
    }

    this.curIterations = 0;
    this.log2 = Math.log(2) as number;

    console.log('Constructing MapWorkingData, ColorMap = ' + this.colorMap + '.');
  }

  private buildWorkingVals(elementCount: number): CurWorkVal[] {
    let result = new Array<CurWorkVal>(elementCount);

    let ptr: number;
    for (ptr = 0; ptr < this.elementCount; ptr++) {
      result[ptr] = new CurWorkVal();
    }

    return result;
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

  // Returns the index to use when accessing wAData, wBData, cnts or flags.
  public getLinearIndex(c: IPoint): number {
    return c.x + c.y * this.canvasSize.width;
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

    let wv = this.workingVals[ptr];

    if (wv.done) {
      // This point has been flagged, don't iterate.
      return true;
    }

    let z: IPoint = wv.z;
    const c: IPoint = new Point(this.xVals[mapCoordinate.x], this.yVals[mapCoordinate.y]);

    let cntr: number;

    let zxSquared = z.x * z.x;
    let zySquared = z.y * z.y;

    for (cntr = 0; cntr < iterCount; cntr++) {

      z.y = 2 * z.x * z.y + c.y;
      z.x = zxSquared - zySquared + c.x;

      zxSquared = z.x * z.x;
      zySquared = z.y * z.y;

      if ( zxSquared + zySquared > this.mapInfo.threshold) {
        // This point is done.

        // One more interation
        z.y = 2 * z.x * z.y + c.y;
        z.x = zxSquared - zySquared + c.x;
        zxSquared = z.x * z.x;
        zySquared = z.y * z.y;

        // Ok, two more interations
        z.y = 2 * z.x * z.y + c.y;
        z.x = zxSquared - zySquared + c.x;
        zxSquared = z.x * z.x;
        zySquared = z.y * z.y;

        let modulus: number = Math.log(zxSquared + zySquared) / 2;
        let nu: number = Math.log(modulus / this.log2) / this.log2;
        //let nu: number = Math.log(modulus) / this.log2;

        wv.escapeVel = nu / 2;
        //wv.escapeVel = nu;

        wv.done = true;
        break;
      }
    }

    // Store the new value back to our Working Data.
    wv.z.x = z.x;
    wv.z.y = z.y;

    // Increment the number of times this point has been iterated.
    wv.cnt += cntr;

    this

    return wv.done;
  }

  // Updates each element by performing a single interation.
  // Returns true if at least one point is not done.
  public doIterationsForAll(iterCount: number): boolean {

    // The processed values will be old after this completes.
    //this.isProcessed = false;

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

  public getPixelData(): Uint8ClampedArray {
    let imgData = new Uint8ClampedArray(this.elementCount * 4);

    // Address the image data buffer as Int32's
    let pixelData = new Uint32Array(imgData.buffer);

    let ptr: number;
    for (ptr = 0; ptr < this.elementCount; ptr++) {
      let wv = this.workingVals[ptr];

      let cNum = this.colorMap.getColor(wv.cnt, wv.escapeVel);
      pixelData[ptr] = cNum;
    }

    return imgData;
  }

  // Divides the specified MapWorking data into the specified vertical sections, each having the width of the original Map.
  static getWorkingDataSections(canvasSize: ICanvasSize, mapInfo: IMapInfo, colorMap: ColorMap, numberOfSections: number): IMapWorkingData[] {

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

    if (mapInfo.upsideDown) {
      // The y coordinates are already reversed, just use buildVals
      yVals = MapWorkingData.buildVals(canvasSize.height, mapInfo.bottomLeft.y, mapInfo.topRight.y);
    }
    else {
      // The y coordinates are not reversed, reverse them here.
      yVals = MapWorkingData.buildVals(canvasSize.height, mapInfo.topRight.y, mapInfo.bottomLeft.y);
    }

    let ptr: number = 0;

    // Build all but the last section.
    for (; ptr < numberOfSections - 1; ptr++) {

      let secCanvasSize = new CanvasSize(canvasSize.width, sectionHeightWN);

      let secBottom = yVals[bottomPtr];
      let secTop = yVals[topPtr];

      let secBotLeft = new Point(left, secBottom);
      let secTopRight = new Point(right, secTop);

      let coords: IBox = new Box(secBotLeft, secTopRight);
      let secMapInfo = new MapInfo(coords, mapInfo.maxIterations, mapInfo.threshold, mapInfo.iterationsPerStep);

      let yOffset = ptr * sectionHeightWN;
      let secAnchor: IPoint = new Point(0, yOffset);
      result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, colorMap, secAnchor);

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
    let secMapInfo = new MapInfo(coords, mapInfo.maxIterations, mapInfo.threshold, mapInfo.iterationsPerStep);

    let yOffset = ptr * sectionHeightWN;
    let secAnchor: IPoint = new Point(0, yOffset);

    result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, colorMap, secAnchor);

    return result;
  }
 
  public iterationCountForNextStep(): number {
    let result: number;
    let gap = this.mapInfo.maxIterations - this.curIterations;

    if (gap > this.mapInfo.iterationsPerStep) {
      result = this.mapInfo.iterationsPerStep;
    }
    else {
      result = gap;
    }

    return result;
  }

  public getHistogram(): Histogram {
    let result = new Histogram();
    result.addVals(this.cnts);
    return result;
  }

} // End Class MapWorkingData

export enum ColorMapEntryBlendStyle {
  none,
  next,
  endColor
}

export class ColorMapEntry {

  public prevCutOff: number;
  public bucketWidth: number;

  constructor(public cutOff: number, public colorNum: number, public blendStyle: ColorMapEntryBlendStyle, public endColorNum) {
  }
}

export class ColorMapEntryForExport {
  constructor(public cutOff: number, public cssColor: string) { }

  public static fromColorMapUIEntry(cme: ColorMapUIEntry): ColorMapEntryForExport {
    let result = new ColorMapEntryForExport(cme.cutOff, cme.startColor.rgbHex);
    return result;
  }
}

export class ColorMapUIColor {
  public colorComponents: number[];

  constructor(colorVals: number[]) {

    this.colorComponents = new Array<number>(4);
    let alpha: number;

    if (colorVals === null) {
      colorVals = [0, 0, 0];
      alpha = 255;
    }
    else if (colorVals.length === 3) {
      alpha = 255;
    }
    else if (colorVals.length === 4) {
      alpha = colorVals[3];
    }
    else {
      throw new RangeError('colorVals must have exactly 3 or 4 elements.');
    }

    this.colorComponents[0] = colorVals[0];
    this.colorComponents[1] = colorVals[1];
    this.colorComponents[2] = colorVals[2];
    this.colorComponents[3] = alpha;
  }

  public get r(): number {
  return this.colorComponents[0];
}

  public get g(): number {
  return this.colorComponents[1];
}

  public get b(): number {
  return this.colorComponents[2];
}

  public get alpha(): number {
  return this.colorComponents[3];
}

  public get rgbHex(): string {
  let result = ColorNumbers.getRgbHex(this.colorComponents);
  return result;
}

  public get rgbaString(): string {
  let result = ColorNumbers.getRgbaString(this.colorComponents);
  return result;
}


  public static fromColorNum(cNum: number): ColorMapUIColor {
  let colorComps: number[] = ColorNumbers.getColorComponents(cNum);
    let result = new ColorMapUIColor(colorComps);
  return result;
  }

  public static fromCssColor(cssColor: string): ColorMapUIColor {
  let colorComps: number[] = ColorNumbers.getColorComponentsFromCssColor(cssColor);
    let result = new ColorMapUIColor(colorComps);
  return result;
  }

  public static fromRgba(rgbaColor: string): ColorMapUIColor {
  let colorComps: number[] = ColorNumbers.getColorComponentsFromRgba(rgbaColor);
    let result = new ColorMapUIColor(colorComps);
  return result;
  }
}

export class ColorMapUIEntry {

  public startColor: ColorMapUIColor;
  public endColor: ColorMapUIColor;

  constructor(public cutOff: number, colorVals: number[], public blendStyle: ColorMapEntryBlendStyle, endColorVals: number[]) {

    this.startColor = new ColorMapUIColor(colorVals);
    this.endColor = new ColorMapUIColor(endColorVals);
  }

  public static fromColorMapEntry(cme: ColorMapEntry): ColorMapUIEntry {
    let result = ColorMapUIEntry.fromOffsetAndColorNum(cme.cutOff, cme.colorNum, cme.blendStyle, cme.endColorNum);
    return result;
  }

  public static fromOffsetAndColorNum(cutOff: number, startCNum: number, blendStyle: ColorMapEntryBlendStyle, endCNum: number): ColorMapUIEntry {
    let startColorComps: number[] = ColorNumbers.getColorComponents(startCNum);
    let endColorComps: number[] = ColorNumbers.getColorComponents(endCNum);

    let result = new ColorMapUIEntry(cutOff, startColorComps, blendStyle, endColorComps);
    return result;
  }

  public static fromOffsetAndCssColor(cutOff: number, startCssColor: string, blendStyle: ColorMapEntryBlendStyle, endCssColor: string): ColorMapUIEntry {
    let startColorComps: number[] = ColorNumbers.getColorComponentsFromCssColor(startCssColor);
    let endColorComps: number[] = ColorNumbers.getColorComponentsFromCssColor(endCssColor);

    let result = new ColorMapUIEntry(cutOff, startColorComps, blendStyle, endColorComps);
    return result;
  }

  public static fromOffsetAndRgba(cutOff: number, startRgbaColor: string, blendStyle: ColorMapEntryBlendStyle, endRgbaColor: string): ColorMapUIEntry {
    let startColorComps: number[] = ColorNumbers.getColorComponentsFromRgba(startRgbaColor);
    let endColorComps: number[] = ColorNumbers.getColorComponentsFromRgba(endRgbaColor);

    let result = new ColorMapUIEntry(cutOff, startColorComps, blendStyle, endColorComps);
    return result;
  }
}

export class ColorMap {

  constructor(public ranges: ColorMapEntry[], public highColor: number) {
    if (ranges === null || ranges.length === 0) {
      throw new Error('When creating a ColorMap, the ranges argument must have at least one entry.');
    }

    // Update the prevCutOff and bucketWidth values for each of our ColorMapEntries.
    this.setBucketWidths();
  }

  public static FromTypedArrays(cutOffs: Uint16Array, colorNums: Uint32Array, highColor: number): ColorMap {
    let workRanges: ColorMapEntry[] = new Array<ColorMapEntry>(cutOffs.length);
    let i: number = 0;

    for (; i < cutOffs.length; i++) {
      workRanges[i] = new ColorMapEntry(cutOffs[i], colorNums[i], ColorMapEntryBlendStyle.none, null);
    }

    let result: ColorMap = new ColorMap(workRanges, highColor);

    return result;
  }

  public getColor(countValue: number, escapeVel: number): number {
    let result: number;
    let index = this.searchInsert(countValue);

    if (index === 0) {
      result = this.ranges[index].colorNum;
      return result;
    }

    if (index === this.ranges.length) {
      result = this.highColor;
      return result;
    }

    let cme = this.ranges[index];
    let cNum1 = cme.colorNum;

    //if (index % 2 === 0) {
    //  result = cme.colorNum;
    //  return result;
    //}

    if (cme.blendStyle === ColorMapEntryBlendStyle.none) {
      result = cme.colorNum;
      return result;
    }

    let cNum2: number;

    if (cme.blendStyle === ColorMapEntryBlendStyle.next) {
      if (index + 1 === this.ranges.length) {
        cNum2 = this.highColor;
      }
      else {
        cNum2 = this.ranges[index + 1].colorNum;
      }
    }
    else {
      cNum2 = cme.endColorNum;
    }

    result = this.blend(cme.prevCutOff, cme.bucketWidth, countValue, cNum1, cNum2, escapeVel);

    return result;
  }

  private blend(botBucketVal: number, bucketWidth: number, countValue: number, cNum1: number, cNum2: number, escapeVel: number): number {

    let c1 = ColorNumbers.getColorComponents(cNum1);
    let c2 = ColorNumbers.getColorComponents(cNum2);

    let cStart: number[];
    if (countValue === botBucketVal) {
      // We're starting at the very bottom.
      //cStart = new Array<number>(...c1);
      cStart = c1;
    }
    else {
      let stepFactor = (-1 + countValue - botBucketVal) / bucketWidth;
      cStart = this.simpleBlend(c1, c2, stepFactor);
    }

    let intraStepFactor = escapeVel / (2 * bucketWidth);

    let r = cStart[0] + (c2[0] - c1[0]) * intraStepFactor;
    let g = cStart[1] + (c2[1] - c1[1]) * intraStepFactor;
    let b = cStart[2] + (c2[2] - c1[2]) * intraStepFactor;

    if (r < 0 || r > 255) {
      console.log('Bad red value.');
    }

    if (g < 0 || g > 255) {
      console.log('Bad green value.');
    }

    if (b < 0 || b > 255) {
      console.log('Bad blue value.');
    }

    let newCNum = ColorNumbers.getColor(r, g, b, 255);

    return newCNum;
  }

  private simpleBlend(c1: number[], c2: number[], factor: number): number[] {

    let r = c1[0] + (c2[0] - c1[0]) * factor;
    let g = c1[1] + (c2[1] - c1[1]) * factor;
    let b = c1[2] + (c2[2] - c1[2]) * factor;

    if (r < 0 || r > 255) {
      console.log('Bad red value.');
    }

    if (g < 0 || g > 255) {
      console.log('Bad green value.');
    }

    if (b < 0 || b > 255) {
      console.log('Bad blue value.');
    }

    let result = [r, g, b, 255];

    return result;
  }

  // Returns the index of the range entry that either
  // 1. matches the given countVal
  // or
  // 2. contains the first entry with a cutOff value greater than the given countVal.
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

  private setBucketWidths(): void {
    let ptr: number;

    this.ranges[0].bucketWidth = this.ranges[0].cutOff;
    this.ranges[0].prevCutOff = 0;

    let prevCutOff = this.ranges[0].cutOff;

    for (ptr = 1; ptr < this.ranges.length; ptr++) {
      this.ranges[ptr].prevCutOff = prevCutOff;
      this.ranges[ptr].bucketWidth = this.ranges[ptr].cutOff - prevCutOff;

      prevCutOff = this.ranges[ptr].cutOff;
    }

    //this.ranges[this.ranges.length - 1].prevCutOff = prevCutOff;
  }


  // Returns the different between the highest possible countValue
  // and the lowest possible countValue for the given range entry.
  //private getBucketWidth(index: number): number {

  //  if (index > this.ranges.length - 1) {
  //    throw new Error('index must be less than the length of our ranges.');
  //  }

  //  let result: number;
  //  let topCountVal = this.ranges[index].cutOff;

  //  if (index === 0) {
  //    result = topCountVal + 1; // For exmple if the topCount is 3, then the bucket contains cnts: [0, 1, 2, 3]
  //    return result;
  //  }

  //  let botCountVal = this.ranges[index - 1].cutOff;
  //  result = topCountVal - botCountVal;

  //  return result;
  //}

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

  //public static fromColorMap(data: any) : ColorMap {
  //  let result = new ColorMap(data.ranges, data.highColor);
  //  return result;
  //}

  public toString(): string {
    let result = 'ColorMap with ' + this.ranges.length + ' entries.';
    return result;
  }
}

export class ColorMapUI {

  constructor(public ranges: ColorMapUIEntry[], public highColorCss: string, public serialNumber: number) { }

  public insertColorMapEntry(index: number, entry: ColorMapUIEntry) {
    this.ranges.splice(index, 0, entry);
  }

  public removeColorMapEntry(index: number): ColorMapUIEntry {
    let result = this.ranges[index];
    this.ranges.splice(index, 1);
    return result;
  }

  public applyColors(colorMapUiEntries: ColorMapUIEntry[], serialNumber: number): ColorMapUI {

    let ranges: ColorMapUIEntry[] = [];
    let ptrToNewColorEntry = 0;

    let ptr: number;
    for (ptr = 0; ptr < this.ranges.length; ptr++) {
      let existingCutOff = this.ranges[ptr].cutOff;
      let newColorComps = colorMapUiEntries[ptrToNewColorEntry++].startColor.colorComponents;

      ranges.push(new ColorMapUIEntry(existingCutOff, newColorComps, ColorMapEntryBlendStyle.none, null));

      if (ptrToNewColorEntry > colorMapUiEntries.length - 1) {
        ptrToNewColorEntry = 0;
      }
    }

    let result: ColorMapUI = new ColorMapUI(ranges, this.highColorCss, serialNumber);
    return result;
  }

  public mergeCutoffs(cutOffs: number[], serialNumber: number): ColorMapUI {

    //let test: BigInt(42);

    let ranges: ColorMapUIEntry[] = [];
    let ptrToExistingCmes = 0;

    let ptr: number;
    for (ptr = 0; ptr < cutOffs.length; ptr++) {
      let existingColorComps = this.ranges[ptrToExistingCmes++].startColor.colorComponents;

      ranges.push(new ColorMapUIEntry(cutOffs[ptr], existingColorComps, ColorMapEntryBlendStyle.none, null));

      if (ptrToExistingCmes > this.ranges.length - 1) {
        ptrToExistingCmes = 0;
      }
    }

    let result: ColorMapUI = new ColorMapUI(ranges, this.highColorCss, serialNumber);
    return result;
  }

  public spliceCutOffs(start: number, numToRemove: number, cutOffs: number[], serialNumber: number): ColorMapUI {

    // Create a range of ColorMapUIEntries from the given cutOffs.
    let white: number = ColorNumbers.white;
    let whiteComps = ColorNumbers.getColorComponents(white);

    let rangesToInsert: ColorMapUIEntry[] = [];

    let ptr1: number;
    for (ptr1 = 0; ptr1 < cutOffs.length; ptr1++) {
      rangesToInsert.push(new ColorMapUIEntry(cutOffs[ptr1], whiteComps, ColorMapEntryBlendStyle.none, null)); 
    }

    // Create a copy of the existing ranges
    let rangesResult: ColorMapUIEntry[] = [];

    let ptr2: number;
    for (ptr2 = 0; ptr2 < this.ranges.length; ptr2++) {
      rangesResult.push(new ColorMapUIEntry(this.ranges[ptr2].cutOff, this.ranges[ptr2].startColor.colorComponents, ColorMapEntryBlendStyle.none, null));
    }

    rangesResult.splice(start, numToRemove, ...rangesToInsert);

    let result: ColorMapUI = new ColorMapUI(rangesResult, this.highColorCss, serialNumber);
    return result;
  }

  public getOffsets(): number[] {
    let result = new Array<number>(this.ranges.length);

    let ptr: number;
    for (ptr = 0; ptr < this.ranges.length; ptr++) {
      result[ptr] = this.ranges[ptr].cutOff;
    }

    return result;
  }

  public getRegularColorMap(): ColorMap {
    let regularRanges: ColorMapEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < this.ranges.length; ptr++) {
      let cmuie = this.ranges[ptr];
      let startCComps = ColorNumbers.getColorFromComps(cmuie.startColor.colorComponents);
      let endCComps = ColorNumbers.getColorFromComps(cmuie.endColor.colorComponents);
      let cme: ColorMapEntry = new ColorMapEntry(cmuie.cutOff, startCComps, cmuie.blendStyle, endCComps);
      regularRanges.push(cme);
    }

    let result = new ColorMap(regularRanges, ColorNumbers.getColorFromCssColor(this.highColorCss));
    return result;
  }

  public static fromColorMapForExport(cmfe: ColorMapForExport, serialNumber: number): ColorMapUI {

    if (typeof cmfe.version === 'undefined') {
      cmfe.version = 1.0;
    }
    //console.log('Got a ColorMapForExport and it has version = ' + cmfe.version + '.');

    let ranges: ColorMapUIEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < cmfe.ranges.length; ptr++) {
      let cmeForExport = cmfe.ranges[ptr];
      let cme: ColorMapUIEntry = ColorMapUIEntry.fromOffsetAndCssColor(cmeForExport.cutOff, cmeForExport.cssColor, ColorMapEntryBlendStyle.none, '#000000');
      ranges.push(cme);
    }

    let result = new ColorMapUI(ranges, cmfe.highColorCss, serialNumber);
    return result;
  }
}

export class ColorMapForExport {

  public version: number = 1.0;

  constructor(public ranges: ColorMapEntryForExport[], public highColorCss: string) { }

  public static FromColorMap(colorMap: ColorMapUI): ColorMapForExport {
    let ranges: ColorMapEntryForExport[] = [];

    let ptr: number;
    for (ptr = 0; ptr < colorMap.ranges.length; ptr++) {
      let cme: ColorMapUIEntry = colorMap.ranges[ptr];
      let cmeForExport = ColorMapEntryForExport.fromColorMapUIEntry(cme);
      ranges.push(cmeForExport);
    }

    const result = new ColorMapForExport(ranges, colorMap.highColorCss);
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
  colorMap: ColorMap;
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

export interface IWebWorkerUpdateColorMapRequest_OLD extends IWebWorkerMessage {
  cutOffs: Uint16Array;
  colorNums: Uint32Array;
  highColorNum: number;

  getColorMap(): ColorMap;
}

export interface IWebWorkerUpdateColorMapRequest extends IWebWorkerMessage {
  colorMap: ColorMap;

  //getColorMap(): ColorMap;
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
    public colorMap: ColorMap,
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
    let result = new MapWorkingData(this.canvasSize, this.mapInfo, this.colorMap, this.sectionAnchor);
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

export class WebWorkerUpdateColorMapRequest_OLD implements IWebWorkerUpdateColorMapRequest_OLD {
  constructor(public messageKind: string, public cutOffs: Uint16Array, public colorNums: Uint32Array, public highColorNum: number) { }

  static FromEventData(data: any): IWebWorkerUpdateColorMapRequest_OLD {
    let result = new WebWorkerUpdateColorMapRequest_OLD(data.messageKind, data.cutOffs, data.colorNums, data.highColorNum);

    return result;
  }

  static CreateRequest(colorMap: ColorMap): IWebWorkerUpdateColorMapRequest_OLD {

    let cutOffs = colorMap.getCutOffs();
    let colorNums = colorMap.getColorNums();

    let result = new WebWorkerUpdateColorMapRequest_OLD("UpdateColorMap", cutOffs, colorNums, colorMap.highColor);
    return result;
  }

  public getColorMap(): ColorMap {
    let result: ColorMap = ColorMap.FromTypedArrays(this.cutOffs, this.colorNums, this.highColorNum);
    return result;
  }
}

export class WebWorkerUpdateColorMapRequest implements IWebWorkerUpdateColorMapRequest {

  constructor(public messageKind: string, public colorMap: ColorMap) { }

  static FromEventData(data: any): IWebWorkerUpdateColorMapRequest {

    // Since the value of data does not contain any of the functions defined for a ColorMap object,
    // we must create a new ColorMap from the raw data members of the provided 'raw' instance.

    let newColorMap = new ColorMap(data.colorMap.ranges, data.colorMap.highColor);
    let result = new WebWorkerUpdateColorMapRequest(data.messageKind, newColorMap);

    return result;
  }

  static CreateRequest(colorMap: ColorMap): IWebWorkerUpdateColorMapRequest {

    let result = new WebWorkerUpdateColorMapRequest("UpdateColorMap", colorMap);
    return result;
  }

}

// Only used when the javascript produced from compiling this TypeScript is used to create worker.js

var mapWorkingData: IMapWorkingData = null;
var sectionNumber: number = 0;

// Handles messages sent from the window that started this web worker.
onmessage = function (e) {

  var pixelData: Uint8ClampedArray;
  var imageDataResponse: IWebWorkerImageDataResponse;

  //console.log('Worker received message: ' + e.data + '.');
  let plainMsg: IWebWorkerMessage = WebWorkerMessage.FromEventData(e.data);

  if (plainMsg.messageKind === 'Start') {
    let startMsg = WebWorkerStartRequest.FromEventData(e.data);

    mapWorkingData = startMsg.getMapWorkingData();
    sectionNumber = startMsg.sectionNumber;
    console.log('Worker created MapWorkingData with element count = ' + mapWorkingData.elementCount);

    let responseMsg = new WebWorkerMessage('StartResponse');
    console.log('Posting ' + responseMsg.messageKind + ' back to main script');
    self.postMessage(responseMsg, "*");
  }
  else if (plainMsg.messageKind === 'Iterate') {
    let iterateRequestMsg = WebWorkerIterateRequest.FromEventData(e.data);
    let iterCount = iterateRequestMsg.iterateCount;
    mapWorkingData.doIterationsForAll(iterCount);
    pixelData = mapWorkingData.getPixelData();

    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);

    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
    self.postMessage(imageDataResponse, "*", [pixelData.buffer]);
  }
  else if (plainMsg.messageKind === 'GetImageData') {
    //mapWorkingData.doIterationsForAll(1);
    pixelData = mapWorkingData.getPixelData();
    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);

    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
    self.postMessage(imageDataResponse, "*", [pixelData.buffer]);
  }
  else if (plainMsg.messageKind === "UpdateColorMap") {
    let upColorMapReq = WebWorkerUpdateColorMapRequest.FromEventData(e.data);

    mapWorkingData.colorMap = upColorMapReq.colorMap;
    console.log('WebWorker received an UpdateColorMapRequest with ' + mapWorkingData.colorMap.ranges.length + ' entries.');

    pixelData = mapWorkingData.getPixelData();

    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);

    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
    self.postMessage(imageDataResponse, "*", [pixelData.buffer]);
  }
  else if (plainMsg.messageKind === "GetHistogram") {
    let histogram = mapWorkingData.getHistogram();
    let histogramResponse = WebWorkerHistorgramResponse.CreateResponse(sectionNumber, histogram);

    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
    self.postMessage(histogramResponse, "*", [histogramResponse.vals.buffer, histogramResponse.occurances.buffer]);
  }
  else {
    console.log('Received unknown message kind: ' + plainMsg.messageKind);
  }

};




