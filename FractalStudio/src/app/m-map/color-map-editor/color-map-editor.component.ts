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
      applyColorsAfterDivide: new FormControl(''),
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
    ranges.push(new ColorMapUIEntry(50, ColorNumbers.getColorComponentsFromCssColor("#ff0000")));

    let highColorCss = "#000000";

    let result = new ColorMapUI(ranges, highColorCss, -1);
    return result;
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

  onSubmit() {
    let colorMap = this.getColorMap();
    console.log('The color map editor is handling form submit.'); 
    this.colorMapUpdated.emit(colorMap);
  }

  onAddEntry() {
    let secCnt = this.colorMapForm.controls.sectionCnt.value;
    let cntToRemove = parseInt(secCnt, 10);
    console.log('Removing first ' + cntToRemove + ' entries.');
    // For testing we are going to remove first secCount entries

    let colorMap = this.getColorMap();

    let newRanges: ColorMapUIEntry[] = [];
    let ptr: number;
    for (ptr = cntToRemove; ptr < colorMap.ranges.length; ptr++) {
      let cme = colorMap.ranges[ptr];
      let newCme = new ColorMapUIEntry(cme.cutOff, cme.colorComponents); // ColorMapUIEntry.fromOffsetAndColorNum(cme.cutOff, cme.colorNum);
      newRanges.push(newCme);
    }

    let newColorMap = new ColorMapUI(newRanges, colorMap.highColorCss, -1);
    this.colorMapUpdated.emit(newColorMap);
  }

  onInsertEntry(idx: number) {
    console.log('Got Insert Entry ' + 'for item ' + idx + '.');

    let newMap = this.getColorMap();
    let existingEntry = newMap.ranges[idx];
    let newEntry = new ColorMapUIEntry(existingEntry.cutOff - 1, ColorNumbers.getColorComponents(new ColorNumbers().white));

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

        //// Get the cut off values from the live form values,
        //let cutOffs = ColorMapEntryForms.getCutoffs(this.colorEntryForms);
        //this._lastLoadedColorMap = loadedColorMap.mergeCutoffs(cutOffs, -1);

        let cm = this.getColorMap();
        this._lastLoadedColorMap = cm.applyColors(loadedColorMap.ranges, -1);
      }
      else {
        this._lastLoadedColorMap = loadedColorMap;
      }
      this.colorMapUpdated.emit(this._lastLoadedColorMap);
    });

    fr.readAsText(files.item(0));
  }

  onDivide() : void {
    console.log('Dividing Histogram data to set offsets.');

    if (this._histogram === null) {
      console.log('The Histogram is null -- cannot use it to set offsets.');
      return;
    }

    // Use the values from the, perhaps unsubmitted, form.
    let cm = this.getColorMap();

    let secStart = this.colorMapForm.controls.sectionStart.value;
    let secEnd = this.colorMapForm.controls.sectionEnd.value;
    let secCnt = this.colorMapForm.controls.sectionCnt.value;
    let newColorMap = this.buildColorMapByDivision(cm, this._histogram, secStart, secEnd, secCnt, -1);

    if (this.colorMapForm.controls.applyColorsAfterDivide.value) {
      if (this._lastLoadedColorMap !== null) {
        newColorMap.applyColors(this._lastLoadedColorMap.ranges, -1);
      }
    }

    this.colorMapUpdated.emit(newColorMap);
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

    //// Set the form's highColor value.
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

  private buildColorMapByDivision(curColorMap: ColorMapUI,
    histogram: Histogram,
    secStart: number,
    secEnd: number,
    sectionCnt: number,
    serialNumber: number): ColorMapUI {

    let breakPoints = histogram.getEqualGroupsForAll(sectionCnt);

    //let bpsTest = histogram.getEqualGroupsForSubset(secStart, secEnd, sectionCnt);

    //let bpDisplay = Histogram.getBreakPointsDisplay(bpsTest);
    //console.log('Dividing entries starting at ' + secStart + ' and ending with ' + secEnd + ' into ' + sectionCnt + ' equal groups gives: ' + bpDisplay);

    let result = curColorMap.mergeCutoffs(breakPoints, serialNumber);
    return result;

    //console.log('The color map has ' + this.colorMap.ranges.length + ' entries.');
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
      rgbaColor: new FormControl(''),

      actualPercentage: new FormControl(''),
      showEditor: new FormControl('')
    });

    result.controls.showEditor.disable();
    result.controls.rgbaColor

    if (cme != null) {
      result.controls.rgbaColor.setValue(cme.rgbaString);
      result.controls.cutOff.setValue(cme.cutOff);
      result.controls.actualPercentage.setValue('0.0%');
    }

    return result;
  }

  public static getColorMapUIEntry(form: FormGroup): ColorMapUIEntry {

    const result = ColorMapUIEntry.fromOffsetAndRgba(
      form.controls.cutOff.value,
      form.controls.rgbaColor.value
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
