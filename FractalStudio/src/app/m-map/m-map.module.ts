import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MMapService } from './m-map.service';
import { MMapDisplayComponent } from './m-map.display/m-map.display.component';
import { MMapParamsComponent } from './m-map-params/m-map-params.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    MMapDisplayComponent,
    MMapParamsComponent
  ],
  exports: [MMapDisplayComponent, MMapParamsComponent],
  providers: [MMapService]
})
export class MMapModule { }
