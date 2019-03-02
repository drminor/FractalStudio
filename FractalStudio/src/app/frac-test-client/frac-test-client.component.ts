import { Component, OnInit } from '@angular/core';
//import { HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import * as signalR from '@aspnet/signalr';
import * as msgPackHubProtocol from '@aspnet/signalr-protocol-msgpack';
//import { Observable } from 'rxjs';

import { Box, Point, IBox, ICanvasSize, CanvasSize } from '../m-map/m-map-common';
import { MapWorkRequest, MapSection } from '../m-map/m-map-common-server';
import { FracServerService, Cat } from '../frac-server/frac-server.service';



@Component({
  selector: 'app-frac-test-client',
  templateUrl: './frac-test-client.component.html',
  styleUrls: ['./frac-test-client.component.css']
})
export class FracTestClientComponent implements OnInit {

  public value: string;
  public yValue: number;
  public byteLength: number;

  public hubConnection: signalR.HubConnection;
  public hubConnId: string;

  public messages: string[] = [];
  public message: string;

  constructor(private fService: FracServerService) {
    this.value = 'Hard coded value.';
    this.yValue = -11;
    this.byteLength = -12;
  }

  ngOnInit() {
    console.log('The frac-test-client component is doing ngOnInit.');

    let url = '/hubs/echo';
    this.connectToHub(url);

    

    //let xy: Observable<string> = this.fService.submitJob();
    //xy.subscribe(y => this.value = y.valueOf());

    //let xx: Observable<Cat> = this.fService.getCat('t');
    //xx.subscribe(y => this.value = y.name);

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

  requestConnId() {
    this.hubConnection.invoke("RequestConnId");
  }

  submitJob() {

    let coords: IBox = new Box(new Point(-2, -1), new Point(1, 1));
    let maxIterations = 100;
    let canvasSize: ICanvasSize = new CanvasSize(188, 125);

    let jobRequest = new MapWorkRequest(this.hubConnId, coords, maxIterations, canvasSize);

    let cc = this.fService.submitJob(jobRequest);
    cc.subscribe(resp => this.yValue = resp.coords.topRight.y);

    let dd = this.fService.sendByteRequest();

    dd.subscribe(jj => this.useByteResponse(jj));
  }

  private connectToHub(url: string): void {

    //let builder = new HubConnectionBuilder();
    //this.hubConnection = builder.withUrl(url).build();

    //this.hubConnection = builder
    //  .withUrl(url)
    //  .withHubProtocol(new signalR.protocols.msgpack.MessagePackHubProtocol())
    //  .build();

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(url)
      .withHubProtocol(new msgPackHubProtocol.MessagePackHubProtocol())
      //.withHubProtocol(new signalR.protocols.msgpack.MessagePackHubProtocol())
      .build();



    // message coming from the server
    this.hubConnection.on("Send", (message) => {
      this.messages.push(message);
    });

    this.hubConnection.on("ConnId", (id) => {
      this.hubConnId = id;
      this.value = 'Ready';
    });

    this.hubConnection.on("ImageData", (mapSection: MapSection, data: number[]) => {
      let ls: string = data.length.toString();
      this.messages.push(ls);
    });

    //this.hubConnection.start().then(() => this.value = 'Ready');

    this.hubConnection.start().then(() => {
      this.requestConnId();
      //this.value = 'Ready';
    });
  }

  //onHubStarted(): void {
  //  this.requestConnId();
  //}


}
