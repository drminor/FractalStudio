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

  //private xVals: number[];
  //private yVals: number[];

  constructor(public coords: IBox, public imageSize: ICanvasSize, public scrToPrnPixRat: number, public displaySize: ICanvasSize) {

    // If the given scrToPrnPixRat is too high, set it to the maximum
    // value that keeps the entire viewWidth > the display width.
    let maxScrToPrnPixRat = this.getMaxScreenToPrintPixRat(imageSize.width, displaySize.width);
    if (scrToPrnPixRat > maxScrToPrnPixRat) {
      this.scrToPrnPixRat = maxScrToPrnPixRat;
    }

    //if (coords !== null) {
    //  this.xVals = this.buildVals(this.displaySize.width, this.coords.botLeft.x, this.coords.topRight.x);
    //  this.yVals = this.buildVals(this.displaySize.height, this.coords.botLeft.y, this.coords.topRight.y);
    //}
  }

  //// Build the array of 'c' values for one dimension of the map.
  //private buildVals(canvasExtent: number, start: number, end: number): number[] {
  //  let result: number[] = new Array<number>(canvasExtent);

  //  let mapExtent: number = end - start;
  //  let unitExtent: number = mapExtent / canvasExtent;

  //  var i: number;
  //  for (i = 0; i < canvasExtent; i++) {
  //    result[i] = start + i * unitExtent;
  //  }
  //  return result;
  //}

  // How many logical pixels are displayed on our canvas.
  public getViewSize(): ICanvasSize {

    let result = this.displaySize.getScaledCanvas(this.scrToPrnPixRat);
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

    let imageBot: number;
    let imageTop: number;

    // Set the imageBot so that is the larger of the two values.
    // As we move from imageBot to imageTop, the coordinate values should decrease.
    if (this.coords.upsideDown) {
      // If the coords are upside down, then the y value for botLeft is larger than the y value for topRight.
      imageBot = this.coords.botLeft.y;
      imageTop = this.coords.topRight.y;
    }
    else {
      // reverse the map coordinates so that they increase from top to bottom.
      imageBot = this.coords.topRight.y;
      imageTop = this.coords.botLeft.y;
    }

    if (imageBot < imageTop) {
      console.log('The y values are not reversed.');
    }

    //let viewSize = this.getViewSize();

    // Calculate indexes into the virtual x and y values array.

    //let sx = left * this.displaySize.width;
    //let ex = -1 + sx + this.displaySize.width;

    //let sy = top * this.displaySize.height;
    //let ey = -1 + sy + this.displaySize.height;

    //let dMapWidth = this.coords.width;
    //let dMapHeight = imageBot - imageTop;

    //let virtualViewExtent = this.imageSize.getScaledCanvas(1 / this.scrToPrnPixRat);

    //let unitExtentW = dMapWidth / virtualViewExtent.width;
    //let unitExtentH = dMapHeight / virtualViewExtent.height;

    //let sxc = this.coords.botLeft.x + sx * unitExtentW;
    //let exc = this.coords.botLeft.x + ex * unitExtentW;

    //let syc = imageBot - sy * unitExtentH;
    //let eyc = imageBot - ey * unitExtentH;

    let dMapWidth = this.coords.width;
    let dMapHeight = imageBot - imageTop;

    let vvw = this.scrToPrnPixRat * this.displaySize.width / this.imageSize.width;
    let vvh = this.scrToPrnPixRat * this.displaySize.height / this.imageSize.height;

    let unitExtentW = dMapWidth * vvw;
    let unitExtentH = dMapHeight * vvh;

    let sxc = this.coords.botLeft.x + left * unitExtentW;
    let exc = this.coords.botLeft.x + (left + 1) * unitExtentW;

    let syc = imageBot - top * unitExtentH;
    let eyc = imageBot - (top + 1) * unitExtentH;

    let result = new Box(new Point(sxc, eyc), new Point(exc, syc));

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

    let vvw = this.scrToPrnPixRat * this.displaySize.width / this.imageSize.width;
    let vvh = this.scrToPrnPixRat * this.displaySize.height / this.imageSize.height;


    let sx = left * vvw;
    let ex = sx + vvw;

    let sy = top * vvh;
    let ey = sy + vvh;


    let result = new Box(new Point(sx, sy), new Point(ex, ey));

    return result;

  }


}
