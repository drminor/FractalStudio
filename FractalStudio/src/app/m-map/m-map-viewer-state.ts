import { IPoint, Point, IBox, Box, ICanvasSize, CanvasSize, JOB_BLOCK_SIZE} from './m-map-common';

export interface IVirtualMapParams {
  name: string;
  iterations: number;
  imageSizeInInches: ICanvasSize;

  printDensity: number;

  position: IPoint;

  imageSize: ICanvasSize;
  viewSize: ICanvasSize;
  zoomFactor: ICanvasSize;
  viewSizeInInches: ICanvasSize;
}

export interface IVirtualMap {
  imageSize: ICanvasSize;
  displaySize: ICanvasSize;

  workStartPos: IPoint;

  getCurCoords(pos: IPoint): IPoint;
  getOverLayBox(pos: IPoint): IBox;
  scaleFactor: ICanvasSize;

  getNextCoords(pos: IPoint): IPoint;
  getNextWorkCoords(pos: IPoint): IPoint;
}

export class VirtualMapParams implements IVirtualMapParams {

  private _imageSize: ICanvasSize;
  public get imageSize(): ICanvasSize {
    return this._imageSize;
  }

  private _viewSize: ICanvasSize;
  public set viewSize(value: ICanvasSize) {
    this._viewSize = value;
    if (value !== null) {
      this._zoomFactor = this.getZoomFactor(this.imageSize, value);
      this._viewSizeInInches = new CanvasSize(this.imageSizeInInches.width / this._zoomFactor.width, this.imageSizeInInches.height / this._zoomFactor.height);
    }
    else {
      this._zoomFactor = null;
      this._viewSizeInInches = null;
    }
  }
  public get viewSize(): ICanvasSize {
    return this._viewSize;
  }

  private _zoomFactor: ICanvasSize;
  public get zoomFactor(): ICanvasSize {
    return this._zoomFactor;
  }

  private _viewSizeInInches: ICanvasSize;
  public get viewSizeInInches(): ICanvasSize {
    return this._viewSizeInInches
  }

  // imageSize is the size of the image in inches
  constructor(public name: string, public iterations: number, public imageSizeInInches: ICanvasSize, public printDensity: number,
    displaySize: ICanvasSize, public position: IPoint) {
    this._imageSize = new CanvasSize(imageSizeInInches.width * printDensity, imageSizeInInches.height * printDensity);

    this.viewSize = displaySize;
    //this.viewSize = null;
    //this._viewSizeInInches = null;
    //this._zoomFactor = null;
  }

  private getZoomFactor(imageSize: ICanvasSize, viewSize: ICanvasSize): ICanvasSize {
    let result = new CanvasSize(imageSize.width / viewSize.width, imageSize.height / viewSize.height);
    return result;
  }
}

export class VirtualMap implements IVirtualMap {

  private _imageSizeInBlocks: ICanvasSize;
  public get imageSizeInBlocks(): ICanvasSize {
    return this._imageSizeInBlocks;
  }

  private _displaySizeInBlocks: ICanvasSize;
  public get displaySizeInBlocks(): ICanvasSize {
    return this._displaySizeInBlocks;
  }

  private _scaleFactor: ICanvasSize;
  public get scaleFactor(): ICanvasSize {
    return this._scaleFactor;
  }

  private _maxLeft: number;
  public get maxLeft(): number {
    return this._maxLeft;
  }

  private _maxTop: number;
  public get maxTop(): number {
    return this._maxTop;
  }

  private _workStartPos: IPoint = new Point(0, 0); //new Point(36, 18);
  public get workStartPos(): IPoint {
    return this._workStartPos;
  }

  private _workMaxLeft = 93;
  private _workMaxTop = 65;
  
  constructor(public imageSize: ICanvasSize, public displaySize: ICanvasSize) {

    //let vScaleFactor = displaySize.width / this.imageSize.width;
    //let hScaleFactor = displaySize.height / this.imageSize.height;
    //this._scaleFactor = new CanvasSize(vScaleFactor, hScaleFactor);

    this._displaySizeInBlocks = new CanvasSize(Math.ceil(displaySize.width / JOB_BLOCK_SIZE), Math.ceil(displaySize.height / JOB_BLOCK_SIZE));
    this._imageSizeInBlocks = new CanvasSize(Math.ceil(imageSize.width / JOB_BLOCK_SIZE), Math.ceil(imageSize.height / JOB_BLOCK_SIZE));

    let vScaleFactor = this._displaySizeInBlocks.width / this._imageSizeInBlocks.width;
    let hScaleFactor = this._displaySizeInBlocks.height / this._imageSizeInBlocks.height;
    this._scaleFactor = new CanvasSize(vScaleFactor, hScaleFactor);

    this._maxLeft = -1 + this._imageSizeInBlocks.width - this._displaySizeInBlocks.width;
    this._maxTop = -1 + this._imageSizeInBlocks.height - this._displaySizeInBlocks.height;
  }

  // Top is the distance measured from the top of the image to the top of the section being displayed.
  // Left is the distance measured from the left of the image to the left of the section being displayed.
  public getCurCoords(pos: IPoint): Point {

    console.log('Calculating new area: the current position is left:' + pos.x + ' top:' + pos.y + '.');

    let left = Math.trunc(pos.x);
    let top = Math.trunc(pos.y);

    if (left < 0) left = 0;
    if (top < 0) top = 0;

    if (left > this._maxLeft) left = this._maxLeft;
    if (top > this._maxTop) top = this._maxTop;

    console.log('Calculating new area: the new position is left:' + left + ' top:' + top + '.');

    let result = new Point(left, top);

    return result;
  }

  public getOverLayBox(pos: IPoint): IBox {

    let scLeft = pos.x / this.displaySizeInBlocks.width;
    let scTop = pos.y / this.displaySizeInBlocks.height;
    let viewBox = new Box(new Point(scLeft, scTop), new Point(scLeft + 1, scTop + 1));
    let result = viewBox.scale(this.scaleFactor);

    return result;
  }

  public getNextCoords(pos: IPoint): IPoint {
    let nLeft: number;
    let nTop: number;

    if (pos.x >= this.maxLeft && pos.y >= this.maxTop) {
      return null;
    }

    if (pos.x >= this.maxLeft) {
      nLeft = 0;
      nTop = pos.y + this.displaySizeInBlocks.height;
    }
    else {
      nLeft = pos.x + this.displaySizeInBlocks.width;
      nTop = pos.y;
    }

    return new Point(nLeft, nTop);
  }

  public getNextWorkCoords(pos: IPoint): IPoint {
    let nLeft: number;
    let nTop: number;

    if (pos.x >= this._workMaxLeft && pos.y >= this._workMaxTop) {
      return null;
    }

    if (pos.x >= this._workMaxLeft) {
      nLeft = this.workStartPos.x;
      nTop = pos.y + this.displaySizeInBlocks.height;
    }
    else {
      nLeft = pos.x + this.displaySizeInBlocks.width;
      nTop = pos.y;
    }

    return new Point(nLeft, nTop);
  }


}
