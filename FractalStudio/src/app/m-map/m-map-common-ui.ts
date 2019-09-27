import { ColorNumbers } from './ColorNumbers';

import { IMapInfo, MapInfo, ColorMapEntry, ColorMapEntryBlendStyle, ColorMap, MapInfoForExport, IMapInfoForExport } from './m-map-common';


export class ColorMapEntryForExport {
  public cssColor: string;
  constructor(public cutOff: number, public startCssColor: string, public blendStyle: ColorMapEntryBlendStyle, public endCssColor: string) { }

  public static fromColorMapUIEntry(cme: ColorMapUIEntry): ColorMapEntryForExport {
    let result = new ColorMapEntryForExport(cme.cutOff, cme.startColor.rgbHex, cme.blendStyle, cme.endColor.rgbHex);
    return result;
  }
}

export class ColorMapUIColor {
  public colorComponents: number[];

  constructor(colorVals: number[]) {

    this.colorComponents = new Array<number>(4);
    let alpha: number;

    if (colorVals === null) {
      // Use black when we are given a null value.
      colorVals = [0, 0, 0];
      alpha = 255;
    }
    else if (colorVals.length === 3) {
      alpha = 255;
    }
    else if (colorVals.length === 4) {
      alpha = colorVals[3];
    }
    else {
      throw new RangeError('colorVals must have exactly 3 or 4 elements.');
    }

    this.colorComponents[0] = colorVals[0];
    this.colorComponents[1] = colorVals[1];
    this.colorComponents[2] = colorVals[2];
    this.colorComponents[3] = alpha;
  }

  public get r(): number {
    return this.colorComponents[0];
  }

  public get g(): number {
    return this.colorComponents[1];
  }

  public get b(): number {
    return this.colorComponents[2];
  }

  public get alpha(): number {
    return this.colorComponents[3];
  }

  public get rgbHex(): string {
    let result = ColorNumbers.getRgbHex(this.colorComponents);
    return result;
  }

  public get rgbaString(): string {
    let result = ColorNumbers.getRgbaString(this.colorComponents);
    return result;
  }


  public static fromColorNum(cNum: number): ColorMapUIColor {
    let colorComps: number[] = ColorNumbers.getColorComponents(cNum);
    let result = new ColorMapUIColor(colorComps);
    return result;
  }

  public static fromCssColor(cssColor: string): ColorMapUIColor {
    let colorComps: number[] = ColorNumbers.getColorComponentsFromCssColor(cssColor);
    let result = new ColorMapUIColor(colorComps);
    return result;
  }

  public static fromRgba(rgbaColor: string): ColorMapUIColor {
    let colorComps: number[] = ColorNumbers.getColorComponentsFromRgba(rgbaColor);
    let result = new ColorMapUIColor(colorComps);
    return result;
  }
}

export class ColorMapUIEntry {

  public startColor: ColorMapUIColor;
  public endColor: ColorMapUIColor;

  constructor(public cutOff: number, colorVals: number[], public blendStyle: ColorMapEntryBlendStyle, endColorVals: number[]) {

    this.startColor = new ColorMapUIColor(colorVals);
    this.endColor = new ColorMapUIColor(endColorVals);
  }

  public clone(): ColorMapUIEntry {
    let result = new ColorMapUIEntry(this.cutOff, this.startColor.colorComponents, this.blendStyle, this.endColor.colorComponents);
    return result;
  }

  public static fromColorMapEntry(cme: ColorMapEntry): ColorMapUIEntry {
    let result = ColorMapUIEntry.fromOffsetAndColorNum(cme.cutOff, cme.colorNum, cme.blendStyle, cme.endColorNum);
    return result;
  }

  public static fromOffsetAndColorNum(cutOff: number, startCNum: number, blendStyle: ColorMapEntryBlendStyle, endCNum: number): ColorMapUIEntry {
    let startColorComps: number[] = ColorNumbers.getColorComponents(startCNum);
    let endColorComps: number[] = ColorNumbers.getColorComponents(endCNum);

    let result = new ColorMapUIEntry(cutOff, startColorComps, blendStyle, endColorComps);
    return result;
  }

  public static fromOffsetAndCssColor(cutOff: number, startCssColor: string, blendStyle: ColorMapEntryBlendStyle, endCssColor: string): ColorMapUIEntry {
    let startColorComps: number[] = ColorNumbers.getColorComponentsFromCssColor(startCssColor);
    let endColorComps: number[] = ColorNumbers.getColorComponentsFromCssColor(endCssColor);

    let result = new ColorMapUIEntry(cutOff, startColorComps, blendStyle, endColorComps);
    return result;
  }

  public static fromOffsetAndRgba(cutOff: number, startRgbaColor: string, blendStyle: ColorMapEntryBlendStyle, endRgbaColor: string): ColorMapUIEntry {
    let startColorComps: number[] = ColorNumbers.getColorComponentsFromRgba(startRgbaColor);
    let endColorComps: number[] = ColorNumbers.getColorComponentsFromRgba(endRgbaColor);

    let result = new ColorMapUIEntry(cutOff, startColorComps, blendStyle, endColorComps);
    return result;
  }
}

export class ColorMapUI {

  constructor(public ranges: ColorMapUIEntry[], public highColorCss: string, public serialNumber: number) { }

  public insertColorMapEntry(index: number, entry: ColorMapUIEntry) {
    this.ranges.splice(index, 0, entry);
  }

  public removeColorMapEntry(index: number): ColorMapUIEntry {
    let result = this.ranges[index];
    this.ranges.splice(index, 1);
    return result;
  }

  public applyColors(colorMapUiEntries: ColorMapUIEntry[], serialNumber: number): ColorMapUI {

    let ranges: ColorMapUIEntry[] = [];
    let ptrToNewColorEntry = 0;

    let ptr: number;
    for (ptr = 0; ptr < this.ranges.length; ptr++) {
      let existingCutOff = this.ranges[ptr].cutOff;
      let sourceCme = colorMapUiEntries[ptrToNewColorEntry++];
      let startCComps = sourceCme.startColor.colorComponents;
      let endCComps = sourceCme.endColor.colorComponents;

      ranges.push(new ColorMapUIEntry(existingCutOff, startCComps, sourceCme.blendStyle, endCComps));

      if (ptrToNewColorEntry > colorMapUiEntries.length - 1) {
        ptrToNewColorEntry = 0;
      }
    }

    let result: ColorMapUI = new ColorMapUI(ranges, this.highColorCss, serialNumber);
    return result;
  }

  public mergeCutoffs(cutOffs: number[], serialNumber: number): ColorMapUI {

    let ranges: ColorMapUIEntry[] = [];
    let ptrToExistingCmes = 0;

    let ptr: number;
    for (ptr = 0; ptr < cutOffs.length; ptr++) {
      //let existingColorComps = this.ranges[ptrToExistingCmes++].startColor.colorComponents;

      let existingCme = this.ranges[ptrToExistingCmes++];
      let startCComps = existingCme.startColor.colorComponents;
      let endCComps = existingCme.endColor.colorComponents;

      ranges.push(new ColorMapUIEntry(cutOffs[ptr], startCComps, existingCme.blendStyle, endCComps));

      if (ptrToExistingCmes > this.ranges.length - 1) {
        ptrToExistingCmes = 0;
      }
    }

    let result: ColorMapUI = new ColorMapUI(ranges, this.highColorCss, serialNumber);
    return result;
  }

  public spliceCutOffs(start: number, numToRemove: number, cutOffs: number[], serialNumber: number): ColorMapUI {

    // Create a range of ColorMapUIEntries from the given cutOffs.
    let white: number = ColorNumbers.white;
    let whiteComps = ColorNumbers.getColorComponents(white);

    let rangesToInsert: ColorMapUIEntry[] = [];

    let ptr1: number;
    for (ptr1 = 0; ptr1 < cutOffs.length; ptr1++) {
      rangesToInsert.push(new ColorMapUIEntry(cutOffs[ptr1], whiteComps, ColorMapEntryBlendStyle.none, null));
    }

    // Create a copy of the existing ranges
    let rangesResult = this.cloneRanges();
    rangesResult.splice(start, numToRemove, ...rangesToInsert);

    let result: ColorMapUI = new ColorMapUI(rangesResult, this.highColorCss, serialNumber);
    return result;
  }

  public cloneRanges(): ColorMapUIEntry[] {
    let result: ColorMapUIEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < this.ranges.length; ptr++) {
      result.push(this.ranges[ptr].clone());
    }

    return result;
  }

  public getOffsets(): number[] {
    let result = new Array<number>(this.ranges.length);

    let ptr: number;
    for (ptr = 0; ptr < this.ranges.length; ptr++) {
      result[ptr] = this.ranges[ptr].cutOff;
    }

    return result;
  }

  public getRegularColorMap(): ColorMap {
    let regularRanges: ColorMapEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < this.ranges.length; ptr++) {
      let cmuie = this.ranges[ptr];
      let startCComps = ColorNumbers.getColorFromComps(cmuie.startColor.colorComponents);
      let endCComps = ColorNumbers.getColorFromComps(cmuie.endColor.colorComponents);
      let cme: ColorMapEntry = new ColorMapEntry(cmuie.cutOff, startCComps, cmuie.blendStyle, endCComps);
      regularRanges.push(cme);
    }

    let result = new ColorMap(regularRanges, ColorNumbers.getColorFromCssColor(this.highColorCss));
    return result;
  }

  public static fromColorMapForExport(cmfe: ColorMapForExport, serialNumber: number): ColorMapUI {

    if (typeof cmfe.version === 'undefined') {
      cmfe.version = 1.0;
    }
    //console.log('Got a ColorMapForExport and it has version = ' + cmfe.version + '.');

    let result: ColorMapUI;
    if (cmfe.version === 1.0) {
      result = this.fromColorMapForExportV1(cmfe, serialNumber);
    }
    else {
      result = this.fromColorMapForExportV2(cmfe, serialNumber);
    }
    return result;
  }

  private static fromColorMapForExportV1(cmfe: ColorMapForExport, serialNumber: number): ColorMapUI {
    let ranges: ColorMapUIEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < cmfe.ranges.length; ptr++) {
      let cmeForExport = cmfe.ranges[ptr];
      let cme: ColorMapUIEntry = ColorMapUIEntry.fromOffsetAndCssColor(cmeForExport.cutOff, cmeForExport.cssColor, ColorMapEntryBlendStyle.none, '#000000');
      ranges.push(cme);
    }

    let result = new ColorMapUI(ranges, cmfe.highColorCss, serialNumber);
    return result;
  }

  private static fromColorMapForExportV2(cmfe: ColorMapForExport, serialNumber: number): ColorMapUI {
    let ranges: ColorMapUIEntry[] = [];

    let ptr: number;
    for (ptr = 0; ptr < cmfe.ranges.length; ptr++) {
      let cmeForExport = cmfe.ranges[ptr];
      let cme: ColorMapUIEntry = ColorMapUIEntry.fromOffsetAndCssColor(cmeForExport.cutOff, cmeForExport.startCssColor, cmeForExport.blendStyle, cmeForExport.endCssColor);
      ranges.push(cme);
    }

    let result = new ColorMapUI(ranges, cmfe.highColorCss, serialNumber);
    return result;
  }
}

export class ColorMapForExport {

  public version: number = 2.0;

  constructor(public ranges: ColorMapEntryForExport[], public highColorCss: string) { }

  public static FromColorMap(colorMap: ColorMapUI): ColorMapForExport {
    let ranges: ColorMapEntryForExport[] = [];

    let ptr: number;
    for (ptr = 0; ptr < colorMap.ranges.length; ptr++) {
      let cme: ColorMapUIEntry = colorMap.ranges[ptr];
      let cmeForExport = ColorMapEntryForExport.fromColorMapUIEntry(cme);
      ranges.push(cmeForExport);
    }

    const result = new ColorMapForExport(ranges, colorMap.highColorCss);
    return result;
  }
}

export class MapInfoWithColorMap {
  constructor(public mapInfo: IMapInfo, public colorMapUi: ColorMapUI) { }

  public static fromForExport(miwcmfe: MapInfoWithColorMapForExport, serialNumber: number, filename: string): MapInfoWithColorMap {

    if (typeof miwcmfe.version === 'undefined') {
      miwcmfe.version = 1.0;
    }
    //console.log('Loaded the MapInfoWithColorMapForExport and it has version = ' + miwcmfe.version + '.');

    // Create a new MapInfo from the loaded data.
    let mapInfo = MapInfo.fromMapInfoForExport(miwcmfe.mapInfo, filename);

    // Create a new ColorMapUI from the loaded data.
    let colorMap = ColorMapUI.fromColorMapForExport(miwcmfe.colorMap, serialNumber);

    let result = new MapInfoWithColorMap(mapInfo, colorMap);
    return result;
  }
}

export class MapInfoWithColorMapForExport {
  public version: number = 1.0;

  constructor(public mapInfo: IMapInfoForExport, public colorMap: ColorMapForExport) { }
}
