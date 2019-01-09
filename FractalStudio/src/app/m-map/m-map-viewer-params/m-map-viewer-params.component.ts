import { Component, EventEmitter, Output, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { IBox, IMapInfo, MapInfo, ICanvasSize, CanvasSize } from '../m-map-common';
import { IVirtualMapParams, VirtualMapParams } from '../m-map-viewer-state';

import { ColorMapUI, ColorMapUIEntry, ColorMapForExport, MapInfoWithColorMap, MapInfoWithColorMapForExport } from '../m-map-common-ui';


@Component({
  selector: 'app-m-map-viewer-params',
  templateUrl: './m-map-viewer-params.component.html',
  styleUrls: ['./m-map-viewer-params.component.css']
})
export class MMapViewerParamsComponent implements OnInit {

  public mapViewForm: FormGroup;

  public viewSize: string;
  public printSize: string;

  private _virtualMapParams;
  @Input('virtualMapParams')
  set virtualMapParams(value: IVirtualMapParams) {
    console.log('Viewer params is having its params value set.');
    this._virtualMapParams = value;
    this.updateForm(this._virtualMapParams);
  }
  get virtualMapParams(): IVirtualMapParams {
    return this._virtualMapParams;
  }

  @Input('isBuilding')
  set isBuilding(value: boolean) {
    let appButton = this.applyButton.nativeElement as HTMLButtonElement;
    if (value) {
      appButton.disabled = true;
    }
    else {
      appButton.disabled = false;
    }
  }

  @Output() mapInfoLoaded = new EventEmitter<MapInfoWithColorMap>();
  @Output() virtualMapParamsUpdated = new EventEmitter<IVirtualMapParams>();
  @Output() mapPositionUpdated = new EventEmitter<string>();

  @ViewChild('applyButton') applyButton: ElementRef;
  @ViewChild('fileSelector') fileSelectorRef: ElementRef;

  constructor() {
    this.mapViewForm = this.buildMainForm();
  }

  private buildMainForm(): FormGroup {

    let result = new FormGroup({
      imageWidthPx: new FormControl(21600),
      imageHeightPx: new FormControl(14400),

      imageWidth: new FormControl(72),
      imageHeight: new FormControl(48),

      printDensity: new FormControl(300),
      zoomFactor: new FormControl(1),
      left: new FormControl(0),
      top: new FormControl(0),

      viewWidthPx: new FormControl(21600),
      viewHeightPx: new FormControl(14400),

      viewWidth: new FormControl(72),
      viewHeight: new FormControl(48),

      screenToPrintPixRatio: new FormControl(24),
    });

    return result;
  }

  private updateForm(params: IVirtualMapParams): void {

    this.mapViewForm.controls.imageWidthPx.setValue(params.imageSize.width);
    this.mapViewForm.controls.imageHeightPx.setValue(params.imageSize.height);

    // Width of print output in inches.
    this.mapViewForm.controls.imageWidth.setValue(params.imageSizeInInches.width);
    this.mapViewForm.controls.imageHeight.setValue(params.imageSizeInInches.height);

    // Number of print output pixels currently displayed.
    this.mapViewForm.controls.viewWidthPx.setValue(params.viewSize.width);
    this.mapViewForm.controls.viewHeightPx.setValue(params.viewSize.height);

    // Number of print output inches currently displayed.
    this.mapViewForm.controls.viewWidth.setValue(params.viewSizeInInches.width);
    this.mapViewForm.controls.viewHeight.setValue(params.viewSizeInInches.height);

    this.mapViewForm.controls.screenToPrintPixRatio.setValue(params.scrToPrnPixRat);

    this.mapViewForm.controls.left.setValue(params.left);
    this.mapViewForm.controls.top.setValue(params.top);

    //let zoomFactor = params.imageSize.width / params.viewSize.width;
    let zoomFactor = params.zoomFactor;
    this.mapViewForm.controls.zoomFactor.setValue(zoomFactor.width);

    this.viewSize = params.viewSizeInInches.width + ' x ' + params.viewSizeInInches.height + ' inches (' + params.viewSize.width + ' x ' + params.viewSize.height + ' pixels)';
    this.printSize = params.imageSize.width + ' x ' + params.imageSize.height + ' pixels';

    //let maxZoomFactor = this.getMaxZoomFactor(imageWidthPx, this.displaySize.width);
    //console.log('User pressed apply. The zoom factor is ' + zoomFactor + ' max zf is ' + maxZoomFactor + ' cw: ' + this.displaySize.width + ' ch: ' + this.displaySize.height + '.');
  }

  onSubmit() {

    let imageSize = new CanvasSize(
      this.mapViewForm.controls.imageWidthPx.value,
      this.mapViewForm.controls.imageWidthPx.value / 1.5);

    let printDensity = this.mapViewForm.controls.printDensity.value;

    let screenToPrintPixRat = parseInt(this.mapViewForm.controls.screenToPrintPixRatio.value);

    let left = parseFloat(this.mapViewForm.controls.left.value);
    let top = parseFloat(this.mapViewForm.controls.top.value);

    let params = new VirtualMapParams(imageSize, printDensity, screenToPrintPixRat, left, top);
    console.log('Viewer Params is emitting a Params Update.');
    this.virtualMapParamsUpdated.emit(params);
  }

  onMoveL(evt: KeyboardEvent) {
    this.moveMap('l', this.getFactorFromKeyState(evt));
  }

  onMoveR(evt: KeyboardEvent) {
    this.moveMap('r', this.getFactorFromKeyState(evt));
  }

  onMoveU(evt: KeyboardEvent) {
    this.moveMap('u', this.getFactorFromKeyState(evt));
  }

  onMoveD(evt: KeyboardEvent) {
    this.moveMap('d', this.getFactorFromKeyState(evt));
  }

  private getFactorFromKeyState(evt: KeyboardEvent): number {
    let result: number = evt.shiftKey ? 1.0 : evt.ctrlKey ? 0.2 : 0.5;
    return result;
  }

  private moveMap(dir: string, factor: number): void {
    let eventData: string = dir + factor.toString();
    console.log('Viewer Params is emitting a Map Pos Update.');

    this.mapPositionUpdated.emit(eventData);
  }

  ngOnInit(): void {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;
    fSelector.onchange = (evd => {
      this.onLoadMapInfo();
    });
  }
  
  onLoadMapInfo() {
    let fSelector = this.fileSelectorRef.nativeElement as HTMLInputElement;

    let files: FileList = fSelector.files;

    //console.log('The user selected these files: ' + files + '.');
    if (files.length <= 0) {
      return;
    }

    let fr = new FileReader();
    fr.onload = (ev => {
      let rawResult: string = fr.result as string;
      let miwcmfe: MapInfoWithColorMapForExport = JSON.parse(rawResult) as MapInfoWithColorMapForExport;
      let miwcm = MapInfoWithColorMap.fromForExport(miwcmfe, -1);
      this.mapInfoLoaded.emit(miwcm);
    });

    fr.readAsText(files.item(0));
  }

}
