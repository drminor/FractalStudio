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

  public alive: boolean;

  private viewInitialized: boolean;
  private componentInitialized: boolean;
  private canvasSize: ICanvasSize;
  //private mapInfo: IMapInfo;

  // Array of WebWorkers
  private workers: Worker[];
  private numberOfSections: number;
  private sections: IMapWorkingData[];

  private useWorkers: boolean;
  //private iterationsPerStep: number;

  private colorMap: ColorMap;

  private box: IBox;
  private canvasElement: HTMLCanvasElement;


  constructor(private logger: Logger, private mService: MMapService) {
    this.componentInitialized = false;
    this.viewInitialized = false;
    console.log('m-map.display is being constructed.');

    //// Define our MapInfo -- will be provided as input soon.
    ////const bottomLeft: IPoint = new Point(-2, -1);
    ////const topRight: IPoint = new Point(1, 1);

    //const bottomLeft: IPoint = new Point(-0.45, 0.5);
    //const topRight: IPoint = new Point(0.3, 1);

    //const iterationsPerStep = 500;

    //const maxInterations = 500;
    //this.mapInfo = new MapInfo(bottomLeft, topRight, maxInterations, iterationsPerStep);

    this.colorMap = this.buildColorMap();

    this.workers = [];
    this.sections = [];

    // Set the number of sections to 4 - because we have 4 logical processors.
    this.numberOfSections = 4;
    this.useWorkers = true;

    //// For simplicity, do not use Web Workers and use only one section.
    //this.numberOfSections = 1;
    //this.useWorkers = false;

    this.box = null;
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
      // Get the size of our canvas.
      this.canvasSize = this.initMapDisplay(this.canvasElement);
      //this.registerZoomEventHandlers(this.canvasElement);

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
    //let ce: HTMLCanvasElement = canvasRef.nativeElement as HTMLCanvasElement;

    //const result: ICanvasSize = new CanvasSize(
    //  canvasRef.nativeElement.offsetWidth,
    //  canvasRef.nativeElement.offsetHeight
    //);

    //// Set the internal canvas's bitmap equal to the pixels on the screen. (Zoom = 1)
    //canvasRef.nativeElement.width = result.width;
    //canvasRef.nativeElement.height = result.height;

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

    //ce.addEventListener("mousedown", this.onMousedown);
    //ce.addEventListener("mousemove", this.onMouseMove);
    //ce.addEventListener("mouseup", this.onMouseUp);
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

          //this.draw(imageData, sectionNumber);

          if (mapWorkingData.curInterations < mapWorkingData.mapInfo.maxInterations) {

            let iterateRequest = WebWorkerIterateRequest.CreateRequest(mapWorkingData.mapInfo.iterationsPerStep);
            this.workers[sectionNumber].postMessage(iterateRequest);
            mapWorkingData.curInterations += mapWorkingData.mapInfo.iterationsPerStep;

            //let getImageDataRequest = WebWorkerImageDataRequest.CreateRequest();
            //this.workers[sectionNumber].postMessage(getImageDataRequest);

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

      //let upColorMapRequestMsg = WebWorkerUpdateColorMapRequest.CreateRequest(mapWorkingData.colorMap);
      //webWorker.postMessage(upColorMapRequestMsg);

      let iterateRequest = WebWorkerIterateRequest.CreateRequest(mapWorkingData.mapInfo.iterationsPerStep);
      webWorker.postMessage(iterateRequest);
      mapWorkingData.curInterations += mapWorkingData.mapInfo.iterationsPerStep;

      //let getImageDataRequest = WebWorkerImageDataRequest.CreateRequest();
      //webWorker.postMessage(getImageDataRequest);
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

  // --- Zoom Box ----

  //onMousedown(e: MouseEvent): void {
  //  if (this.box == null) {
  //    console.log('Just aquired the zoom box.');
  //    this.box = new Box(new Point(e.clientX, e.clientY), new Point(0, 0));
  //  }
  //  else {
  //    console.log('Already have box.');
  //  }
  //}

  //onMouseMove(e: MouseEvent): void {
  //  if (this.box != null) {
  //    let ctx: CanvasRenderingContext2D = this.canvasElement.getContext('2d');

  //    ctx.lineWidth = 1;

  //    // clear out old box first
  //    ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);

  //    // draw new box
  //    ctx.strokeStyle = '#FF3B03';

  //    this.box.end = new Point(e.clientX, e.clientY);

  //    ctx.strokeRect(this.box.start.x, this.box.start.y, this.box.width, this.box.height);
  //  }
  //}

  //onMouseUp(e: MouseEvent): void {
  //  this.box = null;

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

  //}


}
