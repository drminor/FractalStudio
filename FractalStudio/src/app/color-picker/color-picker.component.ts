import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.css']
})
export class ColorPickerComponent {

  public hue: string;

  @Input()
  public item: number;

  private _rgbaColor: string;

  @Input()
  set rgbaColor(rgbaColorVal: string) {
    this._rgbaColor = rgbaColorVal;
    //this.colorUpdated.emit(new ColorItem(this.item, this._rgbaColor));
  }
  get rgbaColor(): string {
    return this._rgbaColor;
  }

  @Output()
  colorUpdated: EventEmitter<ColorItem> = new EventEmitter(true);

  onColorUpdated(colorVal: string) {
    this._rgbaColor = colorVal;
    this.colorUpdated.emit(new ColorItem(this.item, colorVal));
  }
}

export class ColorItem {
  constructor(public itemIdx: number, public rgbaColor: string) { }
}
