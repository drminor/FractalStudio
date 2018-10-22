import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input } from '@angular/core';
import { Logger } from '../../logger.service';

import {
  IPoint, Point, ICanvasSize, CanvasSize,
  IMapInfo, MapInfo, IMapWorkingData, MapWorkingData,
  IWebWorkerMapUpdateResponse, WebWorkerMapUpdateResponse, WebWorkerMessage, IWebWorkerMessage, WebWorkerStartRequest
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

  //@Input('canvas-width') canvasWidth: number;
  //@Input('canvas-height') canvasHeight: number;

  @ViewChild('myCanvas') canvasRef: ElementRef;

  public alive: boolean;

  private viewInitialized: boolean;
  private componentInitialized: boolean;
  private canvasSize: ICanvasSize;
  private mapInfo: IMapInfo;

  // Array of WebWorkers
  private workers: Worker[];
  private numberOfSections: number;
  private sections: IMapWorkingData[];

  private useWorkers: boolean;

  constructor(private logger: Logger, private mService: MMapService) {
    this.componentInitialized = false;
    this.viewInitialized = false;

    // Define our MapInfo -- will be provided as input soon.
    //const bottomLeft: IPoint = new Point(-2, -1);
    //const topRight: IPoint = new Point(1, 1);

    const bottomLeft: IPoint = new Point(-0.45, 0.5);
    const topRight: IPoint = new Point(0.3, 1);

    const maxInterations = 500;
    this.mapInfo = new MapInfo(bottomLeft, topRight, maxInterations);

    this.workers = [];
    this.sections = [];

    //// Set the number of sections to 4 - because we have 4 logical processors.
    //this.numberOfSections = 4;
    //this.useWorkers = true;

    // For simplicity, do not use Web Workers and use only one section.
    this.numberOfSections = 1;
    this.useWorkers = false;
  }

  draw(imageData: ImageData, sectionNumber: number): void {
    let ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext('2d');

    let cw: number = this.canvasRef.nativeElement.width;
    let ch: number = this.canvasRef.nativeElement.height;

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
      console.log("m-map-display.component is handling ngOnChanges -- the view has NOT been initialized.");
    }
    else {
      console.log("m-map-display.component is handling ngOnChanges -- the view has been initialized.");
    }
  }

  ngAfterViewInit() {
    if (!this.viewInitialized) {
      this.viewInitialized = true;
      console.log("Initializing the canvas size and building the Map Working Data here once because we are finally ready.");

      // Get the size of our canvas.
      this.canvasSize = this.initMapDisplay();
      console.log("The initial canvas size is W = " + this.canvasSize.width + " H = " + this.canvasSize.height);

      // Now that we know the size of our canvas,


      if (this.useWorkers) {
        // Create a MapWorkingData for each section.
        this.sections = MapWorkingData.getWorkingDataSections(this.canvasSize, this.mapInfo, this.numberOfSections);

        let ptr: number = 0;
        for (ptr = 0; ptr < 4; ptr++) {
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
        this.sections[0] = new MapWorkingData(this.canvasSize, this.mapInfo, new Point(0, 0));

        this.progresslvy();
      }
    }

  }

  private initMapDisplay(): ICanvasSize {

    // Set our canvas size = to the number of pixels actually used to display our canvas HTML element.
    const result: ICanvasSize = new CanvasSize(
      this.canvasRef.nativeElement.offsetWidth,
      this.canvasRef.nativeElement.offsetHeight
    );

    // Set the internal canvas's bitmap equal to the pixels on the screen. (Zoom = 1)
    this.canvasRef.nativeElement.width = result.width;
    this.canvasRef.nativeElement.height = result.height;

    return result;
  }

  // Worker stuff
  private initWebWorkers(numberOfSections: number): Worker[] {

    let result: Worker[] = new Array<Worker>(numberOfSections);

    let ptr: number = 0;

    for (ptr = 0; ptr < numberOfSections; ptr++) {
      let webWorker = new Worker('/assets/worker.js');
      result[ptr] = webWorker;

      webWorker.addEventListener("message", (evt) => {
        let plainMsg: IWebWorkerMessage = WebWorkerMessage.FromEventData(evt.data);
        if (plainMsg.messageKind === 'UpdatedMapData') {
          let updatedMapDataMsg = WebWorkerMapUpdateResponse.FromEventData(evt.data);
          let sectionNumber: number = updatedMapDataMsg.sectionNumber;

          //console.log('Received ' + plainMsg.messageKind + ' with section number = ' + sectionNumber + ' from a web worker.');

          let mapWorkingData: IMapWorkingData = this.sections[sectionNumber];
          let imageData: ImageData = updatedMapDataMsg.getImageData(mapWorkingData.canvasSize);

          this.draw(imageData, sectionNumber);

          if (mapWorkingData.curInterations++ < mapWorkingData.mapInfo.maxInterations) {
            this.workers[sectionNumber].postMessage('Iterate');
          }
        }
        else {
          console.log('Received message from a web worker, The message = ' + plainMsg.messageKind + '.');
        }
      });


      let mapWorkingData: IMapWorkingData = this.sections[ptr];

      let startRequestMsg = WebWorkerStartRequest.ForStart(mapWorkingData, ptr);

      webWorker.postMessage(startRequestMsg);

      this.sections[ptr].curInterations++;
      webWorker.postMessage("Iterate");
    }

    return result;
  }

  private progresslvy(): void {

    const that = this;
    let alive: boolean = true;

    let iterCount = this.sections[0].mapInfo.maxInterations;
    const intId = setInterval(doOneAndDraw, 5);

    function doOneAndDraw() {
      if (iterCount > 0 && alive) {
        iterCount--;

        let mapWorkinData: IMapWorkingData = that.sections[0];

        alive = mapWorkinData.doInterationsForAll(1);

        let imageData: ImageData = mapWorkinData.getImageData();
        that.draw(imageData, 0);
      } else {
        clearInterval(intId);
      }
    }
  }

}
