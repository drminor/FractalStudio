import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ColorPickerModule } from '../color-picker/color-picker.module';

import { MMapDisplayComponent } from './m-map.display/m-map.display.component';
import { MMapDesignerParamsComponent } from './m-map-designer-params/m-map-designer-params.component';
import { ColorMapEditorComponent } from './color-map-editor/color-map-editor.component';
import { MMapDesignerComponent } from './m-map.designer/m-map.designer.component';
import { MMapViewerComponent } from './m-map.viewer/m-map.viewer.component';
import { MMapViewerParamsComponent } from './m-map-viewer-params/m-map-viewer-params.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ColorPickerModule
  ],
  declarations: [
    MMapDisplayComponent,
    MMapDesignerParamsComponent,
    ColorMapEditorComponent,
    MMapDesignerComponent,
    MMapViewerComponent,
    MMapViewerParamsComponent
  ],
  exports: [
    MMapDisplayComponent,
    MMapDesignerParamsComponent,
    ColorMapEditorComponent,
    MMapDesignerComponent,
    MMapViewerComponent,
    MMapViewerParamsComponent
  ]
})
export class MMapModule { }
