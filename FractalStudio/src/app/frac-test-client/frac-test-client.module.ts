import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FracTestClientComponent } from './frac-test-client.component';

@NgModule({
  imports: [
    CommonModule
    ,FormsModule
  ],
  exports: [
    FracTestClientComponent
    ],
  declarations: [FracTestClientComponent]
})
export class FracTestClientModule { }
