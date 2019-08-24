import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import {
  IPoint, Point, IBox, Box, ICanvasSize, CanvasSize } from '../../m-map/m-map-common';

@Component({
  selector: 'app-base-canvas',
  templateUrl: './base-canvas.component.html',
  styleUrls: ['./base-canvas.component.css']
})
export class BaseCanvasComponent implements AfterViewInit {

  @ViewChild('myCanvas') canvasRef: ElementRef;

  private viewInitialized: boolean;
  private canvasSize: ICanvasSize;

  private canvasElement: HTMLCanvasElement;

  public imgData: ImageData;

  constructor() {
    this.viewInitialized = false;
    this.imgData = null;
  }

  public draw(imgData: ImageData): void {
    let canvasElement = this.canvasElement;

    let ctx: CanvasRenderingContext2D = canvasElement.getContext('2d');

    let cw: number = canvasElement.width;
    let ch: number = canvasElement.height;

    //console.log("Drawing on canvas with W = " + cw + " H = " + ch);

    if (cw !== this.canvasSize.width || ch !== this.canvasSize.height) {
      console.log('Draw detects that our canvas size has changed since intialization.')
    }

    let left = 0;
    let bot = 0;

    ctx.fillStyle = '#DD0031';
    ctx.clearRect(left, bot, imgData.width, imgData.height);

    ctx.putImageData(imgData, left, bot);
  }

  ngAfterViewInit(): void {
    if (!this.viewInitialized) {
      this.viewInitialized = true;
      console.log("Initializing the canvas size here once because we are finally ready.");

      this.canvasElement = this.canvasRef.nativeElement as HTMLCanvasElement;

      // Get the size of our canvas.
      this.canvasSize = this.initDisplay(this.canvasElement);
      this.imgData = this.allocateCanvas();
      this.clearCanvas();
    }
  }

  private initDisplay(ce: HTMLCanvasElement): ICanvasSize {

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

  private allocateCanvas(): ImageData {
    let pixData = new Uint8ClampedArray(4 * this.canvasSize.width * this.canvasSize.height);
    let imgData = new ImageData(pixData, this.canvasSize.width, this.canvasSize.height);
    return imgData;
  }

  public clearCanvas(): void {
    let ar: Uint8ClampedArray = this.imgData.data;
    let w = this.imgData.width;
    let h = this.imgData.height;

    let rPtr: number;
    for (rPtr = 0; rPtr < h; rPtr++) {

      let cPtr: number;
      for (cPtr = 0; cPtr < w; cPtr++) {
        let ptr = 4 * (rPtr * w + cPtr);

        ar[ptr] = 0;
        ar[ptr + 1] = 0;
        ar[ptr + 2] = 0;
        ar[ptr + 3] = 255;
      }
    }
  }

}
