import { Component } from '@angular/core';

import { Box, Point, IBox, ICanvasSize, CanvasSize } from '../m-map/m-map-common';
import { MapWorkRequest, MapSectionResult } from '../m-map/m-map-common-server';
import { FracServerService } from '../frac-server/frac-server.service';


@Component({
  selector: 'app-frac-test-client',
  templateUrl: './frac-test-client.component.html',
  styleUrls: ['./frac-test-client.component.css'],
  providers: [FracServerService]
})
export class FracTestClientComponent  {

  public value: string;
  public yValue: number;
  public byteLength: number;

  public messages: string[] = [];
  public message: string;

  constructor(private fService: FracServerService) {
    this.value = 'Hard coded value.';
    this.yValue = -11;
    this.byteLength = -12;
  }

  submitJob() {
    this.messages = [];
    let coords: IBox = new Box(new Point(-2, -1), new Point(1, 1));
    let maxIterations = 600;
    //let canvasSize: ICanvasSize = new CanvasSize(188, 125);
    let canvasSize: ICanvasSize = new CanvasSize(1800, 1200);

    let jobRequest = new MapWorkRequest(coords, maxIterations, canvasSize);

    let cc = this.fService.submitJob(jobRequest);
    cc.subscribe(
      resp => {
        let ls: string = this.getAvg(this.fixMapSectionResult(resp).imageData).toString();
        this.messages.push(ls);
      },
      err => this.messages.push(err),
      () => this.messages.push("Completed"));
  }



  cancelJob() {
    this.fService.cancelJob();
    console.log("Just asked for the job to be cancelled.");
  }

  private fixMapSectionResult(raw: any): MapSectionResult {
    return new MapSectionResult(-1, null, raw.ImageData);
  }

  private getAvg(data: number[]): number {

    let result = 0;
    let ptr: number;
    for (ptr = 0; ptr < data.length; ptr++) {
      result += data[ptr];
    }

    return result / data.length;

  }

}
