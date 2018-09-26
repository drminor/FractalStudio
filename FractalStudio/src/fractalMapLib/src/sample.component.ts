import { Component } from '@angular/core';
import { SampleService } from './sample.service';

@Component({
  selector: 'sample-component',
  templateUrl: './sample.component.html',
  styleUrls: ['./sample.component.scss']
})
export class SampleComponent {
  public result: number;

  constructor(public service: SampleService) {
    this.result = service.doInterations(0);
  }

}
