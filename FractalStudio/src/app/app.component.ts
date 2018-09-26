import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Logger } from './logger.service';
import { MMapService } from './mMap/m-map.service';
import { IMapWorkingData, MapWorkingData } from './mMapCommon/m-map-common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit {
    ngOnInit(): void {
      console.log("We are inited.");
    }

  @ViewChild('myCanvas') canvasRef: ElementRef;

  title = 'FractalStudio';
  public rLen: number;
  public alive: boolean;

  private viewInitialized: boolean;
  private result: IMapWorkingData;

  constructor(private logger: Logger) {

    this.viewInitialized = false;

    this.rLen = 10;
    logger.log('Hey, pretty cool.');

    var mService = new MMapService();

    this.result = mService.createTestMapWD();

    this.alive = this.result.doInterations(10);


    //var flags: boolean[] = MapWorkingData.getFlagData(result);
    //this.rLen = flags.length;
  }

  draw(): void {
    let ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext('2d');

    ctx.fillStyle = '#DD0031';
    ctx.clearRect(0, 0, 100, 100);

    console.log("Got ctx.");

    let imgData: ImageData = ctx.getImageData(0, 0, 100, 100);
    console.log("Got image data.");

    //let iDataData: Uint8ClampedArray = imgData.data;

    this.result.updateImageData(imgData.data);
    console.log("Updated buffer data.");

    ctx.putImageData(imgData, 0, 0);
    console.log("Updated canvas.");

  }

  ngOnChanges() {
    if (!this.viewInitialized) return;
    this.draw();
  }

  ngAfterViewInit() {
    if (!this.viewInitialized) {
      this.viewInitialized = true;
      console.log("About to draw from AfterViewInit.");
      this.draw();
    }
  }

}
