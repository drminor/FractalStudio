import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ColorMapUIEntry, ColorMapUI, IColorMap, ColorMapForExport } from '../m-map-common';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { ColorItem } from '../../color-picker/color-picker.component';

@Component({
  selector: 'app-color-map-editor',
  templateUrl: './color-map-editor.component.html',
  styleUrls: ['./color-map-editor.component.css']
})
export class ColorMapEditorComponent {

  _colorMap: ColorMapUI;

  @ViewChild('download') downloadRef: ElementRef;
  @ViewChild('fileSelector') fileSelectorRef: ElementRef;

  @Input('colorMap')
  set colorMap(colorMap: ColorMapUI) {
    console.log("The color map editor's color map is being set.");

    this._colorMap = colorMap;
    this.updateForm(colorMap);
  }

  @Input('sectionCnt')
  set sectionCnt(secCnt: number) {
    this.colorMapForm.controls.sectionCnt.setValue(secCnt);
  }

  @Output() colorMapUpdated = new EventEmitter<IColorMap>();
  @Output() buildColorMapFromHistogram = new EventEmitter<number>();

  colorMapForm: FormGroup;

  // Our managed list of ColorMapEntryForms
  cEntryForms: ColorMapEntryFormCollection;

  get colorEntryForms() : FormGroup[] {
    let fArray = this.colorMapForm.controls.cEntries as FormArray;

    let formGroups: FormGroup[] =  fArray.controls as FormGroup[];
    return formGroups; 
  }

  constructor() {

    //this.tempColor = 'rgba(200,20,40,1)';

    // Define our Form. It has a single item which is an array of CEntryForms
    this.colorMapForm = new FormGroup({
      highColor: new FormControl(''),
      sectionCnt: new FormControl(''),
      cEntries: new FormArray([])
    });

    // Initialize our managed list of color map entry forms and bind it to our form's cEntries FormArray.
    this.cEntryForms = new ColorMapEntryFormCollection(this.colorMapForm.controls.cEntries as FormArray);

    this.colorMapForm.controls.sectionCnt.setValue(10);
  }

  getColorBlockStyle(idx: number): object {
    //let cEntry: ColorMapUIEntry = this.cEntryForms.getColorMapEntry(idx);
    //let result = ColorBlockStyle.getStyle(cEntry.rgbaString);

    let rgbaColor = this.getRgbaColor(idx);
    let result = ColorBlockStyle.getStyle(rgbaColor);

    return result;
  }

  getRgbaColor(idx: number): string {
    console.log('Getting the rgbaColor for item with index = ' + idx + '.');
    //let cEntry: ColorMapUIEntry = this.cEntryForms.getColorMapEntry(idx);
    //let result = cEntry.rgbaString;
    //return result;

    let ourFormsCEntries: FormArray = this.colorMapForm.controls.cEntries as FormArray;

    let cEntryForm: FormGroup = ourFormsCEntries.controls[idx] as FormGroup;

    let result: string = cEntryForm.controls.rgbaColor.value as string;
    return result;
  }

  setRgbaColor(colorItem: ColorItem): void {
    //console.log('Setting color for item: ' + colorItem.itemIdx + ' to ' + colorItem.rgbaColor + '.');

    let ourFormsCEntries: FormArray = this.colorMapForm.controls.cEntries as FormArray;

    let cEntryForm: FormGroup = ourFormsCEntries.controls[colorItem.itemIdx] as FormGroup;

    cEntryForm.controls.rgbaColor.setValue(colorItem.rgbaColor);
  }

  onEditColor(idx: number) {
    console.log('Got onEditColor' + 'for item ' + idx + '.');
    this.toggleShowEditor(idx);
  }

  onCEntryEditorBlur(idx: number) {
    console.log('CEntry blur just occured.' + 'for item ' + idx + '.');
  }

  onSubmit() {
    let colorMap = this.getColorMap();
    console.log('The color map editor is handling form submit.'); 
    this.colorMapUpdated.emit(colorMap);
  }

  onSaveColorMap() {
    let colorMap = this.getColorMap();

    let colorMapForExport: ColorMapForExport = ColorMapForExport.FromColorMap(colorMap);
    let dump: string = JSON.stringify(colorMapForExport, null, 2);
    let dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(dump);

    let a = this.downloadRef.nativeElement as HTMLAnchorElement;
    a.download = "colorMap.json";
    a.href = dataUri;
    a.click();
    //a.hidden = false;

    console.log('The color map is |' + dump + '|');
  }

  onLoadColorMap() {
    //alert('onLoadMap called.');
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;

    let files: FileList = fSelector.files;

    console.log('The user selected these files: ' + files + '.');
    if (files.length <= 0) {
      return;
    }

    let fr = new FileReader();
    fr.onload = (ev => {
      //let fr: FileReader = ev.target as FileReader;
      let rawResult: string = fr.result as string;

      let cmfe: ColorMapForExport = JSON.parse(rawResult) as ColorMapForExport;

      let colorMap: IColorMap = ColorMapUI.FromColorMapForExport(cmfe);

      this.colorMapUpdated.emit(colorMap);
    });

    fr.readAsText(files.item(0));
  }

  onUseHistogram() {
    //alert('User wants to use the Histogram.');
    let secCnt = this.colorMapForm.controls.sectionCnt.value;
    this.buildColorMapFromHistogram.emit(secCnt);
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


  private getColorMap(): IColorMap {

    //let ourFormsCEntries: FormArray = this.colorMapForm.controls.cEntries as FormArray;

    //let ranges: ColorMapUIEntry[] = [];

    //let ptr: number;
    //for (ptr = 0; ptr < ourFormsCEntries.controls.length; ptr++) {
    //  ranges.push(this.getColorMapEntry(ptr));
    //}

    let ranges: ColorMapUIEntry[] = this.cEntryForms.cEntries; 

    let highColor: number = this.colorMapForm.controls.highColor.value;

    let result: ColorMapUI = new ColorMapUI(ranges, highColor);

    return result;
  }

}

class ColorMapEntryFormCollection {

  private _fArray: FormArray;
  //private _cEntries: ColorMapUIEntry[];
  //private _cmeForms: ColorMapEntryForm[];

  constructor(fArray: FormArray) {

    // hold a reference to the form's FormArray.
    this._fArray = fArray;

    //this._cEntries = [];
    //this._cmeForms = [];
  }

  //public getColorMapEntry(idx: number): ColorMapUIEntry {
  //  let result = this._cmeForms[idx].colorMapUIEntry;
  //  return result;
  //}

  public get cEntries(): ColorMapUIEntry[] {

    let result: ColorMapUIEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < this._fArray.controls.length; ptr++) {
      let cEntryForm = this._fArray.controls[ptr] as FormGroup;

      let cme: ColorMapUIEntry = ColorMapUIEntry.fromOffsetAndRgba(
        cEntryForm.controls.cutOff.value,
        cEntryForm.controls.rgbaColor.value
      );

      result.push(cme);

      //result.push(this._cmeForms[ptr].colorMapUIEntry);
    }

    return result;
  }

  public set cEntries(colorMapUIEntries: ColorMapUIEntry[]) {

    // clear the existing contents of the FormArray
    // and our forms.
    this.clear();

    let ptr: number;
    for (ptr = 0; ptr < colorMapUIEntries.length; ptr++) {
      let cme = new ColorMapEntryForm(colorMapUIEntries[ptr]);

      //this._cmeForms.push(new ColorMapEntryForm(colorMapUIEntries[ptr]));
      this._fArray.controls.push(cme.form);
    }

    //this._cEntries = colorMapUIEntries;
  }

  public clear(): void {
    this._fArray.controls = [];
    //this._cEntries = [];
    //this._cmeForms = [];
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
      //r: new FormControl(''),
      //g: new FormControl(''),
      //b: new FormControl(''),

      rgbaColor: new FormControl('')
    });

    result.controls.showEditor.disable();
    result.controls.rgbaColor

    //let x = result.controls.r.valueChanges.subscribe();

    if (cme != null) {
      result.controls.cutOff.setValue(cme.cutOff);
      result.controls.cNum.setValue(cme.colorNum);
      //result.controls.r.setValue(cme.r);
      //result.controls.g.setValue(cme.g);
      //result.controls.b.setValue(cme.b);

      result.controls.rgbaColor.setValue(cme.rgbaString);


      //result.controls.cNum.
    }

    return result;
  }

  public get colorMapUIEntry(): ColorMapUIEntry {
    const result = ColorMapUIEntry.fromOffsetAndColorNum(this.form.controls.cutOff.value, this.form.controls.cNum.value);
    return result;
  }

  //private getColorMapEntry(idx: number): ColorMapUIEntry {
  //  const cfg: FormGroup = (this.colorMapForm.controls.cEntries as FormArray).controls[idx] as FormGroup;

  //  const result = ColorMapUIEntry.fromOffsetAndColorNum(cfg.controls.cutOff.value, cfg.controls.cNum.value);
  //  return result;
  //}


}

// -- Style Support
export class ColorBlockStyle {

  public static getStyle(rgbaColor: string): object {

    console.log('Getting style for ColorBlock.');

    let result = {
      'position': 'absolute',
      'width': '100%',
      'height': '100%',
      'background-color': rgbaColor,
      'border': '1px solid black'
    }

    return result;
  }

}
