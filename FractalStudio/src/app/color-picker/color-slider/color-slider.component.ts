import { Component, ViewChild, ElementRef, AfterViewInit, Output, HostListener, EventEmitter, Input } from '@angular/core';
import { ColorNumbers } from '../../m-map/ColorNumbers';


@Component({
  selector: 'app-color-slider',
  templateUrl: './color-slider.component.html',
  styleUrls: ['./color-slider.component.css']
})
export class ColorSliderComponent implements AfterViewInit {

  public selectedHue: string;

  @Input('initialColor')
  initialRgbaColor: string; // Uses the rgba format.

  @ViewChild('canvas')
  canvas: ElementRef<HTMLCanvasElement>;

  @Output()
  hueUpdated: EventEmitter<string> = new EventEmitter();

  private ctx: CanvasRenderingContext2D;
  private mousedown: boolean = false;
  //private selectedHeight: number;

  private gradient: CanvasGradient;

  ngAfterViewInit() {
    console.log('The initial color is ' + this.initialRgbaColor + '.');
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.gradient = this.buildGradient(this.ctx);
    this.draw(this.ctx, this.gradient);

    let pos = this.getPos(this.ctx, this.initialRgbaColor);
    this.selectedHue = this.getColorAtPosition(1, pos);

    this.drawSelector(this.ctx, pos);
  }

  private buildGradient(context: CanvasRenderingContext2D): CanvasGradient {

    const gradient = context.createLinearGradient(0, 0, 0, context.canvas.height);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 1)');
    gradient.addColorStop(0.167, 'rgba(255, 255, 0, 1)');
    gradient.addColorStop(0.334, 'rgba(0, 255, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 255, 1)');
    gradient.addColorStop(0.667, 'rgba(0, 0, 255, 1)');
    gradient.addColorStop(0.833, 'rgba(255, 0, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 1)');

    return gradient;
  }

  draw(context: CanvasRenderingContext2D, gradient: CanvasGradient) {

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    context.beginPath();
    context.rect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = gradient;
    context.fill();
    context.closePath();
  }

  private drawSelector(context: CanvasRenderingContext2D, pos: number) {

    context.beginPath();
    context.strokeStyle = 'white';
    context.lineWidth = 5;
    context.rect(0, pos - 5, context.canvas.width, 10);
    context.stroke();
    context.closePath();
  }

  //private getPos(context: CanvasRenderingContext2D, rgbaColor: string): number {

  //  let result = 0;

  //  let minDiff = 1000;

  //  let cComps = ColorNumbers.getColorComponentsFromRgba(rgbaColor);

  //  const imageData = this.ctx.getImageData(0, 0, 1, context.canvas.height).data;

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

  private getPos(context: CanvasRenderingContext2D, rgbaColor: string): number {

    let cComps = ColorNumbers.getColorComponentsFromRgba(rgbaColor);
    const imageData = this.ctx.getImageData(0, 0, 1, context.canvas.height).data;
    let result = ColorNumbers.get1DPos(imageData, cComps);

    return result;
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(evt: MouseEvent) {
    this.mousedown = false;
  }

  onMouseDown(evt: MouseEvent) {
    this.mousedown = true;
    //this.selectedHeight = evt.offsetY;
    this.draw(this.ctx, this.gradient);
    this.drawSelector(this.ctx, evt.offsetY);
    this.raiseHueUpdatedEvent(evt.offsetX, evt.offsetY);
  }

  onMouseMove(evt: MouseEvent) {
    if (this.mousedown) {
      //this.selectedHeight = evt.offsetY;
      this.draw(this.ctx, this.gradient);
      this.drawSelector(this.ctx, evt.offsetY);
      console.log('slider is raising the updatedHue event.');
      this.raiseHueUpdatedEvent(evt.offsetX, evt.offsetY);
    }
  }

  private raiseHueUpdatedEvent(x: number, y: number): void {
    this.selectedHue = this.getColorAtPosition(x, y);
    this.hueUpdated.emit(this.selectedHue);
  }

  getColorAtPosition(x: number, y: number) {
    const imageData = this.ctx.getImageData(x, y, 1, 1).data;
    return 'rgba(' + imageData[0] + ',' + imageData[1] + ',' + imageData[2] + ',1)';
  }
}
