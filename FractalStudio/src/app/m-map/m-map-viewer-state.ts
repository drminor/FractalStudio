import {
  IPoint, Point, IBox, Box, ICanvasSize, CanvasSize,
  IMapInfo, MapInfo, IMapWorkingData, MapWorkingData
} from './m-map-common';


export interface IVirtualMapParams {
  imageSize: ICanvasSize;
  printDensity: number;
  scrToPrnPixRat: number;
  left: number,
  top: number,

  viewSize: ICanvasSize;
  imageSizeInInches: ICanvasSize;
  viewSizeInInches: ICanvasSize;
}

export interface IVirtualMap {
  imageSize: ICanvasSize;
  scrToPrnPixRat: number;

  coords: IBox;
  displaySize: ICanvasSize;

  getViewSize(): ICanvasSize;
  getCurCoords(left: number, top: number): IBox;
  getOverLayBox(left: number, top: number): IBox;
}

export class VirtualMapParams implements IVirtualMapParams {

  public imageSizeInInches: ICanvasSize;
  public viewSizeInInches: ICanvasSize;

  private _viewSize: ICanvasSize;
  public set viewSize(value: ICanvasSize) {
    this._viewSize = value;
    if (value !== null) {
      this.viewSizeInInches = this.getSizeInInches(value, this.printDensity);
    }
  }
  public get viewSize(): ICanvasSize {
    return this._viewSize;
  }

  public get haveViewSize(): boolean {
    return this._viewSize !== null;
  }

  constructor(public imageSize: ICanvasSize, public printDensity: number,
    public scrToPrnPixRat: number, public left: number, public top: number) {
    this.imageSizeInInches = this.getSizeInInches(imageSize, printDensity);

    this.viewSize = null;
    this.viewSizeInInches = null;
  }

  private getSizeInInches(sz: ICanvasSize, printDensity: number): ICanvasSize {
    let result = new CanvasSize(sz.width / printDensity, sz.height / printDensity);
    return result;
  }
}

export class VirtualMap implements IVirtualMap {

  private _scaleFactor: ICanvasSize;
  public get scaleFactor(): ICanvasSize {
    return this._scaleFactor;
  }

  private _maxScrToPrnPixRat: number;
  public get maxScrToPrnPixRat(): number {
    return this._maxScrToPrnPixRat;
  }

  private _maxLeft: number;
  public get maxLeft(): number {
    return this._maxLeft;
  }

  private _maxTop: number;
  public get maxTop(): number {
    return this._maxTop;
  }

  constructor(public coords: IBox, public imageSize: ICanvasSize, public scrToPrnPixRat: number, public displaySize: ICanvasSize) {

    // If the given scrToPrnPixRat is too high, set it to the maximum
    // value that keeps the entire viewWidth > the display width.
    this._maxScrToPrnPixRat = this.getMaxScreenToPrintPixRat(imageSize.width, displaySize.width);

    if (scrToPrnPixRat > this._maxScrToPrnPixRat) {
      this.scrToPrnPixRat = this._maxScrToPrnPixRat;
    }

    // Set our Scale Factor.
    let vScaleFactor = this.scrToPrnPixRat * this.displaySize.width / this.imageSize.width;
    let hScaleFactor = this.scrToPrnPixRat * this.displaySize.height / this.imageSize.height;
    this._scaleFactor = new CanvasSize(vScaleFactor, hScaleFactor);

    this._maxLeft = 24;
    this._maxTop = 16;
  }

  // How many logical pixels are displayed on our canvas.
  public getViewSize(): ICanvasSize {
    let result = this.displaySize.mult(this.scrToPrnPixRat);
    return result;
  }

  // If the screen to print pixel ratio is any larger than this
  // then the resulting image will be smaller than our Map Display Canvas.
  public getMaxScreenToPrintPixRat(imageWidthPx: number, displayWidthPx: number): number {
    let screenToPrintRat = imageWidthPx / displayWidthPx;

    // Truncate to the nearest integer
    let result = parseInt((screenToPrintRat).toString());
    return result;
  }

  // Top is the distance measured from the top of the image to the top of the section being displayed.
  // Left is the distance measured from the left of the image to the left of the section being displayed.
  public getCurCoords(left: number, top: number): IBox {

    if (this.coords === null) {
      return null;
    }

    //console.log('The current coords are ' + this.coords.toString() + '.');
    //console.log('The current width is ' + this.coords.width + '.');

    //let curWidth = this.coords.width;

    //let imageTop: number;

    //// Set the imageTop so that is the larger of the two values.
    //// As we move from imageBot to imageTop, the coordinate values should decrease.
    //if (this.coords.isUpsideDown) {
    //  // If the coords are upside down, then the y value for botLeft is larger than the y value for topRight.
    //  imageTop = this.coords.botLeft.y;
    //}
    //else {
    //  // reverse the map coordinates so that they increase from top to bottom.
    //  imageTop = this.coords.topRight.y;
    //}

    let imageTop = this.coords.absTop;

    // Calculate indexes into the virtual x and y values array.


    let dMapWidth = this.coords.width;
    //let dMapHeight = imageBot - imageTop;
    let dMapHeight = this.coords.absHeight;

    let vvw = this.scrToPrnPixRat * this.displaySize.width / this.imageSize.width;
    let vvh = this.scrToPrnPixRat * this.displaySize.height / this.imageSize.height;

    let unitExtentW = dMapWidth * vvw;
    let unitExtentH = dMapHeight * vvh;

    let sx = this.coords.botLeft.x + left * unitExtentW;
    let ex = this.coords.botLeft.x + (left + 1) * unitExtentW;

    let ey = imageTop - top * unitExtentH;
    let sy = imageTop - (top + 1) * unitExtentH;

    let result = new Box(new Point(sx, sy), new Point(ex, ey));

    //console.log('The new coords are ' + result.toString() + '.');
    //console.log('The new width is ' + result.width + '.');

    //let diff = result.width - curWidth;
    //console.log('The new width - the old width = ' + diff + '.');

    return result;
  }

  // Top is the distance measured from the top of the image to the top of the section being displayed.
  // Left is the distance measured from the left of the image to the left of the section being displayed.
  public getCurCoords_NEW(left: number, top: number): IBox {

    if (this.coords === null) {
      return null;
    }

    //console.log('The current coords are ' + this.coords.toString() + '.');
    //console.log('The current width is ' + this.coords.width + '.');

    //let curWidth = this.coords.width;

    // Calculate indexes into the virtual x and y values array.

    let vvw = this.scrToPrnPixRat * this.displaySize.width / this.imageSize.width;
    let vvh = this.scrToPrnPixRat * this.displaySize.height / this.imageSize.height;

    let dMapWidth = this.coords.width;
    let dMapHeight = this.coords.absHeight;

    let unitExtentW = dMapWidth * vvw;
    let unitExtentH = dMapHeight * vvh;

    let imageLeft = this.coords.absLeft;
    let sx = imageLeft + left * unitExtentW;
    let ex = imageLeft + (left + 1) * unitExtentW;

    let imageTop = this.coords.absTop;
    let sy = imageTop - top * unitExtentH;
    let ey = imageTop - (top + 1) * unitExtentH;

    let result = new Box(new Point(sx, ey), new Point(ex, sy));



    //let viewBox = new Box(new Point(left, top), new Point(left + 1, top + 1));
    //let result = this.coords.translate(

    //let mapSize = this.coords.absSize;
    //let scaleFactor = mapSize.scale(this.scaleFactor);

    //let imageLeft = this.coords.absLeft;
    //let sx = imageLeft + left * scaleFactor.width;
    //let ex = imageLeft + (left + 1) * scaleFactor.width;

    //let imageTop = this.coords.absTop;
    //let sy = imageTop - (top + 1) * scaleFactor.height;
    //let ey = imageTop - top * scaleFactor.height;

    //let result = new Box(new Point(sx, sy), new Point(ex, ey));


    //let viewBox = new Box(new Point(left, top - 1), new Point(left + 1, top));
    //let mapSize = this.coords.absSize;
    //let scaledMapSize = mapSize.scale(this.scaleFactor);
    //let result = viewBox.scale(scaledMapSize);

    //console.log('The new coords are ' + result.toString() + '.');
    //console.log('The new width is ' + result.width + '.');

    //let diff = result.width - curWidth;
    //console.log('The new width - the old width = ' + diff + '.');

    return result;
  }

  public getOverLayBox(left: number, top: number): IBox {

    if (this.coords === null) {
      return null;
    }

    let viewBox = new Box(new Point(left, top), new Point(left + 1, top + 1));
    let result = viewBox.scale(this.scaleFactor);

    return result;
  }

}
