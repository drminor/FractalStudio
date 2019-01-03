import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ColorMapUI, ColorMapUIEntry, ColorMapForExport, Histogram, Divisions, ColorMapEntryBlendStyle } from '../m-map-common';
import { ColorNumbers } from '../ColorNumbers';

import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { ColorItem } from '../../color-picker/color-picker.component';

@Component({
  selector: 'app-color-map-editor',
  templateUrl: './color-map-editor.component.html',
  styleUrls: ['./color-map-editor.component.css']
})
export class ColorMapEditorComponent implements OnInit {

  _colorMap: ColorMapUI;
  _lastLoadedColorMap: ColorMapUI;
  _histogram: Histogram;
  //_divs: Divisions;

  @ViewChild('download') downloadRef: ElementRef;
  @ViewChild('fileSelector') fileSelectorRef: ElementRef;

  @Input('colorMap')
  set colorMap(value: ColorMapUI) {
    console.log("The color map editor's color map is being set.");

    if (value === null) {
      value = this.buildDefaultColorMap();
    }

    this._colorMap = value;

    this.updateForm(value);
    this.updatePercentages();
  }

  get colorMap(): ColorMapUI {
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
      // Update the live form's actual percentage values base on the new offsets.
      this.updatePercentages();
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

    // Define our Form.
    this.colorMapForm = new FormGroup({
      sectionStart: new FormControl(''),
      sectionEnd: new FormControl(''),
      sectionCnt: new FormControl(''),
      applyColorsAfterDivide: new FormControl(true),
      useCutoffs: new FormControl(false),

      cEntries: new FormArray([]),
      hcCutOff: new FormControl(''),
      hcCutOffPercentage: new FormControl(''),
      highColor: new FormControl('')
    });

    this.colorMapForm.controls.sectionCnt.setValue(10);
    this.colorMapForm.controls.sectionStart.setValue(0);
    this.colorMapForm.controls.sectionEnd.setValue(9);

    this._histogram = null;
    this.colorMap = null;
    this._lastLoadedColorMap = null;

    //this._divs = this.createDivisions();
    //let ps = this._divs.getStartingVals();
    //ColorMapEntryForms.setActualPercentages(this.colorEntryForms, ps);
  }

  private buildDefaultColorMap(): ColorMapUI {
    let ranges: ColorMapUIEntry[] = [];

    // Add one breakpoint at 50 with color = red.
    ranges.push(new ColorMapUIEntry(50, ColorNumbers.getColorComponentsFromCssColor("#ff0000"), ColorMapEntryBlendStyle.none, null));

    let highColorCss = "#000000";

    let result = new ColorMapUI(ranges, highColorCss, -1);
    return result;
  }

  getStartRgbaColor(idx: number): string {
    console.log('Getting the startRgbaColor for item with index = ' + idx + '.');
    let cEntryForm = this.colorEntryForms[idx];
    let result: string = cEntryForm.controls.startRgbaColor.value as string;
    return result;
  }

  setStartRgbaColor(colorItem: ColorItem): void {
    //console.log('Setting color for item: ' + colorItem.itemIdx + ' to ' + colorItem.startRgbaColor + '.');
    let cEntryForm = this.colorEntryForms[colorItem.itemIdx];
    cEntryForm.controls.startRgbaColor.setValue(colorItem.rgbaColor);
  }

  onEditColor(idx: number) {
    console.log('Got onEditColor' + 'for item ' + idx + '.');
    this.toggleShowEditor(idx);
  }

  //onCEntryEditorBlur(idx: number) {
  //  console.log('CEntry blur just occured.' + 'for item ' + idx + '.');
  //}

  onSubmit() {
    let colorMap = this.getColorMap();
    console.log('The color map editor is handling form submit.'); 
    this.colorMapUpdated.emit(colorMap);
  }

  onRemoveLeadingEntries() {
    let secCnt = this.colorMapForm.controls.sectionCnt.value;
    let cntToRemove = parseInt(secCnt, 10);
    console.log('Removing first ' + cntToRemove + ' entries.');
    // For testing we are going to remove first secCount entries

    let colorMap = this.getColorMap();

    let newRanges: ColorMapUIEntry[] = [];
    let ptr: number;
    for (ptr = cntToRemove; ptr < colorMap.ranges.length; ptr++) {
      let cme = colorMap.ranges[ptr];
      let newCme = new ColorMapUIEntry(cme.cutOff, cme.startColor.colorComponents, ColorMapEntryBlendStyle.none, null);
      newRanges.push(newCme);
    }

    let newColorMap = new ColorMapUI(newRanges, colorMap.highColorCss, -1);

    if (this._lastLoadedColorMap != null) {
      let recoloredMap = newColorMap.applyColors(this._lastLoadedColorMap.ranges, -1);
      this.colorMapUpdated.emit(recoloredMap);
    }
    else {
      this.colorMapUpdated.emit(newColorMap);
    }
  }

  onInsertEntry(idx: number) {
    console.log('Got Insert Entry ' + 'for item ' + idx + '.');

    let newMap = this.getColorMap();
    let existingEntry = newMap.ranges[idx];
    let newEntry = new ColorMapUIEntry(existingEntry.cutOff - 1, ColorNumbers.getColorComponents(ColorNumbers.white), ColorMapEntryBlendStyle.none, null);

    newMap.insertColorMapEntry(idx, newEntry);
    this.updateForm(newMap);
  }

  onDeleteEntry(idx: number) {
    console.log('Got Delete Entry ' + 'for item ' + idx + '.');

    let newMap = this.getColorMap();
    newMap.removeColorMapEntry(idx);
    this.updateForm(newMap);
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

  ngOnInit(): void {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;
    fSelector.onchange = (evd => {
      this.onLoadColorMap();
    });
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

      // Save a copy to use if we want to re-apply these colors.
      this._lastLoadedColorMap = loadedColorMap;

      let newColorMap: ColorMapUI;
      if (this.colorMapForm.controls.useCutoffs.value === false) {
        //console.log('Loading ColorMap without cutoffs.');
        let cm = this.getColorMap();
        newColorMap = cm.applyColors(loadedColorMap.ranges, -1);
      }
      else {
        newColorMap = loadedColorMap;
      }

      this.colorMapUpdated.emit(newColorMap);
    });

    fr.readAsText(files.item(0));
  }

  onDivide(): void {
    console.log('Dividing Histogram data to set offsets.');

    if (this._histogram === null) {
      console.log('The Histogram is null -- cannot use it to set offsets.');
      return;
    }

    // Use the values from the, perhaps unsubmitted, form.
    let cm = this.getColorMap();
    let cosOriginal = cm.getOffsets();
    console.log('The original offsets are: ' + cosOriginal + '.');

    let secStart = this.colorMapForm.controls.sectionStart.value;
    let secEnd = this.colorMapForm.controls.sectionEnd.value;
    let secCnt = this.colorMapForm.controls.sectionCnt.value;

    if (!(this.isInteger(secStart) && secStart >= 0)) {
      alert('Section start must be an integer greater or equal to 0.');
      return;
    }

    if (!(this.isInteger(secEnd) && (secEnd <= cm.ranges.length))) {
      alert('Section end must be an integer less than or equal to ' + (cm.ranges.length) + '.');
      return;
    }

    if (!(this.isInteger(secCnt) && secCnt > 0)) {
      alert('Section cnt must be a positive integer.');
      return;
    }

    let secStartNum: number = parseInt(secStart);
    let secEndNum: number = parseInt(secEnd);
    let secCntNum: number = parseInt(secCnt);

    //let oldColorMap = this.buildColorMapByDivision_Old(cm, this._histogram, secStartNum, secEndNum, secCntNum, -1);

    let newColorMap = this.buildColorMapByDivision(cm, this._histogram, secStartNum, secEndNum, secCntNum, -1);

    if (this.colorMapForm.controls.applyColorsAfterDivide.value
      && this._lastLoadedColorMap !== null) {
      let recoloredMap = newColorMap.applyColors(this._lastLoadedColorMap.ranges, -1);
      this.colorMapUpdated.emit(recoloredMap);
    }
    else {
      this.colorMapUpdated.emit(newColorMap);
    }
  }

  private isInteger(x: string): boolean {
    let f = parseFloat(x);
    return Number.isInteger(f);
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

    let hcPercentage = percentages.pop();

    // Update the color entry form's actual percentage labels.
    ColorMapEntryForms.setActualPercentages(cEntryForms, percentages);

    let hcCutOff = this._histogram.maxVal;
    let lastCutOff = cutOffs[cutOffs.length - 1];

    lastCutOff++;
    if (lastCutOff < hcCutOff) {
      hcCutOff = lastCutOff;
    }

    // Set our form's high color cut off and percentage.
    this.colorMapForm.controls.hcCutOff.setValue(hcCutOff);
    this.colorMapForm.controls.hcCutOffPercentage.setValue(Divisions.formatAsPercentage(hcPercentage));
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

  private getColorMap(): ColorMapUI{
    let ranges: ColorMapUIEntry[] = ColorMapEntryForms.getColorMapUiEntries(this.colorEntryForms);
    let highColorCss: string = this.colorMapForm.controls.highColor.value;
    let serialNumber = -1; // This will be updated upon submit.
    let result: ColorMapUI = new ColorMapUI(ranges, highColorCss, serialNumber);
    return result;
  }

  //private buildColorMapByDivision_Old(curColorMap: ColorMapUI,
  //  histogram: Histogram,
  //  secStart: number,
  //  secEnd: number,
  //  sectionCnt: number,
  //  serialNumber: number): ColorMapUI {

  //  let breakPoints = histogram.getEqualGroupsForAll(sectionCnt);
  //  let bpDisplay = Histogram.getBreakPointsDisplay(breakPoints);
  //  console.log('Dividing all entries into ' + sectionCnt + ' equal groups gives:');
  //  console.log(bpDisplay);

  //  let result = curColorMap.mergeCutoffs(breakPoints, serialNumber);
  //  let cosMergeWhole = result.getOffsets();
  //  console.log('The new updated map dividing all entries has offsets: ' + cosMergeWhole + '.');

  //  return result;
  //}

  private buildColorMapByDivision(curColorMap: ColorMapUI,
    histogram: Histogram,
    secStart: number,
    secEnd: number,
    sectionCnt: number,
    serialNumber: number): ColorMapUI {

    // The secStart and secEnd point to the entries that need to be replaced.
    // This range of start and end are treated inclusively.

    // The starting cutOff is 1 greater than the offset of the entry just prior to the one pointed to by
    // secStart.

    // If secStart = 0, then the cutOff value is 0 so that we include the entire range of count values.

    // The ending cutOff is the value of the cutOff of the entry pointed to by secEnd.

    // If secEnd is greater than the last index, then use use -1 to signal
    // that we want to include all count value up to, but not including, the max count value.
    // The max count value being the one that holds the number of occurances for the maxIterations.

    let startVal: number;

    if (secStart === 0) {
      startVal = 0;
    }
    else {
      startVal = 1 + curColorMap.ranges[secStart - 1].cutOff;
    }

    let adjustedSecEnd: number;
    let endVal: number;
    if (secEnd > curColorMap.ranges.length - 1) {
      endVal = -1 // Indicate that we want to include the last histogram entry (except the max of course.)
      adjustedSecEnd = curColorMap.ranges.length - 1;
    }
    else {
      endVal = curColorMap.ranges[secEnd].cutOff;
      adjustedSecEnd = secEnd;
    }

    let breakPointsRaw = histogram.getEqualGroupsForSubset(sectionCnt, startVal, endVal);
    let breakPoints = this.removeBreakPointsWithZeroValue(breakPointsRaw);

    let bpDisplay = Histogram.getBreakPointsDisplay(breakPoints);
    console.log('Dividing entries starting at ' + secStart + ' and ending with ' + secEnd + ' into ' + sectionCnt + ' equal groups gives:');
    console.log(bpDisplay);

    let numToRemove = 1 + adjustedSecEnd - secStart;
    let result = curColorMap.spliceCutOffs(secStart, numToRemove, breakPoints, serialNumber);
    let splicedOffSets = result.getOffsets();
    console.log('The new updated map dividing the given subset of entries has offsets: ' + splicedOffSets + '.');

    return result;
  }

  private removeBreakPointsWithZeroValue(breakPoints: number[]): number[] {
    let result: number[] = [];

    let ptr: number;
    for (ptr = 0; ptr < breakPoints.length; ptr++) {
      if (breakPoints[ptr] > 0) {
        result.push(breakPoints[ptr]);
      }
    }

    return result;
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

}

class ColorMapEntryForms {

  public static getColorMapUiEntries(fArray: FormGroup[]): ColorMapUIEntry[] {

    let result: ColorMapUIEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < fArray.length; ptr++) {
      let cEntryForm = fArray[ptr] as FormGroup;

      //let cme: ColorMapUIEntry = ColorMapUIEntry.fromOffsetAndRgba(
      //  cEntryForm.controls.cutOff.value,
      //  cEntryForm.controls.startRgbaColor.value
      //);

      let cme = ColorMapEntryForm.getColorMapUIEntry(cEntryForm);

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

}

class ColorMapEntryForm {

  public static buildForm(cme: ColorMapUIEntry): FormGroup {

    let result = new FormGroup({
      cutOff: new FormControl(''),
      startRgbaColor: new FormControl(''),
      endRgbaColor: new FormControl(''),
      blendStyle: new FormControl('n'),

      actualPercentage: new FormControl(''),
      showEditor: new FormControl('')
    });

    result.controls.showEditor.disable();

    if (cme != null) {
      result.controls.startRgbaColor.setValue(cme.startColor.rgbaString);
      result.controls.cutOff.setValue(cme.cutOff);
      result.controls.actualPercentage.setValue('0.0%');

      result.controls.blendStyle.setValue(this.getLetterFromBlendStyle(cme.blendStyle));
      result.controls.endRgbaColor.setValue(cme.endColor.rgbaString);
    }

    return result;
  }

  public static getColorMapUIEntry(form: FormGroup): ColorMapUIEntry {

    const result = ColorMapUIEntry.fromOffsetAndRgba(
      form.controls.cutOff.value,
      form.controls.startRgbaColor.value,
      this.getBlendStyleFromLetter(form.controls.blendStyle.value),
      form.controls.endRgbaColor.value
    );

    return result;
  }

  private static getLetterFromBlendStyle(blendStyle: ColorMapEntryBlendStyle): string {
    let result: string;

    switch (blendStyle) {
      case ColorMapEntryBlendStyle.none:
        result = 'n';
        break;
      case ColorMapEntryBlendStyle.next:
        result = 'x';
        break;
      case ColorMapEntryBlendStyle.endColor:
        result = 'e';
        break;
      default:
        result = 'n'
    }
    return result;
  }

  private static getBlendStyleFromLetter(letter: string): ColorMapEntryBlendStyle {
    let result: ColorMapEntryBlendStyle;

    switch (letter) {
      case 'n':
        result = ColorMapEntryBlendStyle.none;
        break;
      case 'x':
        result = ColorMapEntryBlendStyle.next;
        break;
      case 'e':
        result = ColorMapEntryBlendStyle.endColor;
        break;

      default:
        result = ColorMapEntryBlendStyle.none;

    }

    return result;
  }

  public static getPercentageVal(s: string): number {
    //let t: string = s.slice(0, s.length - 1);
    let r: number = parseFloat(s);
    r = r / 100;
    return r;
  }

}
