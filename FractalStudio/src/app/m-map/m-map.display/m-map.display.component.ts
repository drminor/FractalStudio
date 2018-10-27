import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input } from '@angular/core';
import { Logger } from '../../logger.service';

import {
  IPoint, Point, IBox, Box, ICanvasSize, CanvasSize,
  IMapInfo, MapInfo, IMapWorkingData, MapWorkingData,
  WebWorkerImageDataResponse, WebWorkerMessage, WebWorkerStartRequest, WebWorkerImageDataRequest,
  WebWorkerIterateRequest, WebWorkerUpdateColorMapRequest,
  ColorMap, ColorMapEntry, ColorNumbers
} from '../m-map-common';

import { MMapService } from '../m-map.service';
import * as math from 'mathjs';

@Component({
  selector: 'app-m-map-display',
  templateUrl: './m-map.display.component.html',
  styleUrls: ['./m-map.display.component.css']
  //,
  //inputs: ['canvasWidth', 'canvasHeight']
})
export class MMapDisplayComponent implements AfterViewInit, OnInit {

  @Input('mapInfo') mapInfo: IMapInfo;
  //@Input('canvas-width') canvasWidth: number;
  //@Input('canvas-height') canvasHeight: number;

  @ViewChild('myCanvas') canvasRef: ElementRef;
  @ViewChild('myControlCanvas') canvasControlRef: ElementRef;

  // Will get as input, soon.
  private colorMap: ColorMap;

  public alive: boolean;

  private viewInitialized: boolean;
  private componentInitialized: boolean;
  private canvasSize: ICanvasSize;

  // Array of WebWorkers
  private workers: Worker[];
  private numberOfSections: number;
  private sections: IMapWorkingData[];

  private zoomBox: IBox;
  //private oldX: number;
  private canvasElement: HTMLCanvasElement;
  private canvasControlElement: HTMLCanvasElement;

  private useWorkers: boolean;

  constructor(private logger: Logger, private mService: MMapService) {
    this.componentInitialized = false;
    this.viewInitialized = false;
    console.log('m-map.display is being constructed.');

    this.colorMap = this.buildColorMap();
    this.workers = [];
    this.sections = [];

    // TODO: Make the numberOfSections an input.
    // Set the number of sections to 4 - because we have 4 logical processors.
    this.numberOfSections = 4;
    this.useWorkers = true;

    //// For simplicity, do not use Web Workers and use only one section.
    //this.numberOfSections = 1;
    //this.useWorkers = false;

    this.zoomBox = null;
    this.canvasElement = null;
  }

  private buildColorMap(): ColorMap {

    let cNumGenerator = new ColorNumbers();

    let ranges: ColorMapEntry[] = new Array<ColorMapEntry>(4);
    ranges[0] = new ColorMapEntry(10, cNumGenerator.white);
    ranges[1] = new ColorMapEntry(20, cNumGenerator.red);
    ranges[2] = new ColorMapEntry(50, cNumGenerator.green);
    ranges[3] = new ColorMapEntry(200, cNumGenerator.blue);

    let result: ColorMap = new ColorMap(ranges, cNumGenerator.black);
    return result;
  }

  drawEndNote(): void {
    //let ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext('2d');

    //ctx.fillStyle = '#DD0031';
    //ctx.clearRect(0, 0, this.canvasSize.width, 20);
  }

  draw(imageData: ImageData, sectionNumber: number): void {

    let ctx: CanvasRenderingContext2D = this.canvasElement.getContext('2d');

    let cw: number = this.canvasElement.width;
    let ch: number = this.canvasElement.height;

    //console.log("Drawing on canvas with W = " + cw + " H = " + ch);

    //if (sectionNumber > 2) return;

    let mapWorkingData: IMapWorkingData = this.sections[sectionNumber];

    if (cw !== this.canvasSize.width || ch !== this.canvasSize.height) {
      console.log('Draw detects that our canvas size has changed since intialization.')
    }

    // Check the image data's width to the canvas width for this section.
    if (imageData.width !== mapWorkingData.canvasSize.width) {
      console.log('Draw is being called with ImageData whose width does not equal canvas width for section number ' + sectionNumber + '.');
    }

    // Check the image data's height to the canvas height for this section.
    if (imageData.height !== mapWorkingData.canvasSize.height) {
      console.log('Draw is being called with ImageData whose height does not equal the canvas height for section number ' + sectionNumber + '.');
    }

    let left: number = mapWorkingData.sectionAnchor.x;
    let bot: number = mapWorkingData.sectionAnchor.y;

    ctx.fillStyle = '#DD0031';
    ctx.clearRect(left, bot, imageData.width, imageData.height);

    ctx.putImageData(imageData, left, bot);

    console.log('Just drew image data for sn=' + sectionNumber + ' left=' + left + ' bot =' + bot  + '.');
  }

  ngOnInit(): void {
    if (!this.componentInitialized) {
      this.componentInitialized = true;
      //console.log("We are inited.");
      //this.initWebWorker();
    }
    else {
      //console.log('We are being inited, but ngOnInit has already been called.');
    }
  }

  ngOnChanges() {
    if (this.viewInitialized) {
      console.log("m-map-display.component is handling ngOnChanges -- the view has been initialized.");

      let ptr: number = 0;
      for (; ptr < this.workers.length; ptr++) {
        this.workers[ptr].terminate();
      }
      this.buildWorkingData();
    }
    else {
      console.log("m-map-display.component is handling ngOnChanges -- the view has NOT been initialized.");
    }
  }

  ngAfterViewInit() {
    if (!this.viewInitialized) {
      this.viewInitialized = true;
      console.log("Initializing the canvas size and building the Map Working Data here once because we are finally ready.");

      this.canvasElement = this.canvasRef.nativeElement as HTMLCanvasElement;
      this.canvasControlElement = this.canvasControlRef.nativeElement as HTMLCanvasElement;

      // Get the size of our canvas.
      this.canvasSize = this.initMapDisplay(this.canvasElement);

      this.canvasControlElement.width = this.canvasSize.width;
      this.canvasControlElement.height = this.canvasSize.height;

      this.registerZoomEventHandlers(this.canvasControlElement);

      //this.canvasSize = new CanvasSize(24000, 16000);
      console.log("The initial canvas size is W = " + this.canvasSize.width + " H = " + this.canvasSize.height);

      // Now that we know the size of our canvas,
      this.buildWorkingData();
    }
  }

  private buildWorkingData(): void {
    if (this.useWorkers) {
      // Create a MapWorkingData for each section.
      this.sections = MapWorkingData.getWorkingDataSections(this.canvasSize, this.mapInfo, this.colorMap, this.numberOfSections);

      let ptr: number = 0;
      for (ptr = 0; ptr < this.numberOfSections; ptr++) {
        console.log('Section Number: ' + ptr + ' bot=' + this.sections[ptr].sectionAnchor.y + '.');
      }

      // initialized our workers array (this.workers)
      this.workers = this.initWebWorkers(this.numberOfSections);
    }
    else {
      if (this.numberOfSections !== 1) {
        //console.log('The number of sections must be set to 1, if useWorkers = false.');
        throw new RangeError('The number of sections must be set to 1, if useWorkers = false.');
      }
      this.sections = new Array<IMapWorkingData>(1);
      this.sections[0] = new MapWorkingData(this.canvasSize, this.mapInfo, this.colorMap, new Point(0, 0));

      this.progressively();
    }
  }

  private initMapDisplay(ce: HTMLCanvasElement): ICanvasSize {

    // Set our canvas size = to the number of pixels actually used to display our canvas HTML element.

    console.log('Doing initMapDisplay.');
    const result: ICanvasSize = new CanvasSize(
      ce.offsetWidth,
      ce.offsetHeight
    );

    // Set the internal canvas's bitmap equal to the pixels on the screen. (Zoom = 1)
    ce.width = result.width;
    ce.height = result.height;

    return result;
  }

  private registerZoomEventHandlers(ce: HTMLCanvasElement): void {
    ce.addEventListener("mousedown", (evt) => {
      this.onMousedown(this, evt);
    });

    ce.addEventListener("mousemove", (evt) => {
      this.onMouseMove(this, evt);
    });

    ce.addEventListener("mouseup", (evt) => {
      this.onMouseUp(this, evt);
    });

    //ce.addEventListener("b
  }

  // Worker stuff
  private initWebWorkers(numberOfSections: number): Worker[] {

    let result: Worker[] = new Array<Worker>(numberOfSections);

    let ptr: number = 0;

    for (ptr = 0; ptr < numberOfSections; ptr++) {
      let webWorker = new Worker('/assets/worker.js');
      result[ptr] = webWorker;

      webWorker.addEventListener("message", (evt) => {
        let plainMsg = WebWorkerMessage.FromEventData(evt.data);
        if (plainMsg.messageKind === 'ImageDataResponse') {
          let updatedMapDataMsg = WebWorkerImageDataResponse.FromEventData(evt.data);
          let sectionNumber: number = updatedMapDataMsg.sectionNumber;

          //console.log('Received ' + plainMsg.messageKind + ' with section number = ' + sectionNumber + ' from a web worker.');

          let mapWorkingData: IMapWorkingData = this.sections[sectionNumber];
          let imageData: ImageData = updatedMapDataMsg.getImageData(mapWorkingData.canvasSize);

          if (mapWorkingData.curInterations < mapWorkingData.mapInfo.maxInterations) {

            let iterateRequest = WebWorkerIterateRequest.CreateRequest(mapWorkingData.mapInfo.iterationsPerStep);
            this.workers[sectionNumber].postMessage(iterateRequest);
            mapWorkingData.curInterations += mapWorkingData.mapInfo.iterationsPerStep;

            // Call draw after sending the request to get the next ImageData.
            this.draw(imageData, sectionNumber);
          }
          else {
            // Call draw for the last ImageDataResponse
            this.draw(imageData, sectionNumber);

            // And then draw the end note.
            this.drawEndNote();
            console.log("Done.");
          }
        }
        else {
          console.log('Received message from a web worker, The message = ' + plainMsg.messageKind + '.');
        }
      });

      // Send the mapWorking data and color map to the Web Worker.
      let mapWorkingData: IMapWorkingData = this.sections[ptr];
      let startRequestMsg = WebWorkerStartRequest.CreateRequest(mapWorkingData, ptr);
      webWorker.postMessage(startRequestMsg);

      let iterateRequest = WebWorkerIterateRequest.CreateRequest(mapWorkingData.mapInfo.iterationsPerStep);
      webWorker.postMessage(iterateRequest);
      mapWorkingData.curInterations += mapWorkingData.mapInfo.iterationsPerStep;
    }

    return result;
  }

  private progressively(): void {
    console.log('Doing progresslvy');
    const that = this;
    let alive: boolean = true;

    let iterCount = this.sections[0].mapInfo.maxInterations;
    const intId = setInterval(doOneAndDraw, 5);

    function doOneAndDraw() {
      if (iterCount > 0 && alive) {
        iterCount--;

        let mapWorkinData: IMapWorkingData = that.sections[0];

        alive = mapWorkinData.doInterationsForAll(1);

        let pixelData: Uint8ClampedArray = mapWorkinData.getPixelData();

        //mapWorkinData.updateImageData(mapWorkinData.pixelData);
        let imageData = new ImageData(pixelData, mapWorkinData.canvasSize.width, mapWorkinData.canvasSize.height);

        that.draw(imageData, 0);
      } else {
        clearInterval(intId);
        that.drawEndNote();
        console.log("No WebWorkers -- Done.");
      }
    }
  }

  private zoomOut(pos: IPoint): void {

  }

  private zoomIn(box: IBox): void {

    // The new coordinates must have its width = 1.5 * its height, because our canvas has that aspect ratio.

    let nx: number;
    let ny: number;

    let nh: number;
    let nw: number;

    // Get a box where the start point is always in the lower, left.
    let nBox = box.getNormalizedBox();

    // Determine if the height or the width of the zoom box will be used to calculate the new coordinates.
    if (nBox.width * 1.5 > nBox.height) {
      // Using the width will result in the smallest change to the resulting dimensions, use it.
      console.log('Using Width, adjusting height.');
      nw = nBox.width;
      nh = this.round(nBox.width / 1.5);
      nx = nBox.start.x;

      // Since we are changing the height, move the starting position 1/2 the distance of the change
      // this will center the new height around the old box's vertical extent.
      let vAdj = this.round((nh - nBox.height) / 2);
      console.log('Moving start y back by ' + vAdj + '.');
      ny = nBox.start.y - vAdj;
      //ny = nBox.start.y;
    }
    else {
      // Using the height will result in the smallest change to the resulting dimensions, use it.
      console.log('Using height, adjusting width.');
      nw = this.round(nBox.height * 1.5);
      nh = nBox.height;
      ny = nBox.start.y;

      // Since we are changing the width, move the starting position 1/2 the distance of the change
      // this will center the new width around the old box's horizontal extent.
      let hAdj = this.round((nw - nBox.width) / 2);
      console.log('Moving start x back by ' + hAdj + '.');
      nx = nBox.start.x - hAdj;
      //nx = nBox.start.x;
    }

    let zBox = Box.fromPointExtent(new Point(nx, ny), nw, nh);

    let me = this.round(nh * 1.5) - nw;

    if (me > 1 || me < -1) {
      console.log('The new zoom box has the wrong aspect ratio.');
    }

    console.log('Original Zoom Box: ' + box.toString());
    console.log('Normalized Zoom Box: ' + nBox.toString());


    console.log('Current MapInfo = ' + this.mapInfo.toString());
    console.log('Canvas = w:' + this.canvasSize.width + ' h:' + this.canvasSize.height + '.');
    console.log('Proportioned Zoom Box: ' + zBox.toString());

    let unitExtentX: number = (this.mapInfo.topRight.x - this.mapInfo.bottomLeft.x) / this.canvasSize.width;
    let unitExtentY: number = (this.mapInfo.topRight.y - this.mapInfo.bottomLeft.y) / this.canvasSize.height;

    console.log('unit x: ' + unitExtentX + ' unit y' + unitExtentY);

    let msx = this.mapInfo.bottomLeft.x + zBox.start.x * unitExtentX;
    let mex = this.mapInfo.bottomLeft.x + zBox.end.x * unitExtentX;

    //console.log('new map sx: ' + msx + ' new map ex: ' + mex + '.');

    // Canvas origin is the top, right -- map coordinate origin is the bottom, right.
    // Invert the canvas coordinates.
    let invCanvasSY = this.canvasSize.height - zBox.end.y;
    let invCanvasEY = this.canvasSize.height - zBox.start.y;

    console.log('Inverted Canvas sy:' + invCanvasSY + ' ey:' + invCanvasEY + '.');

    let msy = this.mapInfo.bottomLeft.y + invCanvasSY * unitExtentY;
    let mey = this.mapInfo.bottomLeft.y + invCanvasEY * unitExtentY;

    //console.log('new map sy: ' + msy + ' new map ey: ' + mey + '.');

    let newMapInfo: IMapInfo = new MapInfo(new Point(msx, msy), new Point(mex, mey),
      this.mapInfo.maxInterations, this.mapInfo.iterationsPerStep);

    console.log('New MapInfo = ' + newMapInfo.toString());

    unitExtentX = (newMapInfo.topRight.x - newMapInfo.bottomLeft.x) / this.canvasSize.width;
    unitExtentY = (newMapInfo.topRight.y - newMapInfo.bottomLeft.y) / this.canvasSize.height;
    console.log('unit x: ' + unitExtentX + ' unit y' + unitExtentY);

    
    let ptr: number = 0;
    for (; ptr < this.workers.length; ptr++) {
      this.workers[ptr].terminate();
    }

    this.mapInfo = newMapInfo;
    this.buildWorkingData();
  }

  private round(x: number): number {
    const result: number = parseInt((x + 0.5).toString(), 10);

    return result;
  }

  // --- Zoom Box ----

  private static getMousePos(cce: HTMLCanvasElement, e: MouseEvent): IPoint {
    const clientRect = cce.getBoundingClientRect();

    const result: IPoint = new Point(e.clientX - clientRect.left, e.clientY - clientRect.top)

    return result;
  }

  onMousedown(that: MMapDisplayComponent, e: MouseEvent): void {
    let cce = that.canvasControlElement;
    let mousePos = MMapDisplayComponent.getMousePos(cce, e);

    if (e.shiftKey) {
      console.log('Zooming out.');
      that.zoomOut(mousePos);
      that.zoomBox = null;
    }
    else {
      if (that.zoomBox == null) {
        console.log('Just aquired the zoom box.');

        that.zoomBox = new Box(mousePos, new Point(0, 0));
        //that.oldX = e.clientX;
      }
      else {
        // The user must have let go of the down button after moving the mouse
        // outside of the canvas, and is now pressing the down button again -- to excute the zoom. 
        console.log('Already have box. Zooming');

        // Clear the control canvas.
        let ctx: CanvasRenderingContext2D = cce.getContext('2d');
        ctx.clearRect(0, 0, cce.width, cce.height);      

        that.zoomBox.end = mousePos;
        that.zoomIn(that.zoomBox);
        that.zoomBox = null;
      }
    }
  }

  onMouseMove(that: MMapDisplayComponent, e: MouseEvent): void {
    if (that.zoomBox != null) {

      let cce = that.canvasControlElement;
      let ctx: CanvasRenderingContext2D = cce.getContext('2d');

      ctx.lineWidth = 2;
      ctx.fillStyle = '#DD0031';

      // clear out old box first
      ctx.clearRect(0, 0, cce.width, cce.height);      

      // draw new box
      ctx.strokeStyle = '#FF3B03'; //'#FF0000'; // '#FF3B03';

      let mousePos = MMapDisplayComponent.getMousePos(cce, e);
      that.zoomBox.end = mousePos;

      //if (that.oldX - e.clientX > 20) {
      //  console.log('Moving - end = ' + e.clientX + ' ' + e.clientY + '.');
      //  that.oldX = e.clientX;
      //}

      ctx.strokeRect(that.zoomBox.start.x, that.zoomBox.start.y, that.zoomBox.width, that.zoomBox.height);
    }
  }

  onMouseUp(that: MMapDisplayComponent, e: MouseEvent): void {

    if (that.zoomBox == null) {
      // We are not in a "draw zoom box" mode.
      return;
    }

    console.log('Handling mouse up.');

    let cce = that.canvasControlElement;
    let ctx: CanvasRenderingContext2D = cce.getContext('2d');
    ctx.clearRect(0, 0, cce.width, cce.height);

    let mousePos = MMapDisplayComponent.getMousePos(cce, e);
    that.zoomBox.end = mousePos;
    that.zoomIn(that.zoomBox);

    that.zoomBox = null;




//  if(box != null ) {
//  // Zoom out?
//  if (e.shiftKey) {
//    box = null;
//    zoomOut(e);
//    return;
//  }

//  /*
//   * Cleaer entire canvas
//   */
//  var c = ccanvas.getContext('2d');
//  c.clearRect(0, 0, ccanvas.width, ccanvas.height);

//  /*
//   * Calculate new rectangle to render
//   */
//  var x = Math.min(box[0], box[2]) + Math.abs(box[0] - box[2]) / 2.0;
//  var y = Math.min(box[1], box[3]) + Math.abs(box[1] - box[3]) / 2.0;

//  var dx = (xRange[1] - xRange[0]) / (0.5 + (canvas.width - 1));
//  var dy = (yRange[1] - yRange[0]) / (0.5 + (canvas.height - 1));

//  x = xRange[0] + x * dx;
//  y = yRange[0] + y * dy;

//  lookAt = [x, y];

//  /*
//   * This whole code is such a mess ...
//   */

//  var xf = Math.abs(Math.abs(box[0] - box[2]) / canvas.width);
//  var yf = Math.abs(Math.abs(box[1] - box[3]) / canvas.height);

//  zoom[0] *= Math.max(xf, yf); // retain aspect ratio
//  zoom[1] *= Math.max(xf, yf);

//  box = null;
//  draw(getColorPicker(), getSamples());
//}

  }


}
