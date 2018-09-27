import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MMapComponent } from './m-map.component';
import { MMapService } from './m-map.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    MMapComponent
  ],
  exports: [MMapComponent],
  providers: [MMapService]
})
export class MMapModule { }
