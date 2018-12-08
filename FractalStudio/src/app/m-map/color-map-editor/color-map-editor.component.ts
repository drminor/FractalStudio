import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ColorMapUI, ColorMapUIEntry, ColorMapForExport, Histogram, Divisions, ColorNumbers } from '../m-map-common';
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
  _divs: Divisions;

  @ViewChild('download') downloadRef: ElementRef;
  @ViewChild('fileSelector') fileSelectorRef: ElementRef;

  @Input('colorMap')
  set colorMapProp(colorMap: ColorMapUI) {
    console.log("The color map editor's color map is being set.");

    this._colorMap = colorMap;

    if (colorMap !== null) {
      this.updateForm(colorMap);
      this.updatePercentages();
    }
  }

  get colorMapProp(): ColorMapUI {
    return this._colorMap;
  }

  @Input('histogram')
  set histogram(h: Histogram) {
    if (h === null) {
      console.log("The color map editor's histogram is being set to null.");
    }
    else {
      console.log("The color map editor's histogram is being set. It has " + h.entriesMap.size + " entries.");
    }
    this._histogram = h;

    if (this._histogram !== null) {

      //// Update the live form values using it's target percentages to calculate new offsets.
      //this.updateOffsets();

      // Update the live form's actual percentage values base on the new offsets.
      this.updatePercentages();

      //let curColorMap = this.colorMapProp;
      //if (curColorMap !== null && this._histogram != null) {
      //  let newColorMap = this.buildColorMapFromTargetPercents(curColorMap, this._histogram);
      //  this.colorMapUpdated.emit(newColorMap);
      //}

    }
  }

  @Output() colorMapUpdated = new EventEmitter<ColorMapUI>();

  colorMapForm: FormGroup;

  get colorEntryForms() : FormGroup[] {
    let fArray = this.colorMapForm.controls.cEntries as FormArray;

    let formGroups: FormGroup[] = fArray.controls as FormGroup[];
    return formGroups; 
  }

  constructor() {

    // Define our Form. It has a single item which is an array of CEntryForms
    this.colorMapForm = new FormGroup({
      sectionStart: new FormControl(''),
      sectionEnd: new FormControl(''),
      sectionCnt: new FormControl(''),

      useCutoffs: new FormControl(false),

      cEntries: new FormArray([]),
      highColor: new FormControl(''),
      highColorCutoff: new FormControl('')
    });

    this.colorMapForm.controls.sectionCnt.setValue(10);
    this.colorMapForm.controls.sectionStart.setValue(0);
    this.colorMapForm.controls.sectionEnd.setValue(9);

    this.colorMapProp = null;
    this._histogram = null;
    this._divs = this.createDivisions();

    let ps = this._divs.getStartingVals();
    ColorMapEntryForms.setActualPercentages(this.colorEntryForms, ps);
  }

  private createDivisions(): Divisions {
    // 5 Pieces
    // Piece 0 - 1 section
    // Piece 1 - 4 section
    // Piece 2 - 1 section
    // Piece 3 - 1 section
    // Piece 4 - 3 sections

    let topDiv: Divisions = new Divisions(5);

    topDiv.children[1].numberOfDivs = 4;
    topDiv.children[4].numberOfDivs = 3;

    //let divPlace1 = new Divisions(1);
    //topDiv.children[4].insertChild(divPlace1, 1);

    //let divEnd: Divisions = new Divisions(2);
    //divEnd.children[1].numberOfDivs = 2;

    //topDiv.insertChild(divEnd, 5);

    let startingVals = topDiv.getStartingValsAsPercentages();
    console.log('The starting vals are ' + startingVals + '.');

    let divDisplay = topDiv.toString();
    console.log('The divisions are: ' + divDisplay);

    return topDiv;
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

  //onCEntryEditorBlur(idx: number) {
  //  console.log('CEntry blur just occured.' + 'for item ' + idx + '.');
  //}

  onTargetPercentageBlur(idx: number) {
    console.log('TargetPercentage blur just occured.' + 'for item ' + idx + '.');

    // Update the live form values using it's target percentages to calculate new offsets.
    this.updateOffsets();

    // Update the live form's actual percentage values base on the new offsets.
    this.updatePercentages();
  }

  onSubmit() {
    let colorMap = this.getColorMap(-1);
    console.log('The color map editor is handling form submit.'); 
    this.colorMapUpdated.emit(colorMap);
  }

  onAddEntry() {
    let secCnt = this.colorMapForm.controls.sectionCnt.value;
    let cntToRemove = parseInt(secCnt, 10);
    console.log('Removing first ' + cntToRemove + ' entries.');
    // For testing we are going to remove first secCount entries

    let colorMap = this.getColorMap(-1);

    let newRanges: ColorMapUIEntry[] = [];
    let ptr: number;
    for (ptr = cntToRemove; ptr < colorMap.ranges.length; ptr++) {
      let cme = colorMap.ranges[ptr];
      let newCme = ColorMapUIEntry.fromOffsetAndColorNum(cme.cutOff, cme.colorNum);
      newRanges.push(newCme);
    }

    let newColorMap = new ColorMapUI(newRanges, colorMap.highColorCss, -1);
    this.colorMapUpdated.emit(newColorMap);
  }

  onInsertEntry(idx: number) {
    console.log('Got Insert Entry ' + 'for item ' + idx + '.');
  }

  onDeleteEntry(idx: number) {
    console.log('Got Delete Entry ' + 'for item ' + idx + '.');
  }

  onSaveColorMap() {
    let colorMap = this.getColorMap(-1);

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
      let rawResult: string = fr.result as string;
      let cmfe: ColorMapForExport = JSON.parse(rawResult) as ColorMapForExport;
      let loadedColorMap: ColorMapUI = ColorMapUI.fromColorMapForExport(cmfe, -1);

      if (this.colorMapForm.controls.useCutoffs.value === false) {
        //console.log('Loading ColorMap without cutoffs.');

        // Get the cut off values from the live form values,
        // instead of what was last submitted.
        //let cutOffs = this.colorMapProp.getOffsets();
        let cutOffs = ColorMapEntryForms.getCutoffs(this.colorEntryForms);

        let colorMapUsingExRanges = loadedColorMap.mergeCutoffs(cutOffs, -1);
        this.colorMapUpdated.emit(colorMapUsingExRanges);
      }
      else {
        this.colorMapUpdated.emit(loadedColorMap);
      }
    });

    fr.readAsText(files.item(0));
  }

  onUseHistogram() : void {
    console.log('Dividing Histogram data to set offsets.');

    if (this._histogram === null) {
      console.log('The Histogram is null -- cannot use it to set offsets.');
      return;
    }

    let secCnt = this.colorMapForm.controls.sectionCnt.value;
    let newColorMap = this.buildColorMapByDivision(this.colorMapProp, this._histogram, secCnt, -1);
    this.colorMapUpdated.emit(newColorMap);
  }

  //onUpdateOffsets(): void {
  //  this.updateOffsets();
  //}

  private updateOffsets(): void {
    console.log('Using Target Percentages and Histogram data to set offsets.');

    if (this._histogram === null) {
      console.log('The Histogram is null -- cannot use it to set offsets.');
      return;
    }

    let cEntryForms = this.colorEntryForms;
    //let targPercents = curColorMap.getTargetPercentages();
    let targPercents = ColorMapEntryForms.getTargetPercentages(cEntryForms);

    let cutOffs = this._histogram.getCutoffs(targPercents);
    //ColorMapEntryForms.setCutoffs((this.colorMapForm.controls.cEntries as FormArray), cutOffs);
    ColorMapEntryForms.setCutoffs(cEntryForms, cutOffs);

    //ColorMapEntryForms
    //// Get current form values into a new ColorMapUI instance.
    //let colorMap = this.getColorMap();

    //let newColorMap = this.buildColorMapFromTargetPercents(colorMap, this._histogram);
    //this.colorMapUpdated.emit(newColorMap);
  }

  //onCopyActualPercents(): void {
  //  // get a local copy of our array of color entry forms
  //  let cEntryForms = this.colorEntryForms;

  //  // Update the color entry form's target percentage text fields from the form's actual percentages.
  //  let ptr: number;
  //  for (ptr = 0; ptr < cEntryForms.length; ptr++) {
  //    let cEntryForm = cEntryForms[ptr];
  //    let pv: number = this.getPercentageVal(cEntryForm.controls.actualPercentage.value);
  //    cEntryForm.controls.targetPercentage.setValue(pv);
  //  }
  //}

  //// Use our predefined target percentages and.
  //// 1. Calculate new cutOff values for those percentages.
  //// 2. Build a new ColorMap using the color values from the live form.
  //// 3. Raise the colorMapUpdated event to load this new color map.
  //onLoadTestPercents() {
  //  // Get the current, perhaps unsubmitted, form values into a colorMap object.
  //  let colorMap = this.getColorMap();
  //  let targetPercents = this._divs.getVals();
  //  let cutOffs = this._histogram.getCutoffs(targetPercents);

  //  let newColorMap = colorMap.mergeTpsAndCos(targetPercents, cutOffs);
  //  this.colorMapUpdated.emit(newColorMap);
  //}

  private getPercentageVal(s: string): number {
    let t: string = s.slice(0, s.length - 1);
    let r: number = parseFloat(t);
    return r;
  }

  private updatePercentages(): void {

    if (this._histogram === null) {
      console.log('The Histogram is null -- cannot use it to set offsets.');
      return;
    }

    // get a local copy of our array of color entry forms
    let cEntryForms = this.colorEntryForms;

    // get live, unsubmitted cutOff values from our form.
    let cutOffs = ColorMapEntryForms.getCutoffs(cEntryForms);

    // Use the cutOff values to get the actual percentages.
    let bucketCnts = this._histogram.getGroupCnts(cutOffs);
    let percentages = this._histogram.getGroupPercentages(bucketCnts);

    // Update the color entry form's actual percentage labels.
    ColorMapEntryForms.setActualPercentages(cEntryForms, percentages);
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
    this.colorMapForm.controls.highColor.setValue(colorMap.highColorCss);
    this.colorMapForm.controls.sectionEnd.setValue(colorMap.ranges.length - 1);
  }

  private getColorMap(serialNumber: number): ColorMapUI{
    let ranges: ColorMapUIEntry[] = ColorMapEntryForms.getColorMapUiEntries(this.colorEntryForms);
    let highColorCss: string = this.colorMapForm.controls.highColor.value;
    let result: ColorMapUI = new ColorMapUI(ranges, highColorCss, serialNumber);
    return result;
  }

  private buildColorMapByDivision(curColorMap: ColorMapUI, histogram: Histogram, sectionCnt: number, serialNumber: number) : ColorMapUI {
    //alert('We now have a histogram. It has ' + histogram.entriesMap.size + ' entries.');

    let breakPoints = histogram.getEqualGroupsForAll(sectionCnt);

    let bpDisplay = Histogram.getBreakPointsDisplay(breakPoints);
    console.log('Divide into ' + sectionCnt + ' equal groups gives: ' + bpDisplay);

    let result = curColorMap.mergeCutoffs(breakPoints, serialNumber);
    return result;

    //console.log('The color map has ' + this.colorMap.ranges.length + ' entries.');
  }

  //// TODO: Consider including the actual percentage in the ColorMapUIEntry -- to avoid having to compute it later.
  //private buildColorMapFromTargetPercents(curColorMap: ColorMapUI, histogram: Histogram): ColorMapUI {

  //  let targPercents = curColorMap.getTargetPercentages();
  //  let cutOffs = histogram.getCutoffs(targPercents);

  //  let ranges: ColorMapUIEntry[] = [];

  //  let ptr: number;
  //  for (ptr = 0; ptr < curColorMap.ranges.length; ptr++) {
  //    let ccme = curColorMap.ranges[ptr];
  //    ranges.push(ColorMapUIEntry.fromOffsetAndColorNum(cutOffs[ptr], ccme.targetPercentage, ccme.colorNum));
  //  }

  //  let result = new ColorMapUI(ranges, curColorMap.highColor);
  //  return result;

  //  //console.log('The color map has ' + this.colorMap.ranges.length + ' entries.');
  //}

}

class ColorMapEntryForms {

  public static getColorMapUiEntries(fArray: FormGroup[]): ColorMapUIEntry[] {

    let result: ColorMapUIEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < fArray.length; ptr++) {
      let cEntryForm = fArray[ptr] as FormGroup;

      let cme: ColorMapUIEntry = ColorMapUIEntry.fromOffsetAndRgba(
        cEntryForm.controls.cutOff.value,
        //ColorMapEntryForm.getPercentageVal(cEntryForm.controls.targetPercentage.value),
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

  public static getTargetPercentages(fArray: FormGroup[]): number[] {
    let result = new Array<number>(fArray.length);

    let ptr: number;
    for (ptr = 0; ptr < fArray.length; ptr++) {
      let cEntryForm = fArray[ptr];
      result[ptr] = ColorMapEntryForm.getPercentageVal(cEntryForm.controls.targetPercentage.value);
    }

    return result;
  }

  //public static setTargetPercentages(fArray: FormGroup[], tps: number[]): void {

  //  let ptr: number;
  //  for (ptr = 0; ptr < fArray.length; ptr++) {
  //    let cEntryForm = fArray[ptr];

  //    cEntryForm.controls.targetPercentage.setValue(Divisions.X100With3DecPlaces(tps[ptr]));
  //  }
  //}

  public static setActualPercentages(fArray: FormGroup[], aps: number[]): void {

    let ptr: number;
    for (ptr = 0; ptr < fArray.length; ptr++) {
      let cEntryForm = fArray[ptr];
      cEntryForm.controls.actualPercentage.setValue(Divisions.formatAsPercentage(aps[ptr]));
    }
  }

  public static getCutoffs(fArray: FormGroup[]): number[] {
    let result = new Array<number>(fArray.length);

    let ptr: number;
    for (ptr = 0; ptr < fArray.length; ptr++) {
      let cEntryForm = fArray[ptr];
      result[ptr] = cEntryForm.controls.cutOff.value;
    }

    return result;
  }

  public static setCutoffs(fArray: FormGroup[], cutOffs: number[]): void {

    let ptr: number;
    for (ptr = 0; ptr < fArray.length; ptr++) {
      let cEntryForm = fArray[ptr];
      if (cEntryForm.controls.cutOff.value !== cutOffs[ptr]) {
        console.log('The old cutoff for ' + ptr + ' was ' + cEntryForm.controls.cutOff.value + ' the new value is ' + cutOffs[ptr] + '.');
        cEntryForm.controls.cutOff.setValue(cutOffs[ptr]);
      }
    }
  }

  //private static roundWithTwoDecPlaces(val: number): string {
  //  if (val === 0) {
  //    return '0.0%';
  //  }
  //  else {
  //    let result: number = parseInt((100 * val + 0.5).toString(), 10);
  //    let strR = result.toString();
  //    let res = strR.slice(0, strR.length - 2) + '.' + strR.slice(strR.length - 2) + '%';
  //    if (result < 100) {
  //      res = '0' + res;
  //    }
  //    return res;
  //  }
  //}

}

class ColorMapEntryForm {

  public static buildForm(cme: ColorMapUIEntry): FormGroup {

    let result = new FormGroup({
      cutOff: new FormControl(''),
      //targetPercentage: new FormControl(''),
      cNum: new FormControl(''),

      showEditor: new FormControl(''),
      rgbaColor: new FormControl(''),
      actualPercentage: new FormControl('')
    });

    result.controls.showEditor.disable();
    result.controls.rgbaColor

    if (cme != null) {
      //result.controls.targetPercentage.setValue(Divisions.X100With3DecPlaces(cme.targetPercentage));
      result.controls.cNum.setValue(cme.colorNum);

      result.controls.rgbaColor.setValue(cme.rgbaString);
      result.controls.cutOff.setValue(cme.cutOff);
      result.controls.actualPercentage.setValue('0.0%');
    }

    return result;
  }

  public static getColorMapUIEntry(form: FormGroup): ColorMapUIEntry {
    const result = ColorMapUIEntry.fromOffsetAndColorNum(
      form.controls.cutOff.value,
      //this.getPercentageVal(form.controls.targetPercentage.value),
      form.controls.cNum.value
    );
    return result;
  }

  public static getPercentageVal(s: string): number {
    //let t: string = s.slice(0, s.length - 1);
    let r: number = parseFloat(s);
    r = r / 100;
    return r;
  }

}
