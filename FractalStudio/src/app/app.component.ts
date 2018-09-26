import { Component } from '@angular/core';
import { Logger } from './logger.service';
import { MMapService } from './mMap/m-map.service';
import { IMapWorkingData, MapWorkingData } from './mMapCommon/m-map-common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'FractalStudio';
  public rLen: number;

  //buf: Float64Array = new Float64Array(5);

  constructor(private logger: Logger) {
    this.rLen = 10;
    logger.log('Hey, pretty cool.');

    var mService = new MMapService();

    var result: IMapWorkingData = mService.createTestMapWD();



    var flags: boolean[] = MapWorkingData.getFlagData(result);
    this.rLen = flags.length;
  }

}
