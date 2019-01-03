export class ColorNumbers {

  //black: number = 65536 * 65280; // FF00 0000
  //white: number; // = -1 + 65536 * 65536; // FFFF FFFF
  //red: number;
  //green: number;
  //blue: number;

  public static white: number = ColorNumbers.getColor(255, 255, 255);
  public static black: number = ColorNumbers.getColor(0, 0, 0);
  public static red: number = ColorNumbers.getColor(255, 0, 0);
  public static green: number = ColorNumbers.getColor(0, 255, 0);
  public static blue: number = ColorNumbers.getColor(0, 0, 255);


  //constructor() {
  //  this.white = ColorNumbers.getColor(255, 255, 255);
  //  this.red = ColorNumbers.getColor(255, 0, 0);
  //  this.green = ColorNumbers.getColor(0, 255, 0);
  //  this.blue = ColorNumbers.getColor(0, 0, 255);
  //}

  //data[y * canvasWidth + x] =
  //  (255 << 24) |	// alpha
  //  (value << 16) |	// blue
  //  (value << 8) |	// green
  //  value;		// red

  public static getColor(r: number, g: number, b: number, alpha?: number): number {

    if (r > 255 || r < 0) throw new RangeError('R must be between 0 and 255.');
    if (g > 255 || g < 0) throw new RangeError('G must be between 0 and 255.');
    if (b > 255 || b < 0) throw new RangeError('B must be between 0 and 255.');

    if (alpha === undefined) {
      alpha = 255;
    } else {
      if (alpha > 255 || alpha < 0) throw new RangeError('Alpha must be between 0 and 255.');
    }

    let result: number = alpha << 24;
    result |= b << 16;
    result |= g << 8;
    result |= r;

    return result;
  }

  public static getColorFromComps(comps: number[]): number {
    let result = ColorNumbers.getColor(comps[0], comps[1], comps[2], comps[3]);
    return result;
  }

  public static getColorFromCssColor(cssColor: string): number {
    let comps = ColorNumbers.getColorComponentsFromCssColor(cssColor);
    let result = ColorNumbers.getColorFromComps(comps);
    return result;
  }

  // Returns array of numbers: r,g,b,a Where r,g and b are 0-255 integers and a is 0-1 float.
  public static getColorComponents(cNum: number): number[] {
    let result: number[] = new Array<number>(4);

    // Mask all but the lower 8 bits.
    result[0] = cNum & 0x000000FF;

    // Shift down by 8 bits and then mask.
    result[1] = cNum >> 8 & 0x000000FF;
    result[2] = cNum >> 16 & 0x000000FF;
    result[3] = 255; //cNum >> 24 & 0x000000FF;

    return result;
  }

  // Returns array of numbers: r,g,b,a Where r,g and b are 0-255 integers and a is 0-1 float.
  public static getColorComponentsFromCssColor(cssColor: string): number[] {
    let result: number[] = new Array<number>(4);

    let bs = cssColor.slice(1, 3);
    let gs = cssColor.slice(3, 5);
    let rs = cssColor.slice(5, 7);

    result[0] = parseInt(bs, 16);
    result[1] = parseInt(gs, 16);
    result[2] = parseInt(rs, 16);
    result[3] = 255; //parseInt(cssColor.slice(7,8), 16);

    return result;
  }

  // TODO: handle conversion from Alpha in range from 0.0 to 1.0 to range: 0 to 255.
  public static getColorComponentsFromRgba(rgbaColor: string): number[] {
    let result: number[] = new Array<number>(4);

    //let rgbaObject: object = JSON.parse(rgbaColor);

    //return 'rgba(200,20,40,1)';

    let lst = rgbaColor.replace('rgba(', '');
    lst = lst.replace(')', '');

    let comps: string[] = lst.split(',');

    result[0] = parseInt(comps[0], 10);
    result[1] = parseInt(comps[1], 10);
    result[2] = parseInt(comps[2], 10);
    result[3] = 255; //parseInt(comps[3], 10);

    return result;
  }

  public static getRgbHex(comps: number[]): string {

    let result: string = '#'
      + ('0' + comps[0].toString(16)).slice(-2)
      + ('0' + comps[1].toString(16)).slice(-2)
      + ('0' + comps[2].toString(16)).slice(-2);

    //return "#FFFF00";
    return result;
  }

  // TODO: handle conversion from Alpha in range from 0.0 to 1.0 to range: 0 to 255.
  public static getRgbaString(comps: number[]): string {
    let result: string = 'rgba('
      + comps[0].toString(10) + ','
      + comps[1].toString(10) + ','
      + comps[2].toString(10) + ','
      + '1'
      + ')';

    //return 'rgba(200,20,40,1)';
    return result;
  }

  public static get1DPos(imageData: Uint8ClampedArray, cComps: number[]): number {

    let result = 0;

    let minDiff = 1000;

    let ptr: number;
    for (ptr = 0; ptr < imageData.length; ptr += 4) {
      let curDiff = Math.abs(cComps[0] - imageData[ptr])
        + Math.abs(cComps[1] - imageData[ptr + 1])
        + Math.abs(cComps[2] - imageData[ptr + 2]);

      if (curDiff < minDiff) {
        minDiff = curDiff;
        result = ptr;
      }

    }

    result = result / 4;

    return result;
  }

}
