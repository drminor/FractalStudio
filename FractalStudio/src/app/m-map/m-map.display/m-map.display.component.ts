import { Component, AfterViewInit, ElementRef, ViewChild, Input, EventEmitter, Output } from '@angular/core';
//import { saveAs } from 'file-saver';

import {
  IPoint, Point, IBox, Box, ICanvasSize, CanvasSize,
  IMapInfo, MapInfo, IMapWorkingData, MapWorkingData,
  WebWorkerImageDataResponse, WebWorkerMessage, WebWorkerStartRequest, WebWorkerImageDataRequest,
  WebWorkerIterateRequest, WebWorkerUpdateColorMapRequest,
  ColorMap, ColorMapUI, ColorMapEntry, ColorMapUIEntry, ColorNumbers,
  Histogram, WebWorkerHistogramRequest, WebWorkerHistorgramResponse, HistArrayPair, MapInfoWithColorMap
} from '../m-map-common';

@Component({
  selector: 'app-m-map-display',
  templateUrl: './m-map.display.component.html',
  styleUrls: ['./m-map.display.component.css']
})
export class MMapDisplayComponent implements AfterViewInit {

  @ViewChild('myCanvas') canvasRef: ElementRef;
  @ViewChild('myControlCanvas') canvasControlRef: ElementRef;
  @ViewChild('myHiddenCanvas') canvasHiddenRef: ElementRef;

  @Output() zoomed = new EventEmitter<IBox>();
  @Output() haveImageData = new EventEmitter<Blob>();
  @Output() haveHistogram = new EventEmitter<Histogram>();
  @Output() buildingComplete = new EventEmitter();

  private _mapInfo: IMapInfo;
  private _colorMap: ColorMapUI;

  private _histogram: Histogram;

  private viewInitialized: boolean;
  private canvasSize: ICanvasSize;

  private useWorkers: boolean;

  // Array of WebWorkers
  private workers: Worker[];

  private numberOfSections: number;
  private sections: IMapWorkingData[];

  private canvasElement: HTMLCanvasElement;
  private canvasControlElement: HTMLCanvasElement;
  private canvasExportElement: HTMLCanvasElement;

  private _exportWorkers: Worker[];
  private _canvasSizeForExport: ICanvasSize;

  private _buildingNewMap: boolean;
  private _sectionCompleteFlags: boolean[];

  private zoomBox: IBox;

  @Input('mapInfoWithColorMap')
  set mapInfoWithColorMap(value: MapInfoWithColorMap) {

    console.log('Map Display is getting a new MapInfoWithColorMap.');

    let mi: IMapInfo;
    let cm: ColorMapUI;

    if (value === null) {
      mi = null;
      cm = null;
    }
    else {
      mi = value.mapInfo;
      cm = value.colorMapUi;
    }
    
    if (mi === null) {
      // Set our color map to the new value, unconditionally.
      this._colorMap = cm;

      if (this._mapInfo !== null) {
        // Set our mapInfo to null, if its not already null
        this._mapInfo = null;
        this.clearTheCanvas();
      }
      else {
        // Do nothing.
        //this.buildingComplete.emit();
      }
    }
    else {
      // The new mapInfo has a value.
      if (this._mapInfo === null) {
        // We have no working map, initialize our values and build one.
        this._colorMap = cm;
        this._mapInfo = mi;
        if (mi !== null && this.viewInitialized) {
          this.buildWorkingData();
        }
      }
      else {
        // The new mapInfo has a value, and we have a working map.
        if ((this._mapInfo.coords.isEqual(mi.coords))) {
          // The coordinates have not changed.
          this.iterationsPerStep = mi.iterationsPerStep;
          this.maxIterations = mi.maxIterations;

          // Request a color map update, only if the new colorMap is actually new.
          if (this._colorMap.serialNumber !== cm.serialNumber) {
            this._colorMap = cm;

            if (this.viewInitialized) {
              console.log('m-map.display.component is receiving an updated color map.');
              this.updateWorkersColorMap();
            }
          }
          else {
            // Do nothing.
          }
        }
        else {
          // We have a new set of coordinates, rebuild the map.
          this._colorMap = cm;
          this._mapInfo = mi;
          if (this.viewInitialized) {
            this.buildWorkingData();
          }
        }
      }
    }
  }

  set maxIterations(maxIters: number) {

    if (this.viewInitialized) {

      if (this._mapInfo.maxIterations < maxIters) {
        this._mapInfo.maxIterations = maxIters;
        console.log('The Maximum Iterations is being increased. Will perform the additional iterations. The new MapInfo is:' + this._mapInfo.toString());
        this.doMoreIterations(maxIters);
      }
      else if (this._mapInfo.maxIterations > maxIters) {
        this._mapInfo.maxIterations = maxIters;
        console.log('The Maximum Iterations is being decreased. Will rebuild the map. The new MapInfo is:' + this._mapInfo.toString());
        this.buildWorkingData();
      }
      else {
        console.log('The Maximum Iterations is being set to the same value it currently has. The new MapInfo is:' + this._mapInfo.toString());
      }
    }
    else {
      // The view is not ready, just save the new value.
      this._mapInfo.maxIterations = maxIters;
      console.log('The Maximum Iterations is being updated. The view has not been initialized. The new MapInfo is:' + this._mapInfo.toString());
    }
  }

  set iterationsPerStep(itersPerStep: number) {
    if (this._mapInfo.iterationsPerStep != itersPerStep) {
      this._mapInfo.iterationsPerStep = itersPerStep;
      console.log('The Iterations Per Step is being updated. The new MapInfo is:' + this._mapInfo.toString());
    }
  }

  @Input('allowZoom') allowZoom: boolean;

  private _overLayBox: IBox;
  @Input('overLayBox')
  set overLayBox(value: IBox) {
    this._overLayBox = value;
    this.drawOverLayBox(value);
  }
  get overLayBox(): IBox {
    return this._overLayBox;
  }

  constructor() {
    console.log('m-map.display is being constructed.');

    this.viewInitialized = false;

    this._mapInfo = null;
    this._colorMap = null;

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

    this._canvasSizeForExport = new CanvasSize(7200, 4800);
    //this._canvasSizeForExport = new CanvasSize(14400, 9600);

    this._sectionCompleteFlags = new Array<boolean>(this.numberOfSections);
    this.resetSectionCompleteFlags();

    this._histogram = null;
    this._buildingNewMap = false;

    this.allowZoom = true;
    this.overLayBox = null;
  }

  public getImageDataForExport(): void {
    console.log('getImageData has been called.');

    let canvas: HTMLCanvasElement = this.canvasExportElement;
    canvas.width = this._canvasSizeForExport.width;
    canvas.height = this._canvasSizeForExport.height;

    let regularColorMap = this._colorMap.getRegularColorMap();

    //let cs = new CanvasSize(14400, 9600);

    let localWorkingData = MapWorkingData.getWorkingDataSections(this._canvasSizeForExport, this._mapInfo, regularColorMap, this.numberOfSections);
    this.resetSectionCompleteFlags();
    this._exportWorkers = this.initWebWorkersForExport(localWorkingData, this._mapInfo.maxIterations);
  }

  public getHistogram(): void {

    this._histogram = null;
    this.resetSectionCompleteFlags();
    let histRequest = WebWorkerHistogramRequest.CreateRequest();

    let ptr: number;
    for (ptr = 0; ptr < this.workers.length; ptr++) {
      this.workers[ptr].postMessage(histRequest);
    }

  }

  assembleHistorgram(arrayPair: HistArrayPair, sectionNumber: number): void {

    if (this._histogram == null) {
      this._histogram = Histogram.fromHistArrayPair(arrayPair);
    }
    else {
      this._histogram.addFromArrayPair(arrayPair);
    }

    this._sectionCompleteFlags[sectionNumber] = true;

    if (this.haveAllSectionsCompleted()) {

      console.log('Setting the BuildingNewMap flag to false.');
      this._buildingNewMap = false;

      console.log('The histogram has been assembled.');
      //console.log('The historgram is ' + this._histogram + '.');
      this.haveHistogram.emit(this._histogram);
    }
  }

  drawEndNote(): void {
    //let ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext('2d');

    //ctx.fillStyle = '#DD0031';
    //ctx.clearRect(0, 0, this.canvasSize.width, 20);

    this.buildingComplete.emit();
  }

  draw(imageData: ImageData, sectionNumber: number): void {

    let canvasElement = this.canvasElement;

    let ctx: CanvasRenderingContext2D = canvasElement.getContext('2d');

    let cw: number = canvasElement.width;
    let ch: number = canvasElement.height;

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

    //if (this.overLayBox !== null) {
    //  this.drawOverLayBox(this.overLayBox);
    //}

    //console.log('Just drew image data for sn=' + sectionNumber + ' left=' + left + ' bot =' + bot  + '.');
  }

  private drawOverLayBox(oBox: IBox): void {

    if (oBox !== null) {

      let cce = this.canvasControlElement;
      let ctx: CanvasRenderingContext2D = cce.getContext('2d');

      ctx.lineWidth = 2;
      ctx.fillStyle = '#DD0031';

      // clear out old box first
      ctx.clearRect(0, 0, cce.width, cce.height);      

      let scaledBox = this.getOverLayRect(oBox, this.canvasSize);
      ctx.strokeStyle = '#0000FF'; // Blue
      ctx.strokeRect(scaledBox.botLeft.x, scaledBox.botLeft.y, scaledBox.width, scaledBox.height);
    }
  }

  private getOverLayRect(oBox: IBox, cs: ICanvasSize) {

    let result = oBox.getScaledBox(cs);
    return result;
  }

  private clearTheCanvas(): void {

    let canvasElement = this.canvasElement;

    let ctx: CanvasRenderingContext2D = canvasElement.getContext('2d');

    let cw: number = canvasElement.width;
    let ch: number = canvasElement.height;

    ctx.fillStyle = '#DD0031';
    ctx.clearRect(0, 0, cw, ch);
  }

  buildCanvasForExport(imageData: ImageData, mapWorkingData: IMapWorkingData, sectionNumber: number): void {

    let canvasElement = this.canvasExportElement;

    let ctx: CanvasRenderingContext2D = canvasElement.getContext('2d');

    let cw: number = canvasElement.width;
    let ch: number = canvasElement.height;

    if (cw !== this._canvasSizeForExport.width || ch !== this._canvasSizeForExport.height) {
      console.log("BuildCanvasForExport detects that the canvasExportElement's size has changed since intialization.");
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

    //console.log('BuildCanvasForExport just put image data for sn=' + sectionNumber + ' left=' + left + ' bot =' + bot  + '.');

    this._sectionCompleteFlags[sectionNumber] = true;

    if (this.haveAllSectionsCompleted()) {
      let that = this;
      canvasElement.toBlob(function (blob) { that.haveImageData.emit(blob); }, 'image/jpeg', 1);
      this.terminateWorkers(this._exportWorkers);
    }
  }

  private terminateWorkers(workers: Worker[]): void {
    let ptr: number = 0;
    for (; ptr < workers.length; ptr++) {
      workers[ptr].terminate();
    }
  }

  private resetSectionCompleteFlags(): void {
    let ptr: number = 0;
    for (; ptr < this.numberOfSections; ptr++) {
      this._sectionCompleteFlags[ptr] = false;
    }
  }

  private haveAllSectionsCompleted(): boolean {
    let ptr: number = 0;
    for (; ptr < this.numberOfSections; ptr++) {
      if (!this._sectionCompleteFlags[ptr])
        return false;
    }
    return true;
  }

  ngAfterViewInit() {
    if (!this.viewInitialized) {
      this.viewInitialized = true;
      console.log("Initializing the canvas size and building the Map Working Data here once because we are finally ready.");

      this.canvasElement = this.canvasRef.nativeElement as HTMLCanvasElement;
      this.canvasControlElement = this.canvasControlRef.nativeElement as HTMLCanvasElement;
      this.canvasExportElement = this.canvasHiddenRef.nativeElement as HTMLCanvasElement;

      // Get the size of our canvas.
      this.canvasSize = this.initMapDisplay(this.canvasElement);

      // Set our control canvas to be the same size.
      this.canvasControlElement.width = this.canvasSize.width;
      this.canvasControlElement.height = this.canvasSize.height;

      this.registerZoomEventHandlers(this.canvasControlElement);

      console.log("The initial canvas size is W = " + this.canvasSize.width + " H = " + this.canvasSize.height);

      // Now that we know the size of our canvas,

      if (this._mapInfo !== null) {
        this.buildWorkingData();
      }
    }
  }

  private buildWorkingData(): void {
    this._buildingNewMap = true;
    this._histogram = null;
    this.resetSectionCompleteFlags();

    let regularColorMap = this._colorMap.getRegularColorMap();

    if (this.useWorkers) {
      // Clear existing workers, if any
      this.terminateWorkers(this.workers);

      // Create a MapWorkingData for each section.
      this.sections = MapWorkingData.getWorkingDataSections(this.canvasSize, this._mapInfo, regularColorMap, this.numberOfSections);

      //let ptr: number = 0;
      //for (ptr = 0; ptr < this.numberOfSections; ptr++) {
      //  console.log('Section Number: ' + ptr + ' bot=' + this.sections[ptr].sectionAnchor.y + '.');
      //}

      // initialized our workers array (this.workers)
      this.workers = this.initWebWorkers(this.numberOfSections);
    }
    else {
      if (this.numberOfSections !== 1) {
        //console.log('The number of sections must be set to 1, if useWorkers = false.');
        throw new RangeError('The number of sections must be set to 1, if useWorkers = false.');
      }
      this.sections = new Array<IMapWorkingData>(1);
      this.sections[0] = new MapWorkingData(this.canvasSize, this._mapInfo, regularColorMap, new Point(0, 0));

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

          let numberOfIterations = mapWorkingData.iterationCountForNextStep();
          if (numberOfIterations > 0) {
            let iterateRequest = WebWorkerIterateRequest.CreateRequest(numberOfIterations);
            this.workers[sectionNumber].postMessage(iterateRequest);
            mapWorkingData.curIterations += numberOfIterations;

            // Call draw after sending the request to get the next ImageData.
            this.draw(imageData, sectionNumber);
          }
          else {
            // Call draw for the last ImageDataResponse
            this.draw(imageData, sectionNumber);

            if (this._buildingNewMap) {
              // Request the histogram data for this section.
              let histRequest = WebWorkerHistogramRequest.CreateRequest();
              this.workers[sectionNumber].postMessage(histRequest);
            }

            // And then draw the end note.
            this.drawEndNote();
            console.log("Done.");
          }
        }
        else if (plainMsg.messageKind === 'HistogramResults') {
          let histogramResponse = WebWorkerHistorgramResponse.FromEventData(evt.data);
          let sectionNumber: number = histogramResponse.sectionNumber;
          let arrayPair = histogramResponse.getHistArrayPair();

          this.assembleHistorgram(arrayPair, sectionNumber);
        }
        else if (plainMsg.messageKind === 'StartResponse') {
          //console.log('Received StartRespose from a web worker.');
        }
        else {
          console.log('Received message from a web worker, The message = ' + plainMsg.messageKind + '.');
        }
      });


      // Send the mapWorking data and color map to the Web Worker.
      let mapWorkingData: IMapWorkingData = this.sections[ptr];
      let startRequestMsg = WebWorkerStartRequest.CreateRequest(mapWorkingData, ptr);
      webWorker.postMessage(startRequestMsg);

      let iterateRequest = WebWorkerIterateRequest.CreateRequest(this._mapInfo.iterationsPerStep);
      webWorker.postMessage(iterateRequest);
      mapWorkingData.curIterations += this._mapInfo.iterationsPerStep;
    }

    return result;
  }



  private initWebWorkersForExport(workingMaps: IMapWorkingData[], iterCount: number): Worker[] {

    let numberOfSections = workingMaps.length;

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

          let mapWorkingData: IMapWorkingData = workingMaps[sectionNumber];
          let imageData: ImageData = updatedMapDataMsg.getImageData(mapWorkingData.canvasSize);
          //console.log('Got a image data with ' + imageData.data.length + ' elements long');
          this.buildCanvasForExport(imageData, mapWorkingData, sectionNumber);

        }
        else if (plainMsg.messageKind === 'StartResponse') {
          //console.log('Received StartRespose from a web worker.');
        }
        else {
          console.log('Received message from a web worker, The message = ' + plainMsg.messageKind + '.');
        }
      });

      // Send the mapWorking data and color map to the Web Worker.
      let mapWorkingData: IMapWorkingData = workingMaps[ptr];
      let startRequestMsg = WebWorkerStartRequest.CreateRequest(mapWorkingData, ptr);
      webWorker.postMessage(startRequestMsg);

      let iterateRequest = WebWorkerIterateRequest.CreateRequest(iterCount);
      webWorker.postMessage(iterateRequest);
      mapWorkingData.curIterations += iterCount;
    }

    return result;
  }

  private doMoreIterations(newMaxIters: number) {
    console.log('Doing more iterations.');
    this._buildingNewMap = true;
    this._histogram = null;
    this.resetSectionCompleteFlags();

    let ptr: number = 0;
    for (ptr = 0; ptr < this.numberOfSections; ptr++) {
      let webWorker = this.workers[ptr];
      let mapWorkingData = this.sections[ptr];

      mapWorkingData.mapInfo.maxIterations = newMaxIters;

      let numberOfIterations = mapWorkingData.iterationCountForNextStep();
      if (numberOfIterations > 0) {
        let iterateRequest = WebWorkerIterateRequest.CreateRequest(numberOfIterations);
        webWorker.postMessage(iterateRequest);
        mapWorkingData.curIterations += numberOfIterations;
      }
    }
  }

  private updateWorkersColorMap() {
    if (this._buildingNewMap) {
      throw new RangeError('The buildingNewMap flag is true on call to updateWorkersColorMap.');
    }
    let regularColorMap = this._colorMap.getRegularColorMap();
    let upColorMapMsg = WebWorkerUpdateColorMapRequest.CreateRequest(regularColorMap);

    let ptr: number = 0;
    for (ptr = 0; ptr < this.numberOfSections; ptr++) {
      let webWorker = this.workers[ptr];
      webWorker.postMessage(upColorMapMsg);
    }
  }

  private progressively(): void {
    console.log('Doing progresslvy');
    const that = this;
    let alive: boolean = true;

    let mapWorkinData: IMapWorkingData = that.sections[0];
    let iterCount = mapWorkinData.mapInfo.maxIterations;
    let itersPerStep = mapWorkinData.mapInfo.iterationsPerStep;
    const intId = setInterval(doOneAndDraw, 5);

    function doOneAndDraw() {
      if (iterCount > 0 && alive) {
        iterCount = iterCount - itersPerStep;

        alive = mapWorkinData.doIterationsForAll(itersPerStep);

        let pixelData: Uint8ClampedArray = mapWorkinData.getPixelData();

        //mapWorkinData.updateImageData(mapWorkinData.pixelData);
        let imageData = new ImageData(pixelData, mapWorkinData.canvasSize.width, mapWorkinData.canvasSize.height);

        that.draw(imageData, 0);
      } else {
        clearInterval(intId);

        let h = new Histogram();
        h.addVals(mapWorkinData.cnts);

        console.log('The histogram is ' + h + '.');
        that.haveHistogram.emit(h);
        that._buildingNewMap = false;

        that.drawEndNote();
        console.log("No WebWorkers -- Done.");
      }
    }
  }

  private zoomOut(pos: IPoint): void {
    this.zoomBox = null;
    let coords = this._mapInfo.coords;
    let newCoords = coords.getExpandedBox(50);
    this.zoomed.emit(newCoords);
  }

  private zoomIn(box: IBox): void {
    this.zoomBox = null;

    if (box.width < 2 || box.height < 2) {
      return;
    }
    // The new coordinates must have its width = 1.5 * its height, because our canvas has that aspect ratio.

    let nx: number;
    let ny: number;

    let nh: number;
    let nw: number;

    // Get a box where the start point is always in the lower, left.
    let nBox = box.getNormalizedBox();

    let rnBox = this.getIntegerBox(nBox);

    // Determine if the height or the width of the zoom box will be used to calculate the new coordinates.
    if (rnBox.width * 1.5 > rnBox.height) {
      // Using the width will result in the smallest change to the resulting dimensions, use it.
      //console.log('Using Width, adjusting height.');
      nw = rnBox.width;
      nh = this.round(rnBox.width / 1.5);
      nx = rnBox.botLeft.x;

      // Since we are changing the height, move the starting position 1/2 the distance of the change
      // this will center the new height around the old box's vertical extent.
      let vAdj = this.round((nh - rnBox.height) / 2);
      //console.log('Moving start y back by ' + vAdj + '.');
      ny = rnBox.botLeft.y - vAdj;
      //ny = nBox.start.y;
    }
    else {
      // Using the height will result in the smallest change to the resulting dimensions, use it.
      //console.log('Using height, adjusting width.');
      nw = this.round(rnBox.height * 1.5);
      nh = rnBox.height;
      ny = rnBox.botLeft.y;

      // Since we are changing the width, move the starting position 1/2 the distance of the change
      // this will center the new width around the old box's horizontal extent.
      let hAdj = this.round((nw - rnBox.width) / 2);
      //console.log('Moving start x back by ' + hAdj + '.');
      nx = rnBox.botLeft.x - hAdj;
      //nx = nBox.start.x;
    }

    let zBox = Box.fromPointExtent(new Point(nx, ny), nw, nh);

    let me = this.round(nh * 1.5) - nw;

    if (me > 1 || me < -1) {
      console.log('The new zoom box has the wrong aspect ratio.');
    }

    //console.log('Original Zoom Box: ' + box.toString());
    //console.log('Normalized Zoom Box: ' + nBox.toString());
    //console.log('Proportioned Zoom Box: ' + zBox.toString());

    //console.log('Current MapInfo = ' + this.mapInfo.toString());
    //console.log('Canvas = w:' + this.canvasSize.width + ' h:' + this.canvasSize.height + '.');

    let unitExtentX: number = (this._mapInfo.topRight.x - this._mapInfo.bottomLeft.x) / this.canvasSize.width;
    let unitExtentY: number = (this._mapInfo.topRight.y - this._mapInfo.bottomLeft.y) / this.canvasSize.height;

    //console.log('unit x: ' + unitExtentX + ' unit y' + unitExtentY);

    let msx = this._mapInfo.bottomLeft.x + zBox.botLeft.x * unitExtentX;
    let mex = this._mapInfo.bottomLeft.x + zBox.topRight.x * unitExtentX;
    //console.log('new map sx: ' + msx + ' new map ex: ' + mex + '.');

    // Canvas origin is the top, right -- map coordinate origin is the bottom, right.
    // Invert the canvas coordinates.
    let invCanvasSY = this.canvasSize.height - zBox.topRight.y;
    let invCanvasEY = this.canvasSize.height - zBox.botLeft.y;

    //console.log('Inverted Canvas sy:' + invCanvasSY + ' ey:' + invCanvasEY + '.');

    let msy = this._mapInfo.bottomLeft.y + invCanvasSY * unitExtentY;
    let mey = this._mapInfo.bottomLeft.y + invCanvasEY * unitExtentY;
    //console.log('new map sy: ' + msy + ' new map ey: ' + mey + '.');

    let coords: IBox = new Box(new Point(msx, msy), new Point(mex, mey));
    //let newMapInfo: IMapInfo = new MapInfo(coords, this._mapInfo.maxIterations, this._mapInfo.iterationsPerStep, this._mapInfo.upsideDown);

    //console.log('New MapInfo = ' + newMapInfo.toString());

    //unitExtentX = (newMapInfo.topRight.x - newMapInfo.bottomLeft.x) / this.canvasSize.width;
    //unitExtentY = (newMapInfo.topRight.y - newMapInfo.bottomLeft.y) / this.canvasSize.height;
    //console.log('unit x: ' + unitExtentX + ' unit y' + unitExtentY);
    
    let ptr: number = 0;
    for (; ptr < this.workers.length; ptr++) {
      this.workers[ptr].terminate();
    }

    //this._mapInfo = newMapInfo;
    //this.zoomed.emit(this._mapInfo.coords);
    this.zoomed.emit(coords);
  }

  private getIntegerBox(box: IBox): IBox {
    let result = new Box(new Point(this.round(box.botLeft.x), this.round(box.botLeft.y)), new Point(this.round(box.topRight.x), this.round(box.topRight.y)));
    return result;
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
    if (!this.allowZoom) return;
    if (this._mapInfo === null) return;

    let cce = that.canvasControlElement;
    let mousePos = MMapDisplayComponent.getMousePos(cce, e);

    if (e.shiftKey) {
      console.log('Zooming out.');
      that.zoomOut(mousePos);
      that.zoomBox = null;
    }
    else {
      if (that.zoomBox == null) {
        //console.log('Just aquired the zoom box.');

        that.zoomBox = new Box(mousePos, new Point(0, 0));
        //that.oldX = e.clientX;
      }
      else {
        // The user must have let go of the down button after moving the mouse
        // outside of the canvas, and is now pressing the down button again -- to excute the zoom. 
        //console.log('Already have box. Zooming');

        // Clear the control canvas.
        let ctx: CanvasRenderingContext2D = cce.getContext('2d');
        ctx.clearRect(0, 0, cce.width, cce.height);      

        that.zoomBox.topRight = mousePos;
        that.zoomIn(that.zoomBox);
        //that.zoomBox = null;
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
      that.zoomBox.topRight = mousePos;

      //let nBox = that.zoomBox.getNormalizedBox();
      //let nrBox = that.getIntegerBox(nBox);
      //that.zoomBox = nrBox;

      ctx.strokeRect(that.zoomBox.botLeft.x, that.zoomBox.botLeft.y, that.zoomBox.width, that.zoomBox.height);
      //ctx.strokeRect(nrBox.botLeft.x, nrBox.botLeft.y, nrBox.width, nrBox.height);

    }
  }

  onMouseUp(that: MMapDisplayComponent, e: MouseEvent): void {

    if (that.zoomBox == null) {
      // We are not in a "draw zoom box" mode.
      return;
    }

    //console.log('Handling mouse up.');

    let cce = that.canvasControlElement;
    let ctx: CanvasRenderingContext2D = cce.getContext('2d');
    ctx.clearRect(0, 0, cce.width, cce.height);

    let mousePos = MMapDisplayComponent.getMousePos(cce, e);
    that.zoomBox.topRight = mousePos;
    that.zoomIn(that.zoomBox);
    //that.zoomBox = null;
  }


}
