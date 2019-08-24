import { Component, OnInit, ViewChild } from '@angular/core';

import { Service1Service} from '../service1.service';
import { BaseCanvasComponent } from '../base-canvas/base-canvas.component';

@Component({
  selector: 'app-container1',
  templateUrl: './container1.component.html',
  styleUrls: ['./container1.component.css']
})
export class Container1Component implements OnInit {

  @ViewChild('baseCanvas') canvasRef: BaseCanvasComponent;

  private dwServ: Service1Service;
  private cntr: number;
  private stepCntr: number;

  private log: number[];
  private animationStartTime: number;

  private retardFactor: number;

  constructor(dServ: Service1Service) {
    this.dwServ = dServ;
    this.dwServ.speed = 200; // Pixels per second.
    this.cntr = 0;
    this.stepCntr = 0;
    this.log = [];
    this.animationStartTime = 0;
    this.retardFactor = 10;
  }

  ngOnInit() {
  }

  public runAnimation(): void {
    console.log('runAnimation was called.');

    this.canvasRef.clearCanvas();
    this.cntr = 0;
    this.stepCntr = 0;
    this.log = [];

    this.animationStartTime = performance.now();

    requestAnimationFrame(this.showNextStep.bind(this));
  }

  private showNextStep(ts: number): void {

    let stepTime: number;
    if (this.cntr === 0) {
      this.animationStartTime = ts;
      stepTime = 0;
    }
    else {
      stepTime = ts - this.animationStartTime;
      stepTime /= this.retardFactor;
    }

    let rCntr = this.cntr % this.retardFactor;
    this.cntr++;

    if (rCntr === 0) {
      // Use this frame to update and draw.
      this.log.push(stepTime);

      let imgData = this.canvasRef.imgData;
      let complete = this.dwServ.step(imgData, stepTime, this.stepCntr++);
      this.canvasRef.draw(imgData);

      if (!complete) {
        requestAnimationFrame(this.showNextStep.bind(this));
      }
      else {
        // We have completed the animation, output the log.
        console.log(this.log);
      }
    }
    else {
      // Skip this frame
      requestAnimationFrame(this.showNextStep.bind(this));
    }
  }

}
