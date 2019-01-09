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
      }
    }
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

  public static X100With3DecPlaces(val: number): number {
    if (val === 0) {
      return 0;
    }
    else {
      let percentX1000: number = parseInt((100000 * val + 0.5).toString(), 10);
      let p = percentX1000 / 1000;

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
      let res = p.toString() + '%';
      return res;
    }
  }

}
