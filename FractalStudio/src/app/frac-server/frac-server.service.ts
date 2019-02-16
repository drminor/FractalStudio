import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { IBox } from '../m-map/m-map-common';
import { isNullOrUndefined } from 'util';


export interface Cat {
  name: string;
}

export interface TPoint {
  x: number;
  y: number;
}

//export class Coords {
//  LeftBot: DPoint;
//  RightTop: DPoint;
//}

@Injectable({
  providedIn: 'root'
})
export class FracServerService {

  public baseUrl = 'https://localhost:44330';
  public controllerPath = '/api/values';

  public controllerPath2 = '/api/mrender';

  constructor(private http: HttpClient) { }

  sendCoords(box: IBox): Observable<IBox> {
    let res: Observable<IBox> = this.http.post<IBox>(this.baseUrl + this.controllerPath2, box);
    //res.subscribe(this.useBox);
    return res;
  }

  useTPoint(x: TPoint) {
    console.log('The Y value is ' + x.y);
  }

  useBox(x: IBox) {
    console.log('The TopRight Y value is ' + x.topRight.y);
  }

  sendByteRequest(): Observable<ArrayBuffer> {
    //const headers = new HttpHeaders().set('content-type', 'application/octet-stream');
    //headers.set('
    //const params = new HttpParams();

    let target = this.baseUrl + this.controllerPath2;

    let res = this.http.get(target, { /*headers: headers,*/ responseType: 'arraybuffer' });

    //res.subscribe(this.useBytes);

    return res;
  }


  useBytes(x: ArrayBuffer) {
    if (isNullOrUndefined(x)) {
      console.log('The byte array is null.');
    }
    else {
      console.log('The byte array is ' + x.byteLength + ' long.');
    }
  }

  getAllCats(): Observable<Cat[]> {
    return this.http.get<Cat[]>(this.baseUrl + this.controllerPath);
  }

  getCat(name: string): Observable<Cat> {
    return this.http.get<Cat>(this.baseUrl + this.controllerPath + '/' + name);
  }

  insertCat(cat: Cat): Observable<Cat> {
    return this.http.post<Cat>(this.baseUrl + this.controllerPath + '/', cat);
  }

  updateCat(cat: Cat): Observable<void> {
    return this.http.put<void>(this.baseUrl + this.controllerPath + '/' + cat.name, cat);
  }

  deleteCat(name: string) {
    return this.http.delete(this.baseUrl + this.controllerPath + '/' + name);
  }
}
