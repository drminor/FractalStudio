import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import * as signalR from '@aspnet/signalr';
import * as msgPackHubProtocol from '@aspnet/signalr-protocol-msgpack';

import { MapWorkRequest, MapSectionResult, MapSection } from '../m-map/m-map-common-server';
import { Point, CanvasSize } from '../m-map/m-map-common';

interface IHaveConnIdCallback {
  (connId: string): void;
}

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

    //this.cancelJob();
    this.request = request;
    this.imageDataSubject = new Subject<MapSectionResult>();
    let res: Observable<MapSectionResult>  = this.imageDataSubject.asObservable();

    if (this.haveHubConnection) {
      this.request.connectionId = this.hubConnId;
      this.submitJobInternal();
    }
    else {
      this.doWhenHaveConnId = ((connId: string) => {
        this.request.connectionId = connId;
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

    //if (this.imageDataSubject !== null) {
    //  this.imageDataSubject.complete();
    //}

    //this.http.get(this.baseUrl + this.controllerPath + "/" + this.jobId);
    //let ad: string = this.baseUrl + this.controllerPath + "/" + this.jobId;
    //this.http.delete(ad);
    
    //this.jobId = -1;
    return true;
  }

  private request: MapWorkRequest = null;

  private submitJobInternal(): void {
    let res: Observable<MapWorkRequest> = this.http.post<MapWorkRequest>(this.baseUrl + this.controllerPath, this.request);
    res.subscribe(ret => this.jobId = ret.jobId);
    this.doWhenHaveConnId = null;
    this.request = null;
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
      if (this.imageDataSubject !== null) {
        let fixed = this.fixMapSectionResult(mapSectionResult);
        this.imageDataSubject.next(fixed);

        if (isFinalSection) {
          console.log('Received the final section.');
          if (this.jobId === undefined) {
            console.log('No this on handling ImageData');
          }
          else {
            if (fixed.jobId === this.jobId) {
              console.log('Handling final job for this request.');

              this.imageDataSubject.complete();
              //this.jobId = -1;
            }
            else {
              console.log('Handling final job for previous request.');
            }
          }
        }
      }
    });

    this.hubConnection.on("JobCancelled", (jobId: number) => {
      console.log("Received confirmation that job with id: " + jobId + " was cancelled.");
    });

    this.hubConnection.start().then(() => {
      this.requestConnId();
    });
  }

  private fixMapSectionResult(raw: any): MapSectionResult {
    let ts: any = raw.MapSection;
    let ms = new MapSection(new Point(ts.SectionAnchor.X, ts.SectionAnchor.Y), new CanvasSize(ts.CanvasSize.Width, ts.CanvasSize.Height));
    let result = new MapSectionResult(raw.JobId, ms, raw.ImageData as number[]);
    return result;
  }

  public send(message: string) {
    this.hubConnection.invoke("Echo", message);
  }

  private requestConnId() {
    this.hubConnection.invoke("RequestConnId");
  }

  //private getAvg(data: number[]): number {

  //  let result = 0;
  //  let ptr: number;
  //  for (ptr = 0; ptr < data.length; ptr++) {
  //    result += data[ptr];
  //  }

  //  return result / data.length;
  //}


}
