import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { ColorMap, ColorMapEntry } from '../m-map-common';
import { FormGroup, FormControl, FormArray, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-color-map-editor',
  templateUrl: './color-map-editor.component.html',
  styleUrls: ['./color-map-editor.component.css']
})
export class ColorMapEditorComponent {

  _colorMap: ColorMap;

  @Input('colorMap')
  set colorMap(colorMap: ColorMap) {
    this._colorMap = colorMap;
    console.log("The color map editor's color map is being set.");
    let colorMapEntryForms: FormGroup[] = this.buildColorMapEntryForms(this._colorMap.ranges);
    this.updateForm(colorMapEntryForms);
  }

  @Output() colorMapUpdated = new EventEmitter<ColorMap>();

  // Define our Form. It has a single item which is an array of CEntryForms
  colorMapForm: FormGroup;
  colorEntryForms: FormArray;

  constructor() {

    this.colorMapForm = new FormGroup({
      highColor: new FormControl(''),
      cEntries: new FormArray([])
    });

    this.colorEntryForms = new FormArray([]); // this.colorEntriesForm.controls.cEntries as FormArray;
  }

  getColorBlockStyle(idx: number): object {
    let cEntry: ColorMapEntry = this.getColorMapEntry(idx);
    //let result = ColorBlockStyle.getStyle(20, cEntry.colorNum);
    let result = ColorBlockStyle.getStyle(20, idx);

    return result;
  }

  //onEditColor(ev: MouseEvent, idx:number) {
    onEditColor(idx: number) {
    console.log('Got onEditColor' + 'for item ' + idx + '.');
  }

  onSubmit() {
    let colorMap = this.getColorMap(this.colorMapForm);
    console.log('The color map editor is handling form submit.'); // The stack now has ' + this.history.length + ' items.');

    this.colorMapUpdated.emit(colorMap);
  }

  private updateForm(colorEntryForms: FormGroup[]): void {

    let ourFormsCEntries: FormArray = this.colorMapForm.controls.cEntries as FormArray;
    let highColor: number = this.colorMapForm.controls.highColor.value;

    // Clear the cEntries FormArray
    ourFormsCEntries.controls = [];

    let ptr: number;
    for (ptr = 0; ptr < colorEntryForms.length; ptr++) {
      ourFormsCEntries.controls.push(colorEntryForms[ptr]);
    }

    // Set the form's highColor value.
    this.colorMapForm.controls.highColor.setValue(highColor);
  }

  // --- ColorMapEntry to/from  FormGroup methods

  private buildColorMapEntryForms(colorMapEntries: ColorMapEntry[]): FormGroup[] {

    let result: FormGroup[] = [];

    let ptr: number;
    for (ptr = 0; ptr < this._colorMap.ranges.length; ptr++) {
      result.push(this.buildAColorMapEntryForm(this._colorMap.ranges[ptr]));
    }

    return result;
  }

  private getColorMap(frm: FormGroup): ColorMap {

    let ourFormsCEntries: FormArray = this.colorMapForm.controls.cEntries as FormArray;

    let ranges: ColorMapEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < ourFormsCEntries.controls.length; ptr++) {
      //let cfg: FormGroup = ourFormsCEntries.controls[ptr] as FormGroup;
      //ranges.push(new ColorMapEntry(cfg.controls.cutOff.value, cfg.controls.cNum.value));
      ranges.push(this.getColorMapEntry(ptr));
    }

    let highColor: number = frm.controls.highColor.value;

    let result: ColorMap = new ColorMap(ranges, highColor);

    return result;
  }

  private getColorMapEntry(idx: number): ColorMapEntry {
    const cfg: FormGroup = (this.colorMapForm.controls.cEntries as FormArray).controls[idx] as FormGroup;

    const result = new ColorMapEntry(cfg.controls.cutOff.value, cfg.controls.cNum.value);
    return result;
  }

  private buildAColorMapEntryForm(cme: ColorMapEntry): FormGroup {
    let result: FormGroup;

    if (cme == null) {
      result = new FormGroup({
        cutOff: new FormControl(''),
        cNum: new FormControl('')
      });
    }
    else {
      result = new FormGroup({
        cutOff: new FormControl(cme.cutOff),
        cNum: new FormControl(cme.colorNum)
      });
    }

    return result;
  }
}

// -- Style Support
export class ColorBlockStyle {

  public static getStyle(height: number, cNum: number): object {

    let strColorVal: string;

    if (cNum % 2 === 0) {
      strColorVal = 'blue';
    }
    else {
      strColorVal = 'red';
    }

    let result = {
      'position': 'absolute',
      'width': '100%',
      'height': '100%',
      'background-color': strColorVal
    }

    return result;

  }

}
