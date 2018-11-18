import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ColorMapUI, ColorMapUIEntry, ColorMapForExport } from '../m-map-common';
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

  @Output() colorMapUpdated = new EventEmitter<ColorMapUI>();
  @Output() buildColorMapFromHistogram = new EventEmitter<number>();

  colorMapForm: FormGroup;

  // Our managed list of ColorMapEntryForms
  //cEntryForms: ColorMapEntryForms;

  get colorEntryForms() : FormGroup[] {
    let fArray = this.colorMapForm.controls.cEntries as FormArray;

    let formGroups: FormGroup[] =  fArray.controls as FormGroup[];
    return formGroups; 
  }

  constructor() {

    // Define our Form. It has a single item which is an array of CEntryForms
    this.colorMapForm = new FormGroup({
      highColor: new FormControl(''),
      sectionCnt: new FormControl(''),
      cEntries: new FormArray([])
    });

    // Initialize our managed list of color map entry forms and bind it to our form's cEntries FormArray.
    //this.cEntryForms = new ColorMapEntryForms(this.colorMapForm.controls.cEntries as FormArray);

    this.colorMapForm.controls.sectionCnt.setValue(10);
  }

  //getColorBlockStyle(idx: number): object {
  //  //let cEntry: ColorMapUIEntry = this.cEntryForms.getColorMapEntry(idx);
  //  //let result = ColorBlockStyle.getStyle(cEntry.rgbaString);

  //  let rgbaColor = this.getRgbaColor(idx);
  //  let result = ColorBlockStyle.getStyle(rgbaColor);

  //  return result;
  //}

  getRgbaColor(idx: number): string {
    console.log('Getting the rgbaColor for item with index = ' + idx + '.');

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

      let colorMap: ColorMapUI = ColorMapUI.FromColorMapForExport(cmfe);

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

    ColorMapEntryForms.loadColorMapUiEntries(colorMap.ranges, this.colorMapForm.controls.cEntries as FormArray);
    //this.cEntryForms.colorMapUiEntries = colorMap.ranges;

    // Set the form's highColor value.
    this.colorMapForm.controls.highColor.setValue(colorMap.highColor);
  }

  // --- ColorMapEntry to/from  FormGroup methods


  private getColorMap(): ColorMapUI{
    let ranges: ColorMapUIEntry[] = ColorMapEntryForms.getColorMapUiEntries(this.colorMapForm.controls.cEntries as FormArray);
    let highColor: number = this.colorMapForm.controls.highColor.value;
    let result: ColorMapUI = new ColorMapUI(ranges, highColor);
    return result;
  }
}

class ColorMapEntryForms {

  //constructor(public fArray: FormArray) {  }

  public static getColorMapUiEntries(fArray: FormArray): ColorMapUIEntry[] {

    let result: ColorMapUIEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < fArray.controls.length; ptr++) {
      let cEntryForm = fArray.controls[ptr] as FormGroup;

      let cme: ColorMapUIEntry = ColorMapUIEntry.fromOffsetAndRgba(
        cEntryForm.controls.cutOff.value,
        cEntryForm.controls.rgbaColor.value
      );

      result.push(cme);
    }
    return result;
  }

  public static loadColorMapUiEntries(colorMapUIEntries: ColorMapUIEntry[], fArray: FormArray) : void {

    // Clear the existing contents of the FormArray
    fArray.controls = [];

    let ptr: number;
    for (ptr = 0; ptr < colorMapUIEntries.length; ptr++) {
      let cme = new ColorMapEntryForm(colorMapUIEntries[ptr]);
      fArray.controls.push(cme.form);
    }
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
      rgbaColor: new FormControl('')
    });

    result.controls.showEditor.disable();
    result.controls.rgbaColor


    if (cme != null) {
      result.controls.cutOff.setValue(cme.cutOff);
      result.controls.cNum.setValue(cme.colorNum);
      result.controls.rgbaColor.setValue(cme.rgbaString);
    }

    return result;
  }

  public get colorMapUIEntry(): ColorMapUIEntry {
    const result = ColorMapUIEntry.fromOffsetAndColorNum(this.form.controls.cutOff.value, this.form.controls.cNum.value);
    return result;
  }

}

//// -- Style Support
//export class ColorBlockStyle {

//  public static getStyle(rgbaColor: string): object {

//    console.log('Getting style for ColorBlock.');

//    let result = {
//      'position': 'absolute',
//      'width': '100%',
//      'height': '100%',
//      'background-color': rgbaColor,
//      'border': '1px solid black'
//    }

//    return result;
//  }

//}
