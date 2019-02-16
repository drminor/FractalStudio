import { Component, OnInit } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { Observable } from 'rxjs';

import { FracServerService, Cat } from '../frac-server/frac-server.service';
import { Box, Point, IBox } from '../m-map/m-map-common';

@Component({
  selector: 'app-frac-test-client',
  templateUrl: './frac-test-client.component.html',
  styleUrls: ['./frac-test-client.component.css']
})
export class FracTestClientComponent implements OnInit {

  public value: string;
  public yValue: number;
  public byteLength: number;

  public hubConnection: HubConnection;
  public messages: string[] = [];
  public message: string;

  constructor(private fService: FracServerService) {
    this.value = 'Hard coded value.';
    this.yValue = -11;
    this.byteLength = -12;
  }

  ngOnInit() {
    console.log('The frac-test-client component is doing ngOnInit.');

    let builder = new HubConnectionBuilder();

    // as per setup in the startup.cs
    this.hubConnection = builder.withUrl('/hubs/echo').build();

    // message coming from the server
    this.hubConnection.on("Send", (message) => {
      this.messages.push(message);
    });

    // starting the connection
    this.hubConnection.start();

    let xx: Observable<Cat> = this.fService.getCat('t');

    xx.subscribe(y => this.value = y.name);

    let coords: IBox = new Box(new Point(1.2, 3.4), new Point(5.6, 7.8));

    let cc = this.fService.sendCoords(coords);
    cc.subscribe(y => this.yValue = y.topRight.y);

    let dd = this.fService.sendByteRequest();

    dd.subscribe(jj => this.useByteResponse(jj));

    //dd.subscribe(y: ArrayBuffer  => {
    //  if (y !== null && y !== undefined) {
    //    this.byteLength = y.byteLength
    //  }
    //});
  }

  useByteResponse(br: ArrayBuffer): void {
    if (br !== undefined && br !== null) {
      this.byteLength = br.byteLength;
    }
    else {
      this.byteLength = -1;
    }
  }

  send() {
    // message sent from the client to the server
    this.hubConnection.invoke("Echo", this.message);
    this.message = "";
  }
}
