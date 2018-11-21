import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ColorMapUI, ColorMapUIEntry, ColorMapForExport, Histogram } from '../m-map-common';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { ColorItem } from '../../color-picker/color-picker.component';

@Component({
  selector: 'app-color-map-editor',
  templateUrl: './color-map-editor.component.html',
  styleUrls: ['./color-map-editor.component.css']
})
export class ColorMapEditorComponent {

  _colorMap: ColorMapUI;
  _histogram: Histogram;

  @ViewChild('download') downloadRef: ElementRef;
  @ViewChild('fileSelector') fileSelectorRef: ElementRef;

  @Input('colorMap')
  set colorMap(colorMap: ColorMapUI) {
    console.log("The color map editor's color map is being set.");

    this._colorMap = colorMap;
    this.updateForm(colorMap);
  }

  //@Input('sectionCnt')
  //set sectionCnt(secCnt: number) {
  //  this.colorMapForm.controls.sectionCnt.setValue(secCnt);
  //}

  @Input('histogram')
  set histogram(h: Histogram) {
    if (h === null) {
      console.log("The color map editor's histogram is being set to null.");
    }
    else {
      console.log("The color map editor's histogram is being set. It has " + h.entriesMap.size + " entries.");
    }
    this._histogram = h;
  }

  @Output() colorMapUpdated = new EventEmitter<ColorMapUI>();
  //@Output() buildColorMapFromHistogram = new EventEmitter<number>();
  //@Output() histogramRequested = new EventEmitter();


  colorMapForm: FormGroup;

  get colorEntryForms() : FormGroup[] {
    let fArray = this.colorMapForm.controls.cEntries as FormArray;

    let formGroups: FormGroup[] = fArray.controls as FormGroup[];
    return formGroups; 
  }

  constructor() {

    // Define our Form. It has a single item which is an array of CEntryForms
    this.colorMapForm = new FormGroup({
      highColor: new FormControl(''),
      sectionCnt: new FormControl(''),
      cEntries: new FormArray([])
    });

    this.colorMapForm.controls.sectionCnt.setValue(10);
  }

  getRgbaColor(idx: number): string {
    console.log('Getting the rgbaColor for item with index = ' + idx + '.');
    let cEntryForm = this.colorEntryForms[idx];
    let result: string = cEntryForm.controls.rgbaColor.value as string;
    return result;
  }

  setRgbaColor(colorItem: ColorItem): void {
    //console.log('Setting color for item: ' + colorItem.itemIdx + ' to ' + colorItem.rgbaColor + '.');
    let cEntryForm = this.colorEntryForms[colorItem.itemIdx];
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

  onUseHistogram() : void {
    console.log('Using Histogram to set offsets.');

    if (this._histogram === null) {
      console.log('The Histogram is null -- cannot use it to set offsets.');
      return;
    }

    let secCnt = this.colorMapForm.controls.sectionCnt.value;

    let newColorMap = this.buildColorMapFromHistogram(this._colorMap, this._histogram, secCnt);

    this.colorMapUpdated.emit(newColorMap);

    //this.histogramRequested.emit();
    //let secCnt = this.colorMapForm.controls.sectionCnt.value;
    //this.buildColorMapFromHistogram.emit(secCnt);
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
    let result = this.colorEntryForms[idx];
    return result;
  }

  private updateForm(colorMap: ColorMapUI): void {
    let fArray = this.colorMapForm.controls.cEntries as FormArray;
    ColorMapEntryForms.loadColorMapUiEntries(colorMap.ranges, fArray);

    // Set the form's highColor value.
    this.colorMapForm.controls.highColor.setValue(colorMap.highColor);
  }

  private getColorMap(): ColorMapUI{
    let ranges: ColorMapUIEntry[] = ColorMapEntryForms.getColorMapUiEntries(this.colorEntryForms);
    let highColor: number = this.colorMapForm.controls.highColor.value;
    let result: ColorMapUI = new ColorMapUI(ranges, highColor);
    return result;
  }

  private buildColorMapFromHistogram(curColorMap: ColorMapUI, histogram: Histogram, sectionCnt: number) : ColorMapUI {
    //alert('We now have a histogram. It has ' + histogram.entriesMap.size + ' entries.');

    let breakPoints = histogram.getEqualGroupsForAll(sectionCnt);

    let bpDisplay = Histogram.getBreakPointsDisplay(breakPoints);
    console.log('Divide into ' + sectionCnt + ' equal groups gives: ' + bpDisplay);

    let ranges: ColorMapUIEntry[] = [];
    let ptrToExistingCmes = 0;

    let ptr: number;
    for (ptr = 0; ptr < breakPoints.length; ptr++) {
      let existingColorNum = curColorMap.ranges[ptrToExistingCmes++].colorNum;

      ranges.push(ColorMapUIEntry.fromOffsetAndColorNum(breakPoints[ptr], existingColorNum));

      if (ptrToExistingCmes > curColorMap.ranges.length - 1) {
        ptrToExistingCmes = 0;
      }
    }

    let result: ColorMapUI = new ColorMapUI(ranges, curColorMap.highColor);
    return result;

    //console.log('The color map has ' + this.colorMap.ranges.length + ' entries.');
  }

}

class ColorMapEntryForms {

  public static getColorMapUiEntries(fArray: FormGroup[]): ColorMapUIEntry[] {

    let result: ColorMapUIEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < fArray.length; ptr++) {
      let cEntryForm = fArray[ptr] as FormGroup;

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
    while (fArray.controls.length > 0) {
      fArray.controls.pop();
    }

    let ptr: number;
    for (ptr = 0; ptr < colorMapUIEntries.length; ptr++) {
      let cmef = ColorMapEntryForm.buildForm(colorMapUIEntries[ptr]);
      fArray.controls.push(cmef);
    }
  }
}

class ColorMapEntryForm {
  4
  public static buildForm(cme: ColorMapUIEntry): FormGroup {

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

  public static getColorMapUIEntry(form: FormGroup): ColorMapUIEntry {
    const result = ColorMapUIEntry.fromOffsetAndColorNum(form.controls.cutOff.value, form.controls.cNum.value);
    return result;
  }
}
