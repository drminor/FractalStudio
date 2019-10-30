import { Component, EventEmitter, Output, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { Point, ICanvasSize, CanvasSize } from '../m-map-common';
import { IVirtualMapParams, VirtualMapParams } from '../m-map-viewer-state';

import { MapInfoWithColorMap, MapInfoWithColorMapForExport } from '../m-map-common-ui';


@Component({
  selector: 'app-m-map-viewer-params',
  templateUrl: './m-map-viewer-params.component.html',
  styleUrls: ['./m-map-viewer-params.component.css']
})
export class MMapViewerParamsComponent implements OnInit {

  public mapViewForm: FormGroup;

  public viewSize: string;
  public printSize: string;

  private _surveyMode: boolean = false;

  private _displaySize: ICanvasSize = null;
  @Input('displaySize')
  set displaySize(value: ICanvasSize) {
    this._displaySize = value;
    if (this._virtualMapParams !== null) {
      this._virtualMapParams.viewSize = value;
      this.updateForm(this._virtualMapParams);
    }
    this.updateViewSizeLabel(this.virtualMapParams, this._displaySize);
  }
  get displaySize(): ICanvasSize {
    return this._displaySize;
  }

  private _virtualMapParams: IVirtualMapParams = null;
  @Input('virtualMapParams')
  set virtualMapParams(value: IVirtualMapParams) {
    console.log('Viewer params is having its params value set.');
    this._virtualMapParams = value;
    this.updateForm(this._virtualMapParams);
    this.updateViewSizeLabel(this._virtualMapParams, this.displaySize);
  }
  get virtualMapParams(): IVirtualMapParams {
    return this._virtualMapParams;
  }

  @Input('isBuilding')
  set isBuilding(value: boolean) {
    let appButton = this.applyButton.nativeElement as HTMLButtonElement;
    if (value) {
      appButton.disabled = false;
    }
    else {
      appButton.disabled = false;
    }
  }

  @Output() mapInfoLoaded = new EventEmitter<MapInfoWithColorMap>();
  @Output() virtualMapParamsUpdated = new EventEmitter<IVirtualMapParams>();
  @Output() mapPositionUpdated = new EventEmitter<string>();
  @Output() surveyModeUpdated = new EventEmitter<boolean>();
  @Output() HistogramRequested = new EventEmitter();


  @ViewChild('applyButton') applyButton: ElementRef;
  @ViewChild('fileSelector') fileSelectorRef: ElementRef;

  constructor() {
    this.mapViewForm = this.buildMainForm();
  }

  private buildMainForm(): FormGroup {

    let result = new FormGroup({
      jobName: new FormControl(''),
      iterations: new FormControl(''),

      imageWidth: new FormControl('36'),
      imageHeight: new FormControl('24'),

      printDensity: new FormControl('300'),

      imageWidthPx: new FormControl('10800'),
      imageHeightPx: new FormControl('7200'),

      left: new FormControl('0'),
      top: new FormControl('0'),

    });

    return result;
  }

  private updateForm(params: IVirtualMapParams): void {

    this.mapViewForm.controls.jobName.setValue(params.name);
    this.mapViewForm.controls.iterations.setValue(params.iterations);
    this.mapViewForm.controls.printDensity.setValue(params.printDensity);

    // Width of print output in inches.
    this.mapViewForm.controls.imageWidth.setValue(params.imageSizeInInches.width);
    this.mapViewForm.controls.imageHeight.setValue(params.imageSizeInInches.height);

    this.mapViewForm.controls.imageWidthPx.setValue(params.imageSize.width);
    this.mapViewForm.controls.imageHeightPx.setValue(params.imageSize.height);

    this.mapViewForm.controls.left.setValue(params.position.x);
    this.mapViewForm.controls.top.setValue(params.position.y);

    //this.viewSize = params.viewSizeInInches.width + ' x ' + params.viewSizeInInches.height + ' inches (' + params.viewSize.width + ' x ' + params.viewSize.height + ' pixels)';
    this.printSize = params.imageSize.width + ' x ' + params.imageSize.height + ' pixels';
  }

  private updateViewSizeLabel(params: IVirtualMapParams, displaySize: ICanvasSize): void {
    if (params === null || displaySize === null)
      return;

    this.viewSize = params.viewSizeInInches.width + ' x ' + params.viewSizeInInches.height + ' inches (' + this.displaySize.width + ' x ' + this.displaySize.height + ' pixels)';
  }

  onSubmit() {

    let name = this.mapViewForm.controls.jobName.value;
    let iterations = this.mapViewForm.controls.iterations.value;

    let widthInches = this.mapViewForm.controls.imageWidth.value;
    let heigthInches = Math.trunc(widthInches / 1.5);

    let imageSize = new CanvasSize(widthInches, heigthInches);

    let printDensity = this.mapViewForm.controls.printDensity.value;

    let left = parseFloat(this.mapViewForm.controls.left.value);
    let top = parseFloat(this.mapViewForm.controls.top.value);

    let params = new VirtualMapParams(name, iterations, imageSize, printDensity, this.displaySize, new Point(left, top));
    console.log('Viewer Params is emitting a Params Update.');
    this.virtualMapParamsUpdated.emit(params);
  }

  onMoveL(evt: KeyboardEvent) {
    this.moveMap('l', this.getFactorFromKeyState(evt, true));
  }

  onMoveR(evt: KeyboardEvent) {
    this.moveMap('r', this.getFactorFromKeyState(evt, true));
  }

  onMoveU(evt: KeyboardEvent) {
    this.moveMap('u', this.getFactorFromKeyState(evt, false));
  }

  onMoveD(evt: KeyboardEvent) {
    this.moveMap('d', this.getFactorFromKeyState(evt, false));
  }

  private getFactorFromKeyState(evt: KeyboardEvent, forHoriz: boolean): number {
    let result: number;
    if (forHoriz) {
      result = evt.shiftKey ? 18 : evt.ctrlKey ? 1 : 9;
    }
    else {
      result = evt.shiftKey ? 12 : evt.ctrlKey ? 1 : 6;
    }
    return result;
  }

  private moveMap(dir: string, factor: number): void {
    let eventData: string = dir + factor.toString();
    console.log('Viewer Params is emitting a Map Pos Update. Dir:' + dir + ' factor:' + factor + '.');

    this.mapPositionUpdated.emit(eventData);
  }

  onSetSurveyMode(evt: KeyboardEvent) {
    console.log('Got onSetSurveyMode with shift key = ' + evt.shiftKey + '.');
    this._surveyMode = !this._surveyMode;
    this.surveyModeUpdated.emit(this._surveyMode);
  }

  onRequestHistogramEntire(evt: KeyboardEvent) {
    this.HistogramRequested.emit();
  }

  ngOnInit(): void {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;
    fSelector.onchange = (evd => {
      this.onLoadMapInfo();
    });
  }
  
  onLoadMapInfo() {
    let selectedFile = this.getSelectedFile();

    if (selectedFile === null) return;

    let fr = new FileReader();
    fr.onload = (ev => {
      let fn: string = this.removeFileExt(this.getSelectedFile().name);
      console.log('Loading file with name = ' + fn + '.');
      let rawResult: string = fr.result as string;
      let miwcmfe: MapInfoWithColorMapForExport = JSON.parse(rawResult) as MapInfoWithColorMapForExport;
      let miwcm = MapInfoWithColorMap.fromForExport(miwcmfe, -1, fn);

      this.clearSelectedFile();
      this.mapInfoLoaded.emit(miwcm);
    });

    fr.readAsText(selectedFile);
  }

  private getSelectedFile(): File {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;

    let files: FileList = fSelector.files;

    console.log('The user selected these files: ' + files + '.');
    if (files.length <= 0) {
      return null;
    }

    let x: File = files.item(0);
    return x;
  }

  private clearSelectedFile() {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;
    fSelector.value = '';
  }

  private removeFileExt(fn: string): string {
    let pos = fn.lastIndexOf('.');

    if (pos > 0) {
      return fn.slice(0, pos);
    }
    else {
      return fn;
    }
  }

}
