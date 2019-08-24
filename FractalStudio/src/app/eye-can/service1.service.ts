import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Service1Service {

  private _speed: number; // Pixels / second.
  private oldPos: number;

  private newHeights: number[];
  private curHeights: number[];
  private curSpeeds: number[];

  private lowLevelAdvandincProps: AdvancingProps;

  set speed(value: number) {
    this._speed = value;
  }
  get speed(): number {
    return this._speed;
  }

  constructor() {
    this.speed = 400;

    this.lowLevelAdvandincProps = new AdvancingProps(15, 1.3, 3);


    this.oldPos = -1;
  }

  public step(imgData: ImageData, eTime: number, cntr: number): boolean {

    let pos: number;

    if (cntr === 0) {
      pos = 0;
      this.curHeights = this.initHeights(imgData.width);
      this.newHeights = this.initHeights(imgData.width);
    }
    else {
      pos = this.getPos(eTime, this._speed);
      let delta = pos - this.oldPos;
      //this.getNewHeights(this.curHeights, this.newHeights, delta, pos);

      if (cntr === 1) {
        this.curSpeeds = this.initSpeeds(imgData.width, delta);
      }

      if (0 === cntr % this.lowLevelAdvandincProps.speedAdjustmentFrequency) {
        let sampleHeights = this.getHeightsAtSamplePoints(this.curHeights, this.lowLevelAdvandincProps.sampleInterval);
        this.getNewSpeeds(this.curSpeeds, sampleHeights, pos, delta);
      }

      this.getNewHeights2(this.curHeights, this.newHeights, this.curSpeeds);
    }

    let complete = this.advancingLine2(imgData, this.newHeights, this.curHeights);

    let temp = this.curHeights;
    this.curHeights = this.newHeights;
    this.newHeights = temp;

    this.oldPos = pos;
    return complete;


    //this.rollRed(imgData);

    //if (eTime > 1100)
    //  return true;
    //else
    //  return false;

    //let ar: Uint8ClampedArray = imgData.data;
    //let w = imgData.width * 4;

    //if (cntr > 0) {
    //  this.clearPrevious(ar, w, 5 * cntr - 5);
    //}

    //this.drawCur(ar, w, 5 * cntr);
  }

  private getPos(eTime: number, speed: number): number {
    let result = speed * eTime / 1000;
    return result;
  }

  private advancingLine2(imgData: ImageData, poses: number[], oldPoses: number[]): boolean {
    let ar: Uint8ClampedArray = imgData.data;
    let w = imgData.width;
    let h = imgData.height;

    this.drawGreenPoints(ar, oldPoses, w, h, 0);
    let complete = this.drawGreenPoints(ar, poses, w, h, 255);

    return complete;
  }

  private drawGreenPoints(ar: Uint8ClampedArray, poses: number[], w: number, maxH: number, v: number) : boolean {

    let result = true; // Complete

    let cPtr: number;
    for (cPtr = 0; cPtr < w; cPtr++) {
      let h = Math.round(poses[cPtr]);

      if (h < maxH) {
        result = false;
        if (h > -1) {
          let ptr = 4 * (h * w + cPtr);

          ar[ptr] = 0;
          ar[ptr + 1] = v;
          ar[ptr + 2] = 0;
        }
      }

      // Paint second point, just above first point.
      h++;
      if (h < maxH && h > -1) {
        let ptr = 4 * (h * w + cPtr);

        ar[ptr] = 0;
        ar[ptr + 1] = v;
        ar[ptr + 2] = 0;
      }
    }

    return result;
  }

  private advancingLine(imgData: ImageData, pos: number, oldPos: number): boolean {
    let ar: Uint8ClampedArray = imgData.data;
    let w = imgData.width;
    let h = imgData.height;

    if (oldPos > -1) {
      this.drawGreenLine(ar, oldPos, w, 0);
      this.drawGreenLine(ar, oldPos + 1, w, 0);
    }

    if (pos < h - 2) {
      this.drawGreenLine(ar, pos, w, 255);
      this.drawGreenLine(ar, pos + 1, w, 255);
    }

    if (pos > h)
      return true;
    else
      return false;
  }

  private drawGreenLine(ar: Uint8ClampedArray, pos: number, w: number, v: number) {

    let cPtr: number;
    for (cPtr = 0; cPtr < w; cPtr++) {
      let ptr = 4 * (pos * w + cPtr);

      ar[ptr] = 0;
      ar[ptr + 1] = v;
      ar[ptr + 2] = 0
    }
  }

  private getNewHeights2(poses: number[], newPoses: number[], deltas: number[]): void {

    let sampleInterval = this.lowLevelAdvandincProps.sampleInterval;

    let w = poses.length;
    let ptr: number;
    let sPtr = 0;

    for (ptr = 0; ptr < w; ptr+=sampleInterval) {
      newPoses[ptr] = poses[ptr] + deltas[sPtr++];

      if (ptr > 0) {
        this.interpolatePoints(newPoses, ptr - sampleInterval, ptr);
      }
    }

    newPoses[w - 1] = poses[w - 1] + deltas[sPtr];
    this.interpolatePoints(newPoses, ptr - sampleInterval, w - 1);
    //console.log("We are here.");
  }

  private initSpeeds(w: number, baseSpeed: number): number[] {
    console.log('initSpeeds has been called.');

    let sampleCnt = Math.floor(w / this.lowLevelAdvandincProps.sampleInterval);

    if (w % this.lowLevelAdvandincProps.sampleInterval !== 0) {
      sampleCnt++;
    }

    let result = new Array<number>(sampleCnt);
    let speedRange = baseSpeed * this.lowLevelAdvandincProps.speedRangeFactor;

    let ptr: number;
    for (ptr = 0; ptr < sampleCnt; ptr++) {
      result[ptr] = baseSpeed + this.getRandomAmount(speedRange);
    }

    //console.log(result);
    return result;
  }

  private getNewSpeeds(speeds: number[], curHeights: number[], targetHeight: number, baseSpeed: number): void {

    let sampleCnt = speeds.length;

    let ptr: number;
    for (ptr = 0; ptr < sampleCnt; ptr++) {
      speeds[ptr] = this.getNewSpeed2(speeds[ptr], curHeights[ptr], targetHeight, baseSpeed);
    }
  }

  // Get new speed based on current speed.
  private getNewSpeed(curSpeed: number, curHeight: number, targetHeight: number, baseSpeed: number): number {

    let sFactor: number;

    let dif = curSpeed - baseSpeed;
    if (Math.abs(dif) > baseSpeed) {
      sFactor = 0.9;
    }
    else {
      sFactor = 0.1;
    }

    let cor = baseSpeed * sFactor * Math.random();

    let d = Math.random();
    if (dif > 0) {
      // Currently going faster
      if (d > 0.01) cor *= -1;
    }
    else {
      // Currently going slower
      if (d > 0.99) cor *= -1;
    }

    return curSpeed + cor;
  }

  // Get new speed based on position.
  private getNewSpeed2(curSpeed: number, curHeight: number, targetHeight: number, baseSpeed: number): number {

    let sFactor: number;
    let dif = curHeight - targetHeight;

    if (Math.abs(dif) > 6) {
      sFactor = 1.9;
    }
    else {
      sFactor = 1.1;
    }

    let cor = baseSpeed * sFactor * Math.random();

    let d = Math.random();
    if (dif > 0) {
      // Currently ahead
      if (d > 0.01) cor *= -1;
    }
    else {
      // Currently behind
      if (d > 0.99) cor *= -1;
    }

    return curSpeed + cor;
  }

  private getRandomAmount(range: number): number {
    let result = range * Math.random();

    let d = Math.random();
    if (d < 0.5) result *= -1;

    return result;
  }

  private interpolatePoints(values: number[], startIndex: number, endIndex: number): void {
    let sVal = values[startIndex];
    let eVal = values[endIndex];

    let l = endIndex - startIndex;

    let diff = eVal - sVal;

    let uDiff = diff / l;

    let ptr: number;
    for (ptr = startIndex + 1; ptr < endIndex; ptr++) {
      values[ptr] = Math.round(sVal + uDiff * (ptr - startIndex));
    }

  }

  private initHeights(w: number): number[] {
    let result = new Array<number>(w);

    let ptr: number;
    for (ptr = 0; ptr < w; ptr++) {
      result[ptr] = 0;
    }

    return result;
  }

  private getHeightsAtSamplePoints(curHeights: number[], sampleInterval: number): number[] {
    let len = curHeights.length;

    let result: number[] = [];

    let ptr: number;
    for (ptr = 0; ptr < len; ptr += sampleInterval) {
      result.push(curHeights[ptr]);
    }

    if (len % sampleInterval !== 0) {
      result.push(curHeights[len - 1]);
    }

    return result;
  }

  private rollRed(imgData: ImageData): void {
    let ar: Uint8ClampedArray = imgData.data;
    let w = imgData.width;
    let h = imgData.height;

    let rPtr: number;
    for (rPtr = 0; rPtr < h; rPtr++) {

      let cPtr: number;
      for (cPtr = 0; cPtr < w; cPtr++) {
        let ptr = (rPtr * w * 4) + (cPtr * 4);

        ar[ptr] = 255;
        ar[ptr + 1] = 0;
        ar[ptr + 2] = 0;

        let r = ar[ptr + 3];
        if (r < 60)
          r = 255;
        else
          r -= 3;
        ar[ptr + 3] = r;
      }
    }

  }

  private clearPrevious(ar: Uint8ClampedArray, w: number, cntr: number) : void {
    let rPtr: number;
    for (rPtr = 0; rPtr < 100; rPtr++) {

      let cPtr: number;
      for (cPtr = 20; cPtr < 120; cPtr++) {
        let ptr = ((cntr + rPtr) * w) + (cPtr * 4);

        ar[ptr] = 0;
        ar[ptr + 1] = 0;
        ar[ptr + 2] = 0;
        ar[ptr + 3] = 0;
      }
    }
  }

  private drawCur(ar: Uint8ClampedArray, w: number, cntr: number): void {

    let rPtr: number;
    for (rPtr = 0; rPtr < 100; rPtr++) {

      let cPtr: number;
      for (cPtr = 20; cPtr < 120; cPtr++) {
        let ptr = ((cntr + rPtr) * w) + (cPtr * 4);

        ar[ptr] = 255;
        ar[ptr + 1] = 0;
        ar[ptr + 2] = 0;
        ar[ptr + 3] = 255;
      }
    }
  }
}

class AdvancingProps {

  constructor(public sampleInterval: number, public speedRangeFactor: number, public speedAdjustmentFrequency: number) {
  }

}
