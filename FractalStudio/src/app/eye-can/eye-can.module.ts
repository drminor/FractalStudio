import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseCanvasComponent } from './base-canvas/base-canvas.component';
import { Container1Component } from './container1/container1.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    BaseCanvasComponent,
    Container1Component
  ],
  exports: [
    Container1Component,
    BaseCanvasComponent
  ]
})
export class EyeCanModule { }
