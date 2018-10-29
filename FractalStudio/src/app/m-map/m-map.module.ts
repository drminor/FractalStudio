import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MMapDisplayComponent } from './m-map.display/m-map.display.component';
import { MMapParamsComponent } from './m-map-params/m-map-params.component';
import { ColorMapEditorComponent } from './color-map-editor/color-map-editor.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  declarations: [
    MMapDisplayComponent,
    MMapParamsComponent,
    ColorMapEditorComponent
  ],
  exports: [MMapDisplayComponent, MMapParamsComponent, ColorMapEditorComponent]
})
export class MMapModule { }
