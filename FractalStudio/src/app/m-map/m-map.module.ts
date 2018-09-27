import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MMapDisplayComponent } from './m-map.display.component';
import { MMapService } from './m-map.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    MMapDisplayComponent
  ],
  exports: [MMapDisplayComponent],
  providers: [MMapService]
})
export class MMapModule { }
