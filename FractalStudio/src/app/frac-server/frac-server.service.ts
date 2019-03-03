import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import * as signalR from '@aspnet/signalr';
import * as msgPackHubProtocol from '@aspnet/signalr-protocol-msgpack';

import { Box, Point, IBox, ICanvasSize, CanvasSize } from '../m-map/m-map-common';
import { MapWorkRequest, MapSection, MapSectionResult } from '../m-map/m-map-common-server';

interface IHaveConnIdCallback {
  (connId: string): void;
}

//@Injectable({
//  providedIn: 'root'
//})
@Injectable()
export class FracServerService {

  public baseUrl = 'https://localhost:44330';
  public controllerPath = '/api/mrender';
  public hubUrl = '/hubs/mgen';

  public hubConnection: signalR.HubConnection;
  public hubConnId: string;
  public lastMessageReceived: string;

  private doWhenHaveConnId: IHaveConnIdCallback;

  private imageDataSubject: Subject<MapSectionResult>;
  private jobId: number;

  constructor(private http: HttpClient) {
    this.hubConnection = null;
    this.hubConnId = null;
    this.lastMessageReceived = null;
    this.doWhenHaveConnId = null;

    this.imageDataSubject = null;
    this.jobId = -1;
  }

  public get haveHubConnection(): boolean {
    let result = this.hubConnId !== null;
    return result;
  }

  public get JobId(): number {
    let result = this.jobId;
    return result;
  }

  public submitJob(request: MapWorkRequest): Observable<MapSectionResult> {

    this.request = request;
    this.imageDataSubject = new Subject<MapSectionResult>();
    let res: Observable<MapSectionResult>  = this.imageDataSubject.asObservable();

    if (this.haveHubConnection) {
      this.request.connectionId = this.hubConnId;
      this.submitJobInternal();
    }
    else {
      this.doWhenHaveConnId = ((connId: string) => {
        this.request.connectionId = this.hubConnId;
        this.submitJobInternal();
      });

      this.startHubConnection(this.hubUrl);
    }

    return res;
  }

  public cancelJob(): boolean {
    if (this.jobId === -1) {
      return false;
    }

    //TODO: Make the MRender Controller support a cancel job end point.
  }

  private request: MapWorkRequest = null;

  private submitJobInternal(): void {
    let res: Observable<MapWorkRequest> = this.http.post<MapWorkRequest>(this.baseUrl + this.controllerPath, this.request);
    res.subscribe(this.useReturnedMapWorkResult);
    this.doWhenHaveConnId = null;
    this.request = null;
  }

  private useReturnedMapWorkResult(result: MapWorkRequest) {
    this.jobId = result.jobId;
  }

  private startHubConnection(url: string)/*: Promise<any>*/ {

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
      this.lastMessageReceived = message;
    });

    this.hubConnection.on("ConnId", (id) => {
      this.hubConnId = id;
      if(this.doWhenHaveConnId !== null)
        this.doWhenHaveConnId(id);
    });

    this.hubConnection.on("ImageData", (mapSectionResult: MapSectionResult, isFinalSection: boolean) => {
      let ls: string = this.getAvg(mapSectionResult.ImageData).toString();

      this.lastMessageReceived = ls;

      if (this.imageDataSubject !== null) {
        this.imageDataSubject.next(mapSectionResult);
      }

      if (isFinalSection) {
        this.imageDataSubject.complete();
        this.jobId = -1;
      }
    });

    this.hubConnection.start().then(() => {
      this.requestConnId();
    });
  }

  public send(message: string) {
    this.hubConnection.invoke("Echo", message);
  }

  private requestConnId() {
    this.hubConnection.invoke("RequestConnId");
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
