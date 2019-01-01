import { Component, ViewChild, ElementRef, AfterViewInit, Input, Output, SimpleChanges, OnChanges, EventEmitter, HostListener } from '@angular/core';
import { ColorNumbers } from '../../m-map/ColorNumbers';


@Component({
  selector: 'app-color-palette',
  templateUrl: './color-palette.component.html',
  styleUrls: ['./color-palette.component.css']
})
export class ColorPaletteComponent implements OnChanges {

  // This is the color value that is being updated.
  @Input()
  initialColor: string // Uses the rgba format.

  // This is used to build the canvas's gradient.
  @Input()
  hue: string; // Uses the rgba format.

  @Output()
  colorUpdated: EventEmitter<string> = new EventEmitter(true);

  @ViewChild('canvas')
  canvas: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D;
  private mousedown: boolean;;
  private selectedPosition: Point;

  constructor() {
    this.hue = null;
    this.ctx = null;
    this.mousedown = false;
    this.selectedPosition = null;
  }

  public init(hue: string/*, color: string*/) {
    console.log('The initial hue is ' + hue + ' the initial color is ' + this.initialColor + '.');

    this.hue = hue;
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.draw(this.ctx, hue);

    this.selectedPosition = this.getPosFromColor(this.ctx, this.initialColor);
    this.drawSelector(this.ctx, this.selectedPosition);
  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes['hue']) {
      if (this.ctx === null) {
        return;
      }

      this.draw(this.ctx, this.hue);

      if (this.selectedPosition !== null) {
        this.drawSelector(this.ctx, this.selectedPosition);
        this.raiseColorUpdated(this.selectedPosition);
      }

    }
  }

  private draw(context: CanvasRenderingContext2D, rgbaColor: string) {

    const width = this.canvas.nativeElement.width;
    const height = this.canvas.nativeElement.height;

    this.ctx.fillStyle = rgbaColor || 'rgba(255,255,255,1)';
    this.ctx.fillRect(0, 0, width, height);

    const whiteGrad = this.ctx.createLinearGradient(0, 0, width, 0);
    whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
    whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');

    this.ctx.fillStyle = whiteGrad;
    this.ctx.fillRect(0, 0, width, height);

    const blackGrad = this.ctx.createLinearGradient(0, 0, 0, height);
    blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
    blackGrad.addColorStop(1, 'rgba(0,0,0,1)');

    this.ctx.fillStyle = blackGrad;
    this.ctx.fillRect(0, 0, width, height);
  }

  private drawSelector(context: CanvasRenderingContext2D, pos: Point) {
    this.ctx.strokeStyle = 'white';
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, 10, 0, 2 * Math.PI);
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
  }

  private getPosFromColor(context: CanvasRenderingContext2D, rgbaColor: string): Point {

    let cComps = ColorNumbers.getColorComponentsFromRgba(rgbaColor);

    // First find closest match from all the pixels along the right-hand side of our canvas
    let imageData = this.ctx.getImageData(context.canvas.width - 1, 0, 1, context.canvas.height).data;
    let y = ColorNumbers.get1DPos(imageData, cComps);

    let x: number;
    if (y > -1 && y < context.canvas.height) {
      // Next find closest match from the row found in the first step.
      imageData = this.ctx.getImageData(0, y, context.canvas.width, 1).data;
      x = ColorNumbers.get1DPos(imageData, cComps);
    }
    else {
      x = context.canvas.width - 10;
    }

    let result = new Point(x, y);

    return result;
  }

  
  //private get1DPos(imageData: Uint8ClampedArray, cComps: number[]): number {

  //  let result = 0;

  //  let minDiff = 1000;

  //  let ptr: number;
  //  for (ptr = 0; ptr < imageData.length; ptr += 4) {
  //    let curDiff = Math.abs(cComps[0] - imageData[ptr])
  //      + Math.abs(cComps[1] - imageData[ptr + 1])
  //      + Math.abs(cComps[2] - imageData[ptr + 2]);

  //    if (curDiff < minDiff) {
  //      minDiff = curDiff;
  //      result = ptr;
  //    }

  //  }

  //  result = result / 4;

  //  return result;
  //}

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(evt: MouseEvent) {
    this.mousedown = false;
  }

  onMouseDown(evt: MouseEvent) {
    this.mousedown = true;
    this.draw(this.ctx, this.hue);
    this.selectedPosition = new Point(evt.offsetX, evt.offsetY);
    this.drawSelector(this.ctx, this.selectedPosition);
    this.raiseColorUpdated(this.selectedPosition);
  }

  onMouseMove(evt: MouseEvent) {
    if (this.mousedown) {
      this.draw(this.ctx, this.hue);
      this.selectedPosition = new Point(evt.offsetX, evt.offsetY);
      this.drawSelector(this.ctx, this.selectedPosition);
      this.raiseColorUpdated(this.selectedPosition);
    }
  }

  private raiseColorUpdated(pos: Point) {
    const rgbaColor = this.getColorAtPosition(pos);
    this.colorUpdated.emit(rgbaColor);
  }

  getColorAtPosition(pos: Point) {
    const imageData = this.ctx.getImageData(pos.x, pos.y, 1, 1).data;
    return 'rgba(' + imageData[0] + ',' + imageData[1] + ',' + imageData[2] + ',1)';
  }
}

class Point {
  constructor(public x: number, public y: number) { }
}
