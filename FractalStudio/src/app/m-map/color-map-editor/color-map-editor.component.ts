import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ColorMapUIEntry, ColorMapUI, IColorMap } from '../m-map-common';
import { FormGroup, FormControl, FormArray } from '@angular/forms';

@Component({
  selector: 'app-color-map-editor',
  templateUrl: './color-map-editor.component.html',
  styleUrls: ['./color-map-editor.component.css']
})
export class ColorMapEditorComponent {

  _colorMap: ColorMapUI;

  @Input('colorMap')
  set colorMap(colorMap: ColorMapUI) {
    console.log("The color map editor's color map is being set.");

    this._colorMap = colorMap;
    this.updateForm(colorMap);
  }

  @Output() colorMapUpdated = new EventEmitter<IColorMap>();

  colorMapForm: FormGroup;

  // Our managed list of ColorMapEntryForms
  cEntryForms: ColorMapEntryFormCollection;

  constructor() {

    // Define our Form. It has a single item which is an array of CEntryForms
    this.colorMapForm = new FormGroup({
      highColor: new FormControl(''),
      cEntries: new FormArray([])
    });

    // Initialize our managed list of color map entry forms and bind it to our form's cEntries FormArray.
    this.cEntryForms = new ColorMapEntryFormCollection(this.colorMapForm.controls.cEntries as FormArray);
  }

  getColorBlockStyle(idx: number): object {
    let cEntry: ColorMapUIEntry = this.getColorMapEntry(idx);
    let result = ColorBlockStyle.getStyle(cEntry.rgbHex);
    return result;
  }

  onEditColor(idx: number) {
    console.log('Got onEditColor' + 'for item ' + idx + '.');
    this.toggleShowEditor(idx);
  }

  onSubmit() {
    let colorMap = this.getColorMap(this.colorMapForm);
    console.log('The color map editor is handling form submit.'); 
    this.colorMapUpdated.emit(colorMap);
  }

  private toggleShowEditor(idx: number): void {
    let cfg = this.getCEntryFromGroup(idx);
    if (cfg.controls.showEditor.enabled) {
      cfg.controls.showEditor.disable();
    }
    else {
      cfg.controls.showEditor.enable();
    }
  }

  private getCEntryFromGroup(idx: number): FormGroup {
    let ourFormsCEntries: FormArray = this.colorMapForm.controls.cEntries as FormArray;
    let result: FormGroup = ourFormsCEntries.controls[idx] as FormGroup;
    return result;
  }

  private updateForm(colorMap: ColorMapUI): void {

    this.cEntryForms.cEntries = colorMap.uIRanges;

    // Set the form's highColor value.
    this.colorMapForm.controls.highColor.setValue(colorMap.highColor);
  }

  // --- ColorMapEntry to/from  FormGroup methods


  private getColorMap(frm: FormGroup): IColorMap {

    let ourFormsCEntries: FormArray = this.colorMapForm.controls.cEntries as FormArray;

    let ranges: ColorMapUIEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < ourFormsCEntries.controls.length; ptr++) {
      ranges.push(this.getColorMapEntry(ptr));
    }

    //let ranges: ColorMapUIEntry[] = this.cEntryForms.cEntries; 

    let highColor: number = frm.controls.highColor.value;

    let result: ColorMapUI = new ColorMapUI(ranges, highColor);

    return result;
  }

  private getColorMapEntry(idx: number): ColorMapUIEntry {
    const cfg: FormGroup = (this.colorMapForm.controls.cEntries as FormArray).controls[idx] as FormGroup;

    const result = ColorMapUIEntry.fromOffsetAndColorNum(cfg.controls.cutOff.value, cfg.controls.cNum.value);
    return result;
  }
}

class ColorMapEntryFormCollection {

  private _fArray: FormArray;
  private _cEntries: ColorMapUIEntry[];
  private _cmeForms: ColorMapEntryForm[];

  constructor(fArray: FormArray) {

    //if (fArray == null || fArray.length != 0) {
    //  throw new Error('The fArray must be non-null and contain 0 elements.');
    //}

    // hold a reference to the form's FormArray.
    this._fArray = fArray;

    this._cEntries = [];
    this._cmeForms = [];
  }

  public get cEntries(): ColorMapUIEntry[] {
    return this._cEntries;
  }

  public set cEntries(colorMapUIEntries: ColorMapUIEntry[]) {

    // clear the existing contents of the FormArray
    // and our forms.
    this.clear();

    let ptr: number;
    for (ptr = 0; ptr < colorMapUIEntries.length; ptr++) {
      let cme = new ColorMapEntryForm(colorMapUIEntries[ptr]);

      this._cmeForms.push(new ColorMapEntryForm(colorMapUIEntries[ptr]));
      this._fArray.controls.push(cme.form);
    }

    this._cEntries = colorMapUIEntries;
  }

  public clear(): void {
    this._fArray.controls = [];
    this._cEntries = [];
    this._cmeForms = [];
  }
}

class ColorMapEntryForm {

  public form: FormGroup;

  constructor(public cme: ColorMapUIEntry) {
    this.form = this.buildForm(cme);
  }

  public dispose(): void {
    // Place holder for now.
  }

  private buildForm(cme: ColorMapUIEntry): FormGroup {

    let result = new FormGroup({
      cutOff: new FormControl(''),
      cNum: new FormControl(''),

      showEditor: new FormControl(''),
      r: new FormControl(''),
      g: new FormControl(''),
      b: new FormControl('')
    });

    result.controls.showEditor.disable();

    //let x = result.controls.r.valueChanges.subscribe();

    if (cme != null) {
      result.controls.cutOff.setValue(cme.cutOff);
      result.controls.cNum.setValue(cme.colorNum);
      result.controls.r.setValue(cme.r);
      result.controls.g.setValue(cme.g);
      result.controls.b.setValue(cme.b);

      //result.controls.cNum.
    }

    return result;
  }


}

// -- Style Support
export class ColorBlockStyle {

  public static getStyle(rgbHex: string): object {

    let result = {
      'position': 'absolute',
      'width': '100%',
      'height': '100%',
      'background-color': rgbHex,
       'border': '1px solid black'
    }

    return result;
  }

}
