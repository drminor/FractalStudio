import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
//import { share } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import * as signalR from '@aspnet/signalr';
import * as msgPackHubProtocol from '@aspnet/signalr-protocol-msgpack';

import { SMapWorkRequest, SCoordsWorkRequest, HistogramRequest, MapSection, MapSectionResult } from '../m-map/m-map-common-server';
import { Point, CanvasSize } from '../m-map/m-map-common';

interface IHaveConnIdCallback {
  (connId: string): void;
}

@Injectable()
export class FracServerService {

  public baseUrl = 'https://localhost:44330';
  public controllerPath = '/api/mrender';
  public transformControllerPath = '/api/transform';
  public histogramControllerPath = '/api/histogram';

  public hubUrl = '/hubs/mgen';

  public hubConnection: signalR.HubConnection;
  public hubConnId: string;
  public lastMessageReceived: string;

  private doWhenHaveConnId: IHaveConnIdCallback;

  private imageDataSubject: Subject<MapSectionResult>;
  private jobId: number;


  private request: SMapWorkRequest;

  constructor(private http: HttpClient) {
    this.hubConnection = null;
    this.hubConnId = null;
    this.lastMessageReceived = null;
    this.doWhenHaveConnId = null;

    this.imageDataSubject = null;
    this.jobId = -1;
    this.request = null;
  }

  public get haveHubConnection(): boolean {
    let result = this.hubConnId !== null;
    return result;
  }

  public get JobId(): number {
    let result = this.jobId;
    return result;
  }

  // -- Map Work Request
  public submitJob(request: SMapWorkRequest): Observable<MapSectionResult> {
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

  // -- Transform Request
  public submitCoordsTransformRequest(cRequest: SCoordsWorkRequest): Observable<SCoordsWorkRequest> {
    console.log('Submitting a Transform Request with type: ' + cRequest.transformType + '.');
    let res: Observable<SCoordsWorkRequest> = this.http.post<SCoordsWorkRequest>(this.baseUrl + this.transformControllerPath, cRequest);

    return res;
  }

  // -- Histogram
  public getEntireHistorgram(): Observable<HistogramRequest> {
    if (this.jobId === -1) {
      console.log('The job id is -1 on getEntireHistogram.');
      return null;
    }
    console.log('The job id is ' + this.jobId + ' on getEntireHistogram.');

    let hRequest = new HistogramRequest(this.jobId, null, null);
    let res: Observable<HistogramRequest> = this.http.post<HistogramRequest>(this.baseUrl + this.histogramControllerPath, hRequest);

    //res.subscribe(resp => this.histRequestResponseHandler(resp));
    return res;
  }

  //private histRequestResponseHandler(hRequest: HistogramRequest) {
  //  if (hRequest.jobId !== this.jobId) {
  //    console.log('The job ids dont match during handling the histRequestResponse.');
  //  }
  //  console.log('Handling histRequestResponse. The result has ' + hRequest.values.length + ' entries.');
  //}

  // -- Cancel Job
  public cancelJob(deleteRepo: boolean): Observable<SMapWorkRequest> {
    if (this.jobId === -1) {
      return null;
    }

    //if (this.imageDataSubject !== null) {
    //  this.imageDataSubject.complete();
    //}

    let jobName = deleteRepo ? 'delJobAndRepo' : 'delJob';

    let delRequest = new SMapWorkRequest(jobName, null, null, null, 0);
    delRequest.jobId = this.jobId;
    delRequest.connectionId = 'delete';
    let res: Observable<SMapWorkRequest> = this.http.post<SMapWorkRequest>(this.baseUrl + this.controllerPath, delRequest);
    
    //res.subscribe(resp => this.delRequestResponseHandler(resp));
    return res;
  }

  //// HAVING TWO SUBSCRIBERS causes the request to be submitted twice.
  //// If this is required use RxShare
  //private delRequestResponseHandler(delRequest: SMapWorkRequest) {
  //  if (delRequest.jobId !== this.jobId) {
  //    console.log('The job ids dont match during handling the delRequestResponse.');
  //  }
  //  console.log('Handling delRequestResponse. Setting the jobId to -1.');
  //  this.jobId = -1;
  //}
  
  private submitJobInternal(): void {
    console.log('The job is requesting an interation count of ' + this.request.maxIterations + '.');
    let res: Observable<SMapWorkRequest> = this.http.post<SMapWorkRequest>(this.baseUrl + this.controllerPath, this.request);
    res.subscribe(ret => this.sMapWorkRequestHandler(ret));
    this.doWhenHaveConnId = null;
    this.request = null;
  }

  private sMapWorkRequestHandler(request: SMapWorkRequest) {
    console.log('Handling a SMapWorkRequest response. Setting the JobId to ' + request.jobId + '.');
    this.jobId = request.jobId;
  }

  private startHubConnection(url: string) {

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(url)
      .withHubProtocol(new msgPackHubProtocol.MessagePackHubProtocol())
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
