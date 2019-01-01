import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ColorSliderComponent } from './color-slider/color-slider.component';
import { ColorPaletteComponent } from './color-palette/color-palette.component';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.css']
})
export class ColorPickerComponent implements AfterViewInit {

  @ViewChild('slider')
  slider: ColorSliderComponent;

  @ViewChild('palette')
  palette: ColorPaletteComponent;

  public hue: string;

  @Input()
  public item: number;

  private _rgbaColor: string;

  @Input()
  set rgbaColor(rgbaColorVal: string) {
    this._rgbaColor = rgbaColorVal;
  }
  get rgbaColor(): string {
    return this._rgbaColor;
  }

  // Event listened to by our calling container.
  @Output()
  colorUpdated: EventEmitter<ColorItem> = new EventEmitter(true);

  // Handle the app-color-palette's colorUpdated event.
  onColorUpdated(colorVal: string) {
    this._rgbaColor = colorVal;
    this.colorUpdated.emit(new ColorItem(this.item, colorVal));
  }

  ngAfterViewInit(): void {
    console.log('The Color Picker is getting an initial hue value of ' + this.slider.selectedHue + '.');

    // The Slider component calculates the input Hue we
    // need only after it's ngAfterViewInit event is handled.
    // This component's ngAfterViewInit occurs after the Slider's since the Slider is our child.
    let hue = this.slider.selectedHue;

    this.palette.init(hue);
  }
}

export class ColorItem {
  constructor(public itemIdx: number, public rgbaColor: string) { }
}
