import { Component, AfterViewInit, ElementRef, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';

import {
  IPoint, Point, IBox, Box, ICanvasSize, CanvasSize, ColorMap, 
  IMapInfo, IMapWorkingData, MapWorkingData,
  WebWorkerImageDataResponse, WebWorkerMessage, WebWorkerStartRequest,
  WebWorkerIterateRequest, WebWorkerUpdateColorMapRequest,
  Histogram, WebWorkerHistogramRequest, WebWorkerHistorgramResponse,
  HistArrayPair,  RawMapDataProcessor, SCoords, SPoint, JOB_BLOCK_SIZE
} from '../m-map-common';

import { ColorMapUI, MapInfoWithColorMap } from '../m-map-common-ui';

import { MapSection, MapSectionResult, SMapWorkRequest, SCoordsWorkRequest, TransformType, HistogramRequest } from '../../m-map/m-map-common-server';
import { FracServerService } from '../../frac-server/frac-server.service';

enum WorkMethod {
  ForeGround = "ForeGround",
  WebWorkers = "WebWorkers",
  WebService = "WebService"
}

@Component({
  selector: 'app-m-map-display',
  templateUrl: './m-map.display.component.html',
  styleUrls: ['./m-map.display.component.css'],
  providers: [FracServerService]
})
export class MMapDisplayComponent implements AfterViewInit {

  @ViewChild('myCanvas') canvasRef: ElementRef;
  @ViewChild('myControlCanvas') canvasControlRef: ElementRef;
  @ViewChild('myHiddenCanvas') canvasHiddenRef: ElementRef;

  @Output() zoomed = new EventEmitter<SCoords>();
  @Output() haveImageData = new EventEmitter<Blob>();
  @Output() haveHistogram = new EventEmitter<Histogram>();
  @Output() buildingComplete = new EventEmitter();
  @Output() haveHistogramForEntireArea = new EventEmitter<Histogram>();

  private _mapInfo: IMapInfo;
  private _colorMap: ColorMapUI;

  private _histogram: Histogram;

  private viewInitialized: boolean;
  public canvasSize: ICanvasSize;

  private workMethod: WorkMethod;

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
  private _insideSubmitWebRequest: boolean;

  private zoomBox: IBox;

  private mapDataProcessor: RawMapDataProcessor;

  private _area: MapSection;
  @Input('area')
  set area(value: MapSection) {

    console.log('The area is being set. The value is ' + this.formatArea(value));

    if (!this.areAreasTheSame(this._area, value)) {
      console.log('Updating the area.');
      this._area = value;
      if (this._area !== null && this._mapInfo !== null && this.viewInitialized) {
        if (this._colorMap === null) {
          console.log('map-display is rebuilding because of an area update. The color map is null.');
        }
        else {
          console.log('map-display is rebuilding because of an area update. The color maps has ' + this._colorMap.ranges.length + ' ranges.');
        }

        let delRepo: boolean = false;
        this.buildWorkingData(delRepo);
      }
    }
  }

  get area(): MapSection {
    return this._area;
  }

  private formatArea(ms1: MapSection): string {
    if (ms1 === null) {
      return 'null';
    }
    else {
      return 'x:' + ms1.sectionAnchor.x + ', y:' + ms1.sectionAnchor.y + '.';
    }
  }

  private areAreasTheSame(ms1: MapSection, ms2: MapSection): boolean {
    if (ms1 === null) {
      if (ms2 === null) {
        return true;
      }
      else {
        return false;
      }
    }
    else {
      if (ms2 === null) {
        return false;
      }
      else {
        if (ms1.sectionAnchor.x !== ms2.sectionAnchor.x
          || ms1.sectionAnchor.y !== ms2.sectionAnchor.y
          || ms1.canvasSize.width != ms2.canvasSize.width
          || ms2.canvasSize.height != ms2.canvasSize.height
        ) {
          return false;
        }
        else {
          return true;
        }
      }
    }
  }

  @Input('mapInfoWithColorMap')
  set mapInfoWithColorMap(value: MapInfoWithColorMap) {

    let mapName: string = 'NoNameYet';

    if (value !== null && value.mapInfo !== null) mapName = value.mapInfo.name;
    console.log('Map Display is getting a new MapInfoWithColorMap. The name is ' + mapName + '.');

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
      console.log('The new mapinfo is null, we are not raising buildingComplete event.'); 
    }
    else {
      console.log('The new interation count is ' + mi.maxIterations + '.');

      // The new mapInfo has a value.
      // If we have existing map, rebuild.
      if (this._mapInfo === null) {
        // We have no working map, initialize our values and build one.

        if (cm === null) {
          console.log('map-display is rebuilding because we are initializing. The color map is null.');
        }
        else {
          console.log('map-display is rebuilding because we are initializing. The color maps has ' + cm.ranges.length + ' ranges.');
        }

        this._colorMap = cm;
        this._mapInfo = mi;
        if (mi !== null && this.viewInitialized) {
          let delRepo: boolean = false;
          this.buildWorkingData(delRepo);
        }
      }
      else {
        // The new mapInfo has a value, and we have a working map.
        if (this.workMethod === WorkMethod.WebService) {
          this.handleMiwcmChangesWebService(mi, cm);
        }
        if (this.workMethod === WorkMethod.WebWorkers || this.workMethod == WorkMethod.ForeGround) {
          this.handleMiwcmChangesWebWorker(mi, cm);
        }
      }
    }
  }

  private handleMiwcmChangesWebWorker(mi: IMapInfo, cm: ColorMapUI): void {
    if (!this._mapInfo.sCoords.isEqual(mi.sCoords)
      || this._mapInfo.threshold !== mi.threshold
      || this._mapInfo.maxIterations > mi.maxIterations // Reduction
      || (this._colorMap.serialNumber !== cm.serialNumber && this._mapInfo.maxIterations !== mi.maxIterations)) {
      // The coordinates have changed,
      // or we are reducing the number of iterations,
      // or we are increasing the number of iterations and we have a new color map, rebuild.
      this._colorMap = cm;
      this._mapInfo = mi;
      if (this.viewInitialized) {
        let delRepo: boolean = false;
        this.buildWorkingData(delRepo);
      }
    }
    else {
      if (this._colorMap.serialNumber !== cm.serialNumber) {
        console.log('map-display found the colormap serial #s to be different.');
        // We would not be here if we have an updated maxIterations.
        this._mapInfo.iterationsPerStep = mi.iterationsPerStep;
        this._colorMap = cm;
        if (this.viewInitialized) {
          this.updateWorkersColorMap();
        }
      }
      else {
        console.log('map-display found the colormap serial #s to be the same.');
        if (this._mapInfo.maxIterations !== mi.maxIterations) {
          this._mapInfo.iterationsPerStep = mi.iterationsPerStep;
          this._mapInfo.maxIterations = mi.maxIterations;
          this.doMoreIterations(mi.maxIterations);
        }
        else {
          console.log('map-display found no change in the mapinfo or color map.');
        }
      }
    }
  }

  private handleMiwcmChangesWebService(mi: IMapInfo, cm: ColorMapUI): void {
    if (!this._mapInfo.sCoords.isEqual(mi.sCoords)
      || this._mapInfo.maxIterations > mi.maxIterations) {
      // Decreasing the iteration count.
      this._colorMap = cm;
      this._mapInfo = mi;
      if (this.viewInitialized) {
        console.log('map-display is rebuilding and deleting the Counts Repo, because we have new coords.');

        let delRepo: boolean = true;
        this.buildWorkingData(delRepo);
      }
      return
    }
    else {
      if (this._mapInfo.maxIterations < mi.maxIterations) {
        // Increasing the iteration count.
        console.log('map-display is rebuilding because we are increasing the iteration count.');
        this._mapInfo.maxIterations = mi.maxIterations;
        this._colorMap = cm;
        let delRepo: boolean = false;
        this.buildWorkingData(delRepo);
      }
      else {
        if (this._colorMap.serialNumber !== cm.serialNumber) {
          //  Updating the color map.
          console.log('map-display is replaying because we have a new color map.');

          this._colorMap = cm;
          this.submitMapReplayRequest();
        }
        else {
          console.log('map-display found no change in the mapinfo or color map.');
        }
      }
    }
  }

  @Input('allowZoom') allowZoom: boolean;

  private _overLayBox: IBox;
  @Input('overLayBox')
  set overLayBox(value: IBox) {
    this._overLayBox = value;
    if(this.viewInitialized)
      this.drawOverLayBox(value);
  }
  get overLayBox(): IBox {
    return this._overLayBox;
  }

  constructor(private fService: FracServerService) {
    console.log('m-map.display is being constructed.');

    this.viewInitialized = false;
    this._insideSubmitWebRequest = false;

    this._mapInfo = null;
    this._area = null;
    this._colorMap = null;

    this.workers = [];
    this.sections = [];

    // TODO: Make the numberOfSections an input.
    // Set the number of sections to 4 - because we have 4 logical processors.
    this.numberOfSections = 4;
    //this.workMethod = WorkMethod.WebWorkers;
    this.workMethod = WorkMethod.WebService;

    //// For simplicity, do not use Web Workers and use only one section.
    //this.numberOfSections = 1;
    //this.workMethod = WorkMethod.ForeGround;

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

    this.mapDataProcessor = null;
    //this.mapSectionResults = [];
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
    if (this.workMethod !== WorkMethod.WebService) {
      throw new Error('getHistogram is only supported when the workMethod is WebService.');
    }
    this.subHistogramRequest();
  }

  private getHistogramWebWorker(): void {

    this._histogram = null;
    this.resetSectionCompleteFlags();
    let histRequest = WebWorkerHistogramRequest.CreateRequest();

    let ptr: number;
    for (ptr = 0; ptr < this.workers.length; ptr++) {
      this.workers[ptr].postMessage(histRequest);
    }
  }

  private assembleHistorgram(arrayPair: HistArrayPair, sectionNumber: number): void {
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

  private drawEndNote(): void {
    //let ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext('2d');
    //ctx.fillStyle = '#DD0031';
    //ctx.clearRect(0, 0, this.canvasSize.width, 20);
    this.buildingComplete.emit();
  }

  private draw(imageData: ImageData, mapSection: MapSection): void {

    let canvasElement = this.canvasElement;

    let ctx: CanvasRenderingContext2D = canvasElement.getContext('2d');

    let cw: number = canvasElement.width;
    let ch: number = canvasElement.height;

    //console.log("Drawing on canvas with W = " + cw + " H = " + ch);

    if (cw !== this.canvasSize.width || ch !== this.canvasSize.height) {
      console.log('Draw detects that our canvas size has changed since intialization.')
    }

    // Check the image data's width to the canvas width for this section.
    if (imageData.width !== mapSection.canvasSize.width) {
      console.log('Draw is being called with ImageData whose width does not equal canvas width for section at left: ' + mapSection.sectionAnchor.x + 'and top: ' + mapSection.sectionAnchor.y + '.');
    }

    // Check the image data's height to the canvas height for this section.
    if (imageData.height !== mapSection.canvasSize.height) {
      console.log('Draw is being called with ImageData whose height does not equal the canvas height for section at left: ' + mapSection.sectionAnchor.x + 'and top: ' + mapSection.sectionAnchor.y + '.');
    }

    let left: number = mapSection.sectionAnchor.x;
    let bot: number = mapSection.sectionAnchor.y;

    ctx.fillStyle = '#DD0031';
    ctx.clearRect(left, bot, imageData.width, imageData.height);

    ctx.putImageData(imageData, left, bot);

    //console.log('Just drew image data for sn=' + sectionNumber + ' left=' + left + ' bot =' + bot  + '.');
  }

  private drawOverLayBox(oBox: IBox): void {

    if (oBox !== null) {

      let cce = this.canvasControlElement;
      //if (cce === undefined)
      //  return;

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

  private getOverLayRect(oBox: IBox, cs: ICanvasSize) : IBox {

    let result = oBox.scale(cs);
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

      this.drawOverLayBox(this.overLayBox);

      // Now that we know the size of our canvas,
      console.log("The initial canvas size is W = " + this.canvasSize.width + " H = " + this.canvasSize.height);
      if (this._mapInfo !== null) {
        if (this._colorMap === null) {
          console.log('map-display is rebuilding in after view init. The color map is null.');
        }
        else {
          console.log('map-display is rebuilding in after view init. The color maps has ' + this._colorMap.ranges.length + ' ranges.');
        }

        let delRepo: boolean = false;
        this.buildWorkingData(delRepo);
      }
    }
  }

  private buildWorkingData(deleteRepo: boolean): void {
    console.log('Building Working Data, deleteRepo = ' + deleteRepo + ' at ' + this.getDiagTime());

    this._buildingNewMap = true;
    this._histogram = null;
    this.resetSectionCompleteFlags();

    let regularColorMap: ColorMap;

    if (this.workMethod === WorkMethod.WebWorkers) {
      // Clear existing workers, if any
      this.terminateWorkers(this.workers);

      // Create a MapWorkingData for each section.
      regularColorMap = this._colorMap.getRegularColorMap();
      this.sections = MapWorkingData.getWorkingDataSections(this.canvasSize, this._mapInfo, regularColorMap, this.numberOfSections);

      //let ptr: number = 0;
      //for (ptr = 0; ptr < this.numberOfSections; ptr++) {
      //  console.log('Section Number: ' + ptr + ' bot=' + this.sections[ptr].sectionAnchor.y + '.');
      //}

      // initialized our workers array (this.workers)
      this.workers = this.initWebWorkers(this.sections);
    }
    else if (this.workMethod === WorkMethod.ForeGround) {
      if (this.numberOfSections !== 1) {
        //console.log('The number of sections must be set to 1, if useWorkers = false.');
        throw new RangeError('The number of sections must be set to 1, if useWorkers = false.');
      }

      regularColorMap = this._colorMap.getRegularColorMap();
      this.sections = new Array<IMapWorkingData>(1);
      this.sections[0] = new MapWorkingData(this.canvasSize, this._mapInfo, regularColorMap, new Point(0, 0));

      this.progressively();
    }
    else if (this.workMethod === WorkMethod.WebService) {

      if (this._insideSubmitWebRequest) return;

      this._insideSubmitWebRequest = true;
      //let deleteRepo: boolean = this._repoMode === 'delete' ? true : false;
      let dc1 = this.fService.cancelJob(deleteRepo);

      if (dc1 != null) {
        dc1.subscribe(resp => this.afterDelRequestComplete(resp));
      }
      else {
        console.log('Not clearing the canvas -- no current job.');
        this.submitMapWorkRequest();
      }
    }
    else {
      throw new Error("The work method is not recognized.");
    }
  }

  private afterDelRequestComplete(request: SMapWorkRequest) {
    
    console.log('Clearing the canvas -- we just cancelled the last job. The request is ' + request.name + '.');
    this.clearTheCanvas();
    this.submitMapWorkRequest();
  }

  private submitMapWorkRequest() {
    console.log('Submitting work request at ' + this.getDiagTime());

    let regularColorMap = this._colorMap.getRegularColorMap();

    this.mapDataProcessor = new RawMapDataProcessor(regularColorMap);

    let area: MapSection;
    let samplePoints: ICanvasSize;

    if (this._area === null) {
      area = new MapSection(new Point(0, 0), this.canvasSize.getWholeUnits(JOB_BLOCK_SIZE));
      samplePoints = this.canvasSize;
    }
    else {
      area = new MapSection(this._area.sectionAnchor, this.canvasSize.getWholeUnits(JOB_BLOCK_SIZE));
      samplePoints = this._area.canvasSize;
    }

    // Round the samplePoint up to the next whole blocksize.
    samplePoints = samplePoints.getWholeUnits(JOB_BLOCK_SIZE);
    samplePoints = samplePoints.mult(JOB_BLOCK_SIZE);

    let jobRequest: SMapWorkRequest = new SMapWorkRequest(this._mapInfo.name, this._mapInfo.sCoords, samplePoints, area, this._mapInfo.maxIterations);

    let cc = this.fService.submitJob(jobRequest);
    cc.subscribe(
      resp => this.useMapSectionResult(resp),
      err => console.log(err),
      () => this.webServiceMapWorkDone()
    );

    this._insideSubmitWebRequest = false;
  }

  private submitMapReplayRequest() {
    console.log('Submitting replay request at ' + this.getDiagTime());

    let regularColorMap = this._colorMap.getRegularColorMap();

    if (this.mapDataProcessor === null) {
      console.log('The MapDataProcessor is null on call to submit replay request.');
      this.mapDataProcessor = new RawMapDataProcessor(regularColorMap);
    }
    else {
      this.mapDataProcessor.colorMap = regularColorMap;
    }

    let area: MapSection;
    let samplePoints: ICanvasSize;

    let jobRequest: SMapWorkRequest = new SMapWorkRequest(this._mapInfo.name, this._mapInfo.sCoords, samplePoints, area, this._mapInfo.maxIterations);
    jobRequest.connectionId = 'replay';

    //this.clearTheCanvas();
    let replayObs = this.fService.submitReplayJob(jobRequest);
    if (replayObs !== null) {
      replayObs.subscribe(() => this.clearTheCanvas());
    }
  }

  private getDiagTime(): string {
    let dt = new Date();
    let result: string = dt.toLocaleTimeString() + ' ' + dt.getMilliseconds();

    return result;
  }

  private useMapSectionResult(ms: MapSectionResult): void {
    let pixelData = this.mapDataProcessor.getPixelData(ms.imageData, true);
    let imageData = new ImageData(pixelData, ms.mapSection.canvasSize.width, ms.mapSection.canvasSize.height);

    //this.mapSectionResults.push(ms);
    //console.log('About to draw map section for x:' + ms.mapSection.sectionAnchor.x + ' and y:' + ms.mapSection.sectionAnchor.y);
    this.draw(imageData, ms.mapSection);

    if (ms.jobId < 0) {
      this.webServiceMapWorkDone();
    }

    //let h = this.mapDataProcessor.Histogram;

    //console.log('The histogram has been assembled during useMapSectionResult.');
    //console.log('The historgram is ' + h + '.');
    //console.log('The Escape Velocity historgram is ' + this.mapDataProcessor.EscVelHist + '.');

    //this.haveHistogram.emit(h);
  }

  private webServiceMapWorkDone(): void {
    console.log("Web Service Map Work Request is complete.");

    this._buildingNewMap = false;
    this.drawEndNote();
    let h = this.mapDataProcessor.Histogram;

    //console.log('The histogram has been assembled at webServiceMapWorkDone.');
    //console.log('The historgram is ' + h + '.');
    //console.log('The Escape Velocity historgram is ' + this.mapDataProcessor.EscVelHist + '.');

    this.haveHistogram.emit(h);
  }

  private subHistogramRequest() {
    if (this._insideSubmitWebRequest) return;

    this._insideSubmitWebRequest = true;
    let histReqObs = this.fService.getEntireHistorgram();
    if(histReqObs !== null)
      histReqObs.subscribe(resp => this.histRequestComplete(resp));
  }

  private histRequestComplete(request: HistogramRequest) {
    console.log('Handling histRequestComplete the JobId is ' + request.jobId + '.');

    let result = Histogram.fromArrays(request.values, request.occurances);
    this.haveHistogramForEntireArea.emit(result);
    this._insideSubmitWebRequest = false;
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
  private initWebWorkers(sections: IMapWorkingData[]): Worker[] {

    let numberOfSections = sections.length;
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
          let ww = result[sectionNumber];

          //console.log('Received ' + plainMsg.messageKind + ' with section number = ' + sectionNumber + ' from a web worker.');

          let mapWorkingData: IMapWorkingData = sections[sectionNumber];
          let imageData: ImageData = updatedMapDataMsg.getImageData(mapWorkingData.canvasSize);
          let mapSection = new MapSection(mapWorkingData.sectionAnchor, mapWorkingData.canvasSize);

          let numberOfIterations = mapWorkingData.iterationCountForNextStep();
          if (numberOfIterations > 0) {
            let iterateRequest = WebWorkerIterateRequest.CreateRequest(numberOfIterations);
            //this.workers[sectionNumber].postMessage(iterateRequest);
            ww.postMessage(iterateRequest);

            mapWorkingData.curIterations += numberOfIterations;

            // Call draw after sending the request to get the next ImageData.
            this.draw(imageData, mapSection);
          }
          else {
            // Call draw for the last ImageDataResponse
            this.draw(imageData, mapSection);

            if (this._buildingNewMap) {
              // Request the histogram data for this section.
              let histRequest = WebWorkerHistogramRequest.CreateRequest();
              //this.workers[sectionNumber].postMessage(histRequest);
              ww.postMessage(histRequest);
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
      let mapWorkingData: IMapWorkingData = sections[ptr];
      let startRequestMsg = WebWorkerStartRequest.CreateRequest(mapWorkingData, ptr);
      webWorker.postMessage(startRequestMsg);

      let numberOfIterations = mapWorkingData.iterationCountForNextStep();
      if (numberOfIterations > 0) {
        let iterateRequest = WebWorkerIterateRequest.CreateRequest(numberOfIterations);
        webWorker.postMessage(iterateRequest);
        mapWorkingData.curIterations += numberOfIterations;
      }
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

  private updateWorkersColorMap(): void {
    console.log('m-map.display.component updating the image based on the new color map.');

    if (this.workMethod === WorkMethod.WebService) {
      //this.updateWebServiceColorMap();
      throw new Error('Cannot update workkers color map when the WorkMethod is WebService.');
    }
    else {
      //if (this._buildingNewMap) {
      //  //throw new RangeError('The buildingNewMap flag is true on call to updateWorkersColorMap.');
      //  console.log('The buildingNewMap flag is true on call to updateWorkersColorMap.');
      //}
      let regularColorMap = this._colorMap.getRegularColorMap();
      let upColorMapMsg = WebWorkerUpdateColorMapRequest.CreateRequest(regularColorMap);

      let ptr: number = 0;
      for (ptr = 0; ptr < this.numberOfSections; ptr++) {
        let webWorker = this.workers[ptr];
        webWorker.postMessage(upColorMapMsg);
      }
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

        let mapSection = new MapSection(new Point(0, 0), mapWorkinData.canvasSize);

        that.draw(imageData, mapSection);
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
    let coords = this._mapInfo.sCoords;

    //let newCoords = coords.getExpandedBox(50);
    this.requestZOutCoords(coords, this.canvasSize, 0.5);
    //this.zoomed.emit(newCoords);
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

    console.log('Original Zoom Box: ' + box.toString());
    console.log('Normalized Zoom Box: ' + nBox.toString());
    console.log('Proportioned Zoom Box: ' + zBox.toString());

    //console.log('Current MapInfo = ' + this.mapInfo.toString());
    //console.log('Canvas = w:' + this.canvasSize.width + ' h:' + this.canvasSize.height + '.');

    // Update the zoom box to use an origin at the bottom-left instead of the top-left.
    //let iSy = this.canvasSize.height - zBox.topRight.y;
    //let iEy = this.canvasSize.height - zBox.botLeft.y;
    //let zBoxInverted = new Box(new Point(zBox.botLeft.x, iSy), new Point(zBox.topRight.x, iEy));
    //this.requestZInCoords(this._mapInfo.coords, this.canvasSize, zBoxInverted);

    let upSideDownCoords = this._mapInfo.sCoords.getUpSideDown();

    // Round the canvas size up to the next whole blocksize.
    let samplePoints = this.canvasSize.getWholeUnits(JOB_BLOCK_SIZE);
    samplePoints = samplePoints.mult(JOB_BLOCK_SIZE);

    this.requestZInCoords(upSideDownCoords, samplePoints, zBox);
    //this.requestZInCoords(this._mapInfo.sCoords, this.canvasSize, zBox);


    ////TODO: sc.Use fService
    //let lcoords = Box.fromSCoords(this._mapInfo.coords);

    //let unitExtentX: number = (lcoords.topRight.x - lcoords.botLeft.x) / this.canvasSize.width;
    //let unitExtentY: number = (lcoords.topRight.y - lcoords.botLeft.y) / this.canvasSize.height;

    ////console.log('unit x: ' + unitExtentX + ' unit y' + unitExtentY);

    //let msx = lcoords.botLeft.x + zBox.botLeft.x * unitExtentX;
    //let mex = lcoords.botLeft.x + zBox.topRight.x * unitExtentX;
    ////console.log('new map sx: ' + msx + ' new map ex: ' + mex + '.');

    //// Canvas origin is the top, right -- map coordinate origin is the bottom, right.
    //// Invert the canvas coordinates.
    //let invCanvasSY = this.canvasSize.height - zBox.topRight.y;
    //let invCanvasEY = this.canvasSize.height - zBox.botLeft.y;

    ////console.log('Inverted Canvas sy:' + invCanvasSY + ' ey:' + invCanvasEY + '.');

    //let msy = lcoords.botLeft.y + invCanvasSY * unitExtentY;
    //let mey = lcoords.botLeft.y + invCanvasEY * unitExtentY;
    ////console.log('new map sy: ' + msy + ' new map ey: ' + mey + '.');

    //let coords: IBox = new Box(new Point(msx, msy), new Point(mex, mey));
    ////let newMapInfo: IMapInfo = new MapInfo(coords, this._mapInfo.maxIterations, this._mapInfo.iterationsPerStep, this._mapInfo.upsideDown);

    ////console.log('New MapInfo = ' + newMapInfo.toString());

    ////unitExtentX = (newMapInfo.topRight.x - newMapInfo.bottomLeft.x) / this.canvasSize.width;
    ////unitExtentY = (newMapInfo.topRight.y - newMapInfo.bottomLeft.y) / this.canvasSize.height;
    ////console.log('unit x: ' + unitExtentX + ' unit y' + unitExtentY);

    ////if (this.workMethod === WorkMethod.WebService) {
    ////  //this.cancelFServiceJob();
    ////}
    ////else {
    ////  let ptr: number = 0;
    ////  for (; ptr < this.workers.length; ptr++) {
    ////    this.workers[ptr].terminate();
    ////  }
    ////}

    ////this._mapInfo = newMapInfo;
    ////this.zoomed.emit(this._mapInfo.coords);
    //let sCoords = SCoords.fromBox(coords);
    //this.zoomed.emit(sCoords);
  }

  // The amount should be > 0 and < 1.
  private requestZOutCoords(curCoords: SCoords, canvasSize: ICanvasSize, amount: number) {

    if (amount == 0) {
      console.log('getNewCoords received an amount = 0, returning original coords with no transform.');
      return curCoords;
    }

    if (amount < 0 || amount > 1) {
      console.log('getNewCoords received an amount < 0 or > 1, using 0.5.');
      amount = 0.5;
    }

    let scaledIntAmount = Math.round(amount * 10000);

    let ms: MapSection = new MapSection(new Point(scaledIntAmount, 0), new CanvasSize(10, 10));
    let request: SCoordsWorkRequest = new SCoordsWorkRequest(TransformType.Out, curCoords, this.canvasSize, ms);
    let cc: Observable<SCoordsWorkRequest> = this.fService.submitCoordsTransformRequest(request);
    cc.subscribe(
      v => this.newZoomOutCoordsHandler(v),
      err => console.log('Received error while getting new ZOut coords. The error is ' + err + '.'),
      () => console.log('Request new ZOut Coords is complete.')
    );
  }

  private requestZInCoords(curCoords: SCoords, canvasSize: ICanvasSize, area: IBox) {

    let ms: MapSection = MapSection.fromBox(area);
    let request: SCoordsWorkRequest = new SCoordsWorkRequest(TransformType.In, curCoords, canvasSize, ms);
    let cc: Observable<SCoordsWorkRequest> = this.fService.submitCoordsTransformRequest(request);
    cc.subscribe(
      v => this.newZoomInCoordsHandler(v),
      err => console.log('Received error while getting new ZIn coords. The error is ' + err + '.'),
      () => console.log('Request new ZIn Coords is complete.')
    );
  }

  private newZoomInCoordsHandler(coordsResult: SCoordsWorkRequest) {
    if (coordsResult !== null) {
      let newCoords = SCoords.clone(coordsResult.coords);
      newCoords = newCoords.getUpSideDown();
      console.log('The new in coords has an sx = ' + newCoords.botLeft.x.toString() + '.');
      console.log('The new in coords has an ex = ' + newCoords.topRight.x.toString() + '.');
      console.log('The new in coords has an sy = ' + newCoords.botLeft.y.toString() + '.');
      console.log('The new in coords has an ey = ' + newCoords.topRight.y.toString() + '.');

      this.zoomed.emit(newCoords);
    }
    else {
      console.log('The new coords is null on handle ZIn results.');
    }
  }

  private newZoomOutCoordsHandler(coordsResult: SCoordsWorkRequest) {
    if (coordsResult !== null) {
      let newCoords = SCoords.clone(coordsResult.coords);
      console.log('The new out coords has an sx = ' + newCoords.botLeft.x.toString() + '.');
      console.log('The new out coords has an ex = ' + newCoords.topRight.x.toString() + '.');
      console.log('The new out coords has an sy = ' + newCoords.botLeft.y.toString() + '.');
      console.log('The new out coords has an ey = ' + newCoords.topRight.y.toString() + '.');

      this.zoomed.emit(newCoords);
    }
    else {
      console.log('The new coords is null on handle ZOut results.');
    }
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
