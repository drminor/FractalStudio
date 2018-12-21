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
  getCurCoords(left: number, top: number): IBox
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

  private xVals: number[];
  private yVals: number[];

  constructor(public coords: IBox, public imageSize: ICanvasSize, public scrToPrnPixRat: number, public displaySize: ICanvasSize) {

    // If the given scrToPrnPixRat is too high, set it to the maximum
    // value that keeps the entire viewWidth > the display width.
    let maxScrToPrnPixRat = this.getHomeScreenToPrintPixRat(imageSize.width, displaySize.width);
    if (scrToPrnPixRat > maxScrToPrnPixRat) {
      this.scrToPrnPixRat = maxScrToPrnPixRat;
    }

    if (coords !== null) {
      // X coordinates get larger as one moves from the left of the map to  the right.
      this.xVals = this.buildVals(this.displaySize.width, this.coords.botLeft.x, this.coords.topRight.x);

      this.yVals = this.buildVals(this.displaySize.height, this.coords.botLeft.y, this.coords.topRight.y);
    }
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

  public getViewSize(): ICanvasSize {

    let result = new CanvasSize(this.displaySize.width * this.scrToPrnPixRat, this.displaySize.height * this.scrToPrnPixRat);
    return result;
  }

  // If the screen to print pixel ratio is any larger than this
  // then the resulting image will be smaller than our Map Display Canvas.
  public getHomeScreenToPrintPixRat(imageWidthPx: number, displayWidthPx: number): number {
    let screenToPrintRat = imageWidthPx / displayWidthPx;

    // Truncate to the nearest integer
    let result = parseInt((screenToPrintRat).toString());
    return result;
  }

  public getCurCoords(left: number, top: number): IBox {

    let result: IBox = this.coords;

    //let result: IMapWorkingData[] = Array<IMapWorkingData>(numberOfSections);

    //// Calculate the heigth of each section, rounded down to the nearest whole number.
    //let sectionHeight = canvasSize.height / numberOfSections;
    //let sectionHeightWN = parseInt(sectionHeight.toString(), 10);

    //// Calculate the height of the last section.
    //let lastSectionHeight: number = canvasSize.height - sectionHeightWN * (numberOfSections - 1);

    //let left = mapInfo.bottomLeft.x;
    //let right = mapInfo.topRight.x;

    //let bottomPtr = 0;
    //let topPtr = sectionHeightWN;

    //let yVals: number[];

    //if (mapInfo.upsideDown) {
    //  // The y coordinates are already reversed, just use buildVals
    //  yVals = MapWorkingData.buildVals(canvasSize.height, mapInfo.bottomLeft.y, mapInfo.topRight.y);
    //}
    //else {
    //  // The y coordinates are not reveresed, must use buildValsRev
    //  yVals = MapWorkingData.buildValsRev(canvasSize.height, mapInfo.bottomLeft.y, mapInfo.topRight.y);
    //}
    ////yVals = MapWorkingData.buildValsRev(canvasSize.height, mapInfo.bottomLeft.y, mapInfo.topRight.y);

    //let ptr: number = 0;

    //// Build all but the last section.
    //for (; ptr < numberOfSections - 1; ptr++) {

    //  let secCanvasSize = new CanvasSize(canvasSize.width, sectionHeightWN);

    //  let secBottom = yVals[bottomPtr];
    //  let secTop = yVals[topPtr];

    //  let secBotLeft = new Point(left, secBottom);
    //  let secTopRight = new Point(right, secTop);

    //  let coords: IBox = new Box(secBotLeft, secTopRight);
    //  let secMapInfo = new MapInfo(coords, mapInfo.maxIterations, mapInfo.iterationsPerStep);

    //  let yOffset = ptr * sectionHeightWN;
    //  let secAnchor: IPoint = new Point(0, yOffset);
    //  result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, colorMap, secAnchor);

    //  // The next bottomPtr should point to one immediately following the last top.
    //  bottomPtr = topPtr + 1;
    //  topPtr += sectionHeightWN;
    //}

    //// Build the last section.
    //let secCanvasSize = new CanvasSize(canvasSize.width, lastSectionHeight);

    //let secBottom = yVals[bottomPtr];
    //let secBotLeft = new Point(left, secBottom);

    //topPtr = yVals.length - 1;
    //let secTop = yVals[topPtr];
    //let secTopRight = new Point(right, secTop);

    //let coords: IBox = new Box(secBotLeft, secTopRight);
    //let secMapInfo = new MapInfo(coords, mapInfo.maxIterations, mapInfo.iterationsPerStep);

    //let yOffset = ptr * sectionHeightWN;
    //let secAnchor: IPoint = new Point(0, yOffset);

    //result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, colorMap, secAnchor);

    return result;
  }

}
