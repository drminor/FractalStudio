import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Logger } from '../logger.service';
import { IMapWorkingData, MapWorkingData } from '../mMapCommon/m-map-common';
import { MMapService } from './m-map.service';

@Component({
  selector: 'app-m-map',
  templateUrl: './m-map.component.html',
  styleUrls: ['./m-map.component.css']
})
export class MMapComponent implements AfterViewInit, OnInit {

  @ViewChild('myCanvas') canvasRef: ElementRef;

  public alive: boolean;

  private viewInitialized: boolean;
  private result: IMapWorkingData;

  constructor(private logger: Logger, private mService: MMapService) {
    this.viewInitialized = false;

    logger.log('Hey, this is the new Map Canvas Component.');

    // TODO: Fix me
    //this.mService = new MMapService();

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

  ngOnInit(): void {
    console.log("We are inited.");
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
