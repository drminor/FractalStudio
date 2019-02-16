
export class apRationalSettings {

  public posExp: number;
  public negExp: number;

  public MaxDp: number;
  public MaxPower: number;

  public IncludeSignForZero: boolean;
  public IncludeTrailingZeros: boolean;

  constructor(public dp: number, public rm: RoundingMode) {
    this.posExp = 8;
    this.negExp = 8;

    this.MaxDp = 1000000;
    this.MaxPower = 1000000;

    this.IncludeSignForZero = false;
    this.IncludeTrailingZeros = false;
  }

  public parse(sn: string | number): apRational {

    let result = apRational.parse(sn, this);
    return result;
  }

  public getNewZero(): apRational {
    let result = new apRational(true, 0, [0], this);
    return result;
  }
}

export class apRational {

  // Error messages.
  static NAME = '[apRational]';
  static INVALID = apRational.NAME + ' Invalid';
  static INVALID_DP = apRational.INVALID + ' decimal places';
  static INVALID_RM = apRational.INVALID + ' rounding mode';
  static DIV_BY_ZERO = apRational.NAME + ' Division by zero';

  static NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;

  constructor(public sign: boolean, public exp: number, public cof: number[], public settings: apRationalSettings) { }

  public static parse(sn: string | number, settings: apRationalSettings): apRational {

    let s: string;

    // Minus zero?
    if (sn === 0 && 1 / sn < 0) {
      s = '-0';
    }
    else {
      s = sn + '';
      if (!apRational.NUMERIC.test(s)) {
        throw Error(apRational.INVALID + ' number');
      }
    }

    // Determine sign.
    let sign: boolean;

    if (s.charAt(0) === '-') {
      sign = false;
      s = s.slice(1);
    }
    else {
      sign = true;
    }

    // Decimal point?
    let e = s.indexOf('.');

    if (e > -1) {
      s = s.replace('.', '');
    }

    // Exponential form?
    let i = s.search(/e/i);

    if (i > 0) {
      // Determine exponent.
      if (e < 0) e = i;

      e += +s.slice(i + 1);
      s = s.substring(0, i);
    }
    else if (e < 0) {
      // Integer.
      e = s.length;
    }

    let exp: number;
    let cof: number[];
    let nl = s.length;

    // Determine leading zeros.
    for (i = 0; i < nl && s.charAt(i) === '0';)++i;

    if (i === nl) {
      // Zero.
      exp = 0;
      cof = [0];
    }
    else {
      // Determine trailing zeros.
      for (; nl > 0 && s.charAt(--nl) === '0';);

      exp = e - i - 1;
      cof = [];

      // Convert string to array of digits without leading/trailing zeros.
      for (e = 0; i <= nl;) cof[e++] = +s.charAt(i++);
    }

    let result = new apRational(sign, exp, cof, settings);
    return result;
  }

  public stringify(): string {
    let result: string;

    if (this.exp >= this.settings.posExp || this.exp <= this.settings.negExp) {
      result = this.toExponential();
    }
    else {
      result = this.toFixed();
    }

    return result;
  }

  public clone(): apRational {
    let newCof = this.cof.slice(0);
    let result = new apRational(this.sign, this.exp, newCof, this.settings);
    return result
  }

  //  P.toExponential = function (dp) {
  //    return stringify(this, 1, dp, dp);

  //  P.toFixed = function (dp) {
  //    return stringify(this, 2, dp, this.e + dp);

  //  P.toPrecision = function (sd) {
  //    return stringify(this, 3, sd, sd - 1);

  public toFixed(): string {
    return this.toFixedCustom(this.settings.dp, this.settings.rm, this.settings.IncludeSignForZero);
  }

  public toFixedCustom(dp: number, roundingMode: RoundingMode, includeSignForZero: boolean): string {

    if (!Number.isInteger(dp) || dp < 0 || dp > this.settings.MaxDp) {
      // Consider using ~~dp !== dp instead of Number.isInteger(dp)
      throw new Error(apRational.INVALID_DP);
    }

    let x: apRational;

    let k = dp + 1;

    // n is the index of the digit that may be rounded up.
    let n = dp;

    // Round?
    if (this.cof.length > k) {
      x = this.clone().roundCustom(n, roundingMode, false);

      // Recalculate k as x.exp may have changed if value rounded up.
      k = x.exp + dp + 1;
    }
    else {
      x = this;
    }

    //// Append zeros?
    //if(this.IncludeTrailingZeros) 
    //  for (; x.cof.length < k;) x.cof.push(0);

    let e = x.exp;
    let s = x.cof.join('');
    n = s.length;

    if (e < 0) {
      for (; ++e;) s = '0' + s;
      s = '0.' + s;
    }
    else if (e > 0) {
      if (++e > n)
        for (e -= n; e--;) s += '0';
      else if (e < n)
        s = s.slice(0, e) + '.' + s.slice(e);
    }
    else if (n > 1)
      s = s.charAt(0) + '.' + s.slice(1);

    // True if we are 0.
    let z = !x.cof[0];

    return !x.sign && (!z || includeSignForZero) ? '-' + s : s;
  }

  public toExponential(): string {
    return this.toExponentialCustom(this.settings.dp, this.settings.rm, this.settings.IncludeSignForZero);
  }

  public toExponentialCustom(dp: number, roundingMode: RoundingMode, includeSignForZero: boolean): string {

    if (!Number.isInteger(dp) || dp < 0 || dp > this.settings.MaxDp) {
      // Consider using ~~dp !== dp instead of Number.isInteger(dp)
      throw new Error(apRational.INVALID_DP);
    }

    let k = dp + 1;

    // n is the index of the digit that may be rounded up.
    let n = dp - this.exp;

    let x: apRational;

    // Round?
    if (this.cof.length > k) {
      x = this.clone().roundCustom(n, roundingMode, false);
    }
    else {
      x = this;
    }

    //// Append zeros?
    //if (this.IncludeTrailingZeros)
    //  for (; x.cof.length < k;) x.cof.push(0);

    let e = x.exp;
    let s = x.cof.join('');
    n = s.length;

    s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

    // True if we are 0.
    let z = !x.cof[0];

    return !x.sign && (!z || includeSignForZero) ? '-' + s : s;
  }

  public round(): apRational {
    let result = this.roundCustom(this.settings.dp, this.settings.rm, false);
    return result;
  }

  /**
    *
    * @param {number} dp - Number of digits after the decimal
    * @param {RoundingMode} rm - Rounding Mode
    * @param {boolean} more - true if you want force rounding up when the last digit is 5. Useful if this is called after a division and the division operation truncates the mantissa.
    * @returns {void}
    *
    */
  public roundCustom(dp: number, rm: RoundingMode, more: boolean): apRational {
    let xc = this.cof;
    let i = this.exp + dp + 1;

    if (i < xc.length) {
      if (rm === RoundingMode.HalfUp) {

        // xc[i] is the digit after the digit that may be rounded up.
        more = xc[i] >= 5;
      } else if (rm === RoundingMode.HalfEven) {

        let mf = this.getMoreForHalfEven(xc, i, more);

        more = i > -1 && (xc[i] > 5 || xc[i] === 5 && (more || xc[i + 1] !== undefined || 0 !== (xc[i - 1] & 1)));
        if (mf !== more) throw new Error('mf != more');

      } else if (rm === RoundingMode.Up) {
        more = more || !!xc[0];
      } else {
        more = false;
        if (rm !== RoundingMode.Down) throw Error(apRational.INVALID_RM);
      }

      if (i < 1) {
        xc.length = 1;

        if (more) {
          // 1, 0.1, 0.01, 0.001, 0.0001 etc.
          this.exp = -dp;
          xc[0] = 1;
        } else {
          // Zero.
          xc[0] = 0;
          this.exp = 0;
        }
      } else {

        // Remove any digits after the required decimal places.
        xc.length = i--;

        // Round up?
        if (more) {

          // Rounding up may mean the previous digit has to be rounded up.
          for (; ++xc[i] > 9;) {
            xc[i] = 0;
            if (!i--) {
              ++this.exp;
              xc.unshift(1);
            }
          }
        }

        // Remove trailing zeros.
        for (i = xc.length; !xc[--i];) xc.pop();
      }
    }

    return this;
  }

  private getMoreForHalfEven(cof: number[], i: number, more: boolean): boolean {

    let result: boolean;

    if (i < 0) {
      result = false;
    }
    else if (cof[i] > 5) {
      result = true; // above 5, round up.
    }
    else if (cof[i] === 5) {
      // at 5
      if (more)
        // division operation truncated
        result = true;
      //else if (i < 0)
      //  // ??
      //  result = true;
      else if (cof[i + 1] !== undefined)
        // no digits past
        result = true;
      else if (0 !== (cof[i - 1] & 1))
        // previous digit is odd
        result = true;
      else
        // do not round up
        result = false
    }
    else {
      // < 5, do not round up
      result = false;
    }

    return result;
  }

  public abs(x: apRational): apRational {
    x.sign = true;
    return x;
  }

  public divide(y: apRational): apRational {

    // Divisor is zero?
    if (!y.cof[0]) throw Error(apRational.DIV_BY_ZERO);

    // Dividend is 0? Return +-0.
    if (!this.cof[0]) {
      this.sign = this.sign === y.sign;
      return this;
    }

    //y = y.clone();

    let a = this.cof;
    let b = y.cof;

    //let sn = this.sign === y.sign;

    //let q = y.clone();
    //q.cof = [];
    //q.exp = this.exp - y.exp;
    //q.sign = this.sign === y.sign;

    let q = new apRational(this.sign === y.sign, this.exp - y.exp, [], this.settings);

    let bz = b.slice();
    let bl = b.length;
    let ai = bl;

    let al = a.length;

    let r = a.slice(0, bl);
    let rl = r.length;

    let qc = q.cof;
    let qi = 0;
    let d = this.settings.dp + q.exp + 1;    // number of digits of the result

    let k = d < 0 ? 0 : d;

    // Create version of divisor with leading zero.
    bz.unshift(0);

    // Add zeros to make remainder as long as divisor.
    for (; rl++ < bl;) r.push(0);

    let n: number;
    let cmp: number;
    let ri: number;

    do {
      // n is how many times the divisor goes into current remainder.
      for (n = 0; n < 10; n++) {

        // Compare divisor and remainder.
        rl = r.length;
        if (bl !== rl) {
          cmp = bl > rl ? 1 : -1;
        }
        else {
          for (ri = -1, cmp = 0; ++ri < bl;) {
            if (b[ri] !== r[ri]) {
              cmp = b[ri] > r[ri] ? 1 : -1;
              break;
            }
          }
        }

        // If divisor < remainder, subtract divisor from remainder.
        if (cmp < 0) {

          // Remainder can't be more than 1 digit longer than divisor.
          // Equalise lengths using divisor with extra leading zero?
          //rl = bl;
          let bt = rl === bl ? b : bz;

          for (; rl;) {
            if (r[--rl] < bt[rl]) {
              ri = rl;
              for (; ri && !r[--ri];) r[ri] = 9;
              --r[ri];
              r[rl] += 10;
            }
            r[rl] -= bt[rl];
          }

          for (; !r[0];) r.shift();
        }
        else {
          break;
        }
      }

      // Add the digit n to the result array.
      qc[qi++] = cmp ? n : ++n;

      // Update the remainder.
      if (r[0] && cmp)
        r[rl] = a[ai] || 0;
      else
        r = [a[ai]];

    } while ((ai++ < al || r[0] !== undefined) && k--);

    // Leading zero? Do not remove if result is simply zero (qi == 1).
    if (!qc[0] && qi !== 1) {

      // There can't be more than one zero.
      qc.shift();
      q.exp--;
    }

    // Round?
    if (qi > d)
      q.roundCustom(this.settings.dp, this.settings.rm, r[0] !== undefined);

    return q;
  }

  public multiply(y: apRational): apRational {

    // Determine sign of result.
    this.sign = this.sign === y.sign;

    // Return signed 0 if either 0.
    if (!this.cof[0] || !y.cof[0]) {
      return this;
    }

    //y = y.clone();

    let a = this.cof.length;
    let b = y.cof.length;


    //let xc = this.cof;
    //let yc = y.cof;
    //let i = this.exp;
    //let j = y.exp;

    // Initialise exponent of result as x.e + y.e.
    this.exp = this.exp + y.exp;

    let xc: number[];
    let yc: number[];
    let i: number;
    let j: number;

    // If array xc has fewer digits than yc, swap xc and yc, and lengths.
    if (a < b) {
      xc = y.cof
      yc = this.cof;
      j = a;
      a = b;
      b = j;
    }
    else {
      xc = this.cof;
      yc = y.cof;
    }

    j = a + b;
    let c = new Array(j);

    // Initialise coefficient array of result with zeros.
    for (; j--;) c[j] = 0;

    // Multiply.

    // i is initially xc.length.
    for (i = b; i--;) {
      b = 0;

      // a is yc.length.
      for (j = a + i; j > i;) {

        // Current sum of products at this digit position, plus carry.
        b = c[j] + yc[i] * xc[j - i - 1] + b;
        c[j--] = b % 10;

        // carry
        b = b / 10 | 0;
      }

      c[j] = (c[j] + b) % 10;
    }

    // Increment result exponent if there is a final carry, otherwise remove leading zero.
    if (b)
      ++this.exp;
    else
      c.shift();

    // Remove trailing zeros.
    for (i = c.length; !c[--i];) c.pop();
    this.cof = c;

    this.roundCustom(this.settings.dp, this.settings.rm, false);

    return this;
  }

  public plus(y: apRational): apRational {

    if (this.sign !== y.sign) {
      return this.minusInt(y, true);
    }
    else {
      return this.plusInt(y, false);
    }
  }

  public minus(y: apRational): apRational {

    if (this.sign !== y.sign) {
      return this.plusInt(y, true);
    }
    else {
      return this.minusInt(y, false);
    }
  }

  private plusInt(y: apRational, negateY: boolean): apRational {

    if (negateY)
      this.sign = !y.sign;
    else
      this.sign = y.sign;

    let xc = this.cof;
    let yc = y.cof;

    // Either zero?
    if (!xc[0] || !yc[0]) {

      if (yc[0]) {
        // y is not zero, therefor x is: return 0 + y, i.e., y
        this.sign = y.sign;
        this.exp = y.exp;
        this.cof = y.cof.slice(0);
        return this;
      }
      else {
        // y is zero; x + 0 = x
        return this;
      }
    }

    xc = xc.slice();

    let xe = this.exp;
    let ye = y.exp;
    let t: number[];

    let a = xe - ye;

    // Prepend zeros to equalise exponents.
    // Note: reverse faster than unshifts.
    if (a) {
      if (a > 0) {
        ye = xe;
        t = yc;
      } else {
        a = -a;
        t = xc;
      }

      t.reverse();
      for (; a--;) t.push(0);
      t.reverse();
    }

    // Point xc to the longer array.
    if (xc.length - yc.length < 0) {
      t = yc;
      yc = xc;
      xc = t;
    }

    a = yc.length;

    let b: number;
    // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
    for (b = 0; a; xc[a] %= 10) b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;

    // No need to check for zero, as +x + +y != 0 && -x + -y != 0

    if (b) {
      xc.unshift(b);
      ++ye;
    }

    // Remove trailing zeros.
    for (a = xc.length; xc[--a] === 0;) xc.pop();

    this.exp = ye;
    this.cof = xc;

    return this;
  }

  private minusInt(y: apRational, negateY: boolean): apRational {

    if (negateY)
      this.sign = !y.sign;
    else
      this.sign = y.sign;


    let xc = this.cof;
    let yc = y.cof;

    // Either zero?
    if (!xc[0] || !yc[0]) {

      if (yc[0]) {
        // y is not zero, therefor x is: return 0 - y, i.e., -y
        this.sign = !this.sign;
        this.exp = y.exp;
        this.cof = y.cof.slice(0);
        return this;
      }
      else {
        // y is zero; x - 0 = x: return x
        return this;
      }
    }

    xc = xc.slice();

    let xe = this.exp;
    let ye = y.exp;
    let t: number[];

    let a = xe - ye;
    let b: number;
    let xlty: boolean;
    let i: number;
    let j: number;

    // Determine which is the bigger number. Prepend zeros to equalise exponents.
    if (a) {
      xlty = a < 0;
      if (xlty) {
        a = -a;
        t = xc;
      } else {
        ye = xe;
        t = yc;
      }

      t.reverse();
      for (b = a; b--;) t.push(0);
      t.reverse();
    } else {

      // Exponents equal. Check digit by digit.
      j = ((xlty = xc.length < yc.length) ? xc : yc).length;

      for (a = b = 0; b < j; b++) {
        if (xc[b] !== yc[b]) {
          xlty = xc[b] < yc[b];
          break;
        }
      }
    }

    // x < y? Point xc to the array of the bigger number.
    if (xlty) {
      t = xc;
      xc = yc;
      yc = t;
      this.sign = !this.sign;
    }

    /*
     * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
     * needs to start at yc.length.
     */
    if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;

    // Subtract yc from xc.
    for (b = i; j > a;) {
      if (xc[--j] < yc[j]) {
        for (i = j; i && !xc[--i];) xc[i] = 9;
        --xc[i];
        xc[j] += 10;
      }

      xc[j] -= yc[j];
    }

    // Remove trailing zeros.
    for (; xc[--b] === 0;) xc.pop();

    // Remove leading zeros and adjust exponent accordingly.
    for (; xc[0] === 0;) {
      xc.shift();
      --ye;
    }

    if (!xc[0]) {

      // n - n = +0
      this.sign = true;

      // Result must be zero.
      ye = 0;
      xc = [0];
    }

    this.exp = ye;
    this.cof = xc;

    return this;
  }

  public toString(): string {
    let result = (this.sign ? '' : '-') + this.cof.join('') + 'e' + this.exp;
    return result;
  }

}

export enum RoundingMode {
  Down,
  HalfUp,
  HalfEven,
  Up
}

class ColorNumbers {

  public static white: number = ColorNumbers.getColor(255, 255, 255);
  public static black: number = ColorNumbers.getColor(0, 0, 0);
  public static red: number = ColorNumbers.getColor(255, 0, 0);
  public static green: number = ColorNumbers.getColor(0, 255, 0);
  public static blue: number = ColorNumbers.getColor(0, 0, 255);

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

const MAX_CANVAS_WIDTH: number = 50000;
const MAX_CANVAS_HEIGHT: number = 50000;

export interface IPoint {
  x: number;
  y: number;

  add(amount: number): IPoint;
  mult(amount: number): IPoint;

  scale(factor: IPoint): IPoint;
  translate(factor: IPoint): IPoint;

  isEqual(p: IPoint): boolean;
}

export interface ICanvasSize {
  width: number;
  height: number;

  mult(amount: number): ICanvasSize;
  scale(factor: ICanvasSize): ICanvasSize;
}

export interface IBox {
  botLeft: IPoint;  
  topRight: IPoint;
  width: number;
  height: number;

  isUpsideDown: boolean;
  isBackwards: boolean;

  absHeight: number;
  absTop: number;
  absWidth: number;
  absLeft: number;

  size: ICanvasSize;
  absSize: ICanvasSize;

  addX(amount: number): IBox;
  addY(amount: number): IBox;

  mult(amount: number): IBox;
  scale(factor: ICanvasSize): IBox;
  translate(factor: IBox): IBox;

  getNormalizedBox(): IBox;
  getShiftedBox(dir: string, percent: number): IBox;
  getExpandedBox(percent: number): IBox;

  isEqual(box: IBox): boolean;
  toString(): string;
}

export interface IMapInfo {
  coords: IBox;
  bottomLeft: IPoint;
  topRight: IPoint;
  maxIterations: number;
  threshold: number;
  iterationsPerStep: number;
  upsideDown: boolean;
  isEqual(other: IMapInfo): boolean;

  toString(): string
}

export interface IMapWorkingData {
  canvasSize: ICanvasSize;
  mapInfo: IMapInfo;
  sectionAnchor: IPoint;

  elementCount: number;
  curIterations: number;
  workingVals: CurWorkVal[];

  // The number of times each point has been iterated.
  cnts: Uint16Array;
  colorMap: ColorMap;

  getLinearIndex(c: IPoint): number;
  doIterationsForAll(iterCount: number): boolean;

  getPixelData(): Uint8ClampedArray;

  iterationCountForNextStep(): number;
  getHistogram(): Histogram;
}

export class Point implements IPoint {

  constructor(public x: number, public y: number) { }

  public static fromStringVals(strX: string, strY: string): IPoint {
    let xNum = parseFloat(strX);
    let yNum = parseFloat(strY);
    let result: IPoint = new Point(xNum, yNum);
    return result;
  }

  public add(amount: number): IPoint {
    return new Point(this.x + amount, this.y + amount);
  }

  public mult(amount: number): IPoint {
    return new Point(this.x * amount, this.y * amount);

  }

  public scale(factor: IPoint): IPoint {
    return new Point(this.x * factor.x, this.y * factor.y);
  }

  public translate(factor: IPoint): IPoint {
    return new Point(this.x + factor.x, this.y + factor.y);
  }

  public isEqual(p: IPoint): boolean {
    if (p === null) return false;
    if (p.x !== this.x) return false;
    if (p.y !== this.y) return false;

    return true;
  }
}

export class PointAp {
  constructor(public x: apRational, public y: apRational) { }
}

export class BoxAp {
  constructor(public botLeft: PointAp, public topRight: PointAp) { }
  
  public static fromBox(bx: Box, apRatSettings: apRationalSettings): BoxAp {

    let result = new BoxAp(
      new PointAp(
        apRatSettings.parse(bx.botLeft.x),
        apRatSettings.parse(bx.botLeft.y)
        ),
      new PointAp(
        apRatSettings.parse(bx.topRight.x),
        apRatSettings.parse(bx.topRight.y)
      )
    )

    return result;

  }
}

export class Box implements IBox {
  constructor(public botLeft: IPoint, public topRight: IPoint) { }

  public static fromPointExtent(botLeft: IPoint, width: number, height: number): IBox {
    const result: IBox = new Box(botLeft, new Point(botLeft.x + width, botLeft.y + height));

    return result;
  }

  public get width(): number {
    return this.topRight.x - this.botLeft.x;
  }

  public get height(): number {
    return this.topRight.y - this.botLeft.y;
  }

  public get isUpsideDown(): boolean {
    return this.topRight.y < this.botLeft.y;
  }

  public get isBackwards(): boolean {
    return this.topRight.x < this.botLeft.x;
  }

  public get absHeight(): number {
    if (this.isUpsideDown) {
      return this.botLeft.y - this.topRight.y;
    }
    else {
      return this.height;
    }
  }

  public get absTop(): number {
    if (this.isUpsideDown) {
      return this.botLeft.y;
    }
    else {
      return this.topRight.y;
    }
  }

  public get absWidth(): number {
    if (this.isBackwards) {
      return this.botLeft.x - this.topRight.x;
    }
    else {
      return this.width;
    }
  }

  public get absLeft(): number {
    if (this.isBackwards) {
      return this.botLeft.x;
    }
    else {
      return this.topRight.x;
    }
  }

  public get size(): ICanvasSize {
    return new CanvasSize(this.width, this.height);
  }

  public get absSize(): ICanvasSize {
    return new CanvasSize(this.absWidth, this.absHeight);
  }

  public getShiftedBox(dir: string, percent: number): IBox {
    let result: IBox;
    let delta: number;

    switch (dir) {
      case 'r':
        delta = this.width * percent / 100;
        result = this.addX(delta);
        break;
      case 'l':
        delta = this.width * percent / 100;
        result = this.addX(-1 * delta);
        break;
      case 'u':
        delta = this.height * percent / 100;
        result = this.addY(delta);
        break;
      case 'd':
        delta = this.height * percent / 100;
        result = this.addY(-1 * delta);
        break;
      default:
        console.log('GetShiftedCoords received unrecognized dir ' + dir + '.');
        result = this;
    }
    return result;
  }

  public addX(amount: number): IBox {
    let result = new Box(
      new Point(this.botLeft.x + amount, this.botLeft.y),
      new Point(this.topRight.x + amount, this.topRight.y)
    );
    return result;
  }

  public addY(amount: number): IBox {
    let result = new Box(
      new Point(this.botLeft.x, this.botLeft.y + amount),
      new Point(this.topRight.x, this.topRight.y + amount)
    );
    return result;
  }

  public mult(amount: number): IBox {

    let botLeft = new Point(this.botLeft.x * amount, this.botLeft.y * amount);
    let topRight = new Point(this.topRight.x * amount, this.topRight.y * amount);

    let result = new Box(botLeft, topRight);
    return result;
  }

  public scale(factor: ICanvasSize): IBox {

    console.log('The dif in x vs y factor on getScaledBox is ' + (factor.width - factor.height) + '.');

    let result = new Box(
      new Point(this.botLeft.x * factor.width, this.botLeft.y * factor.height),
      new Point(this.topRight.x * factor.width, this.topRight.y * factor.height)
    );
    return result;
  }

  public translate(factor: IBox): IBox {
    return new Box(this.botLeft.translate(factor.botLeft), this.topRight.translate(factor.topRight));
  }

  public getExpandedBox(percent: number): IBox {

    // 1/2 the amount of change for the width
    let deltaX = this.width * percent / 200;

    // 1/2 the amount of change for the width
    let deltaY = this.height * percent / 200;

    let botLeft = new Point(this.botLeft.x - deltaX, this.botLeft.y - deltaY);
    let topRight = new Point(this.topRight.x + deltaX, this.topRight.y + deltaY);

    let result = new Box(botLeft, topRight);
    return result;
  }

  public isEqual(box: IBox): boolean {

    if (box === null) {
      console.log('Comparing this box to null, returning NOT-EQUAL.');
      return false;
    }
    else
    {
      if (!this.botLeft.isEqual(box.botLeft)) {
        console.log('Comparing two boxes and found that they are NOT-EQUAL.');
        return false;
      }

      if (!this.topRight.isEqual(box.topRight)) {
        console.log('Comparing two boxes and found that they are NOT-EQUAL.');
        return false;
      }
    }

    console.log('Comparing two boxes and found that they are equal.');

    return true;
  }

  // Return a box of the same size and position
  // but make sure that the width and height are both positive.
  public getNormalizedBox(): IBox {

    let box = this;

    let sx: number;
    let sy: number;

    let ex: number;
    let ey: number;

    if (box.botLeft.x < box.topRight.x) {
      if (box.botLeft.y < box.topRight.y) {
        // Already in normal form.
        sx = box.botLeft.x;
        ex = box.topRight.x;
        sy = box.botLeft.y;
        ey = box.topRight.y;
      }
      else {
        // Width is already positive, reverse the y values.
        sx = box.botLeft.x;
        ex = box.topRight.x;
        sy = box.topRight.y;
        ey = box.botLeft.y;
      }
    }
    else {
      if (box.botLeft.y < box.topRight.y) {
        // Height is already positive, reverse the x values.
        sx = box.topRight.x;
        ex = box.botLeft.x;
        sy = box.botLeft.y;
        ey = box.topRight.y;
      } else {
        // Reverse both x and y values.
        sx = box.topRight.x;
        ex = box.botLeft.x;
        sy = box.topRight.y;
        ey = box.botLeft.y;
      }
    }

    let result = new Box(new Point(sx, sy), new Point(ex, ey));
    return result;
  }

  //private round(x: number): number {
  //  const result: number = parseInt((x + 0.5).toString(), 10);

  //  return result;
  //}

  public toString(): string {
    return 'sx:' + this.botLeft.x + ' ex:' + this.topRight.x + ' sy:' + this.botLeft.y + ' ey:' + this.topRight.y + '.';
  }
}

export class CanvasSize implements ICanvasSize {

  constructor(public width: number, public height: number) {
    if (!this.isReasonableExtent(this.width, MAX_CANVAS_WIDTH)) {
      console.log('A CanvasSize is being contructed with an invalid width.');
      alert('Width is invalid');
    }
    if (!this.isReasonableExtent(this.height, MAX_CANVAS_HEIGHT)) {
      console.log('A CanvasSize is being contructed with an invalid height.');
      alert('Height is invalid');
    }
  }

  public getScaledCanvas(amount: number): ICanvasSize {
    let result = new CanvasSize(this.width * amount, this.height * amount);
    return result;
  }

  public mult(amount: number): ICanvasSize {
    let result = new CanvasSize(this.width * amount, this.height * amount);
    return result;
  }

  public scale(factor: ICanvasSize): ICanvasSize {
    let result = new CanvasSize(this.width * factor.width, this.height * factor.height);
    return result;
  }

  isReasonableExtent(nVal:number, max:number): boolean {
    //return isFinite(nVal) && nVal > 0 && nVal <= max && Math.floor(nVal) === nVal;
    return isFinite(nVal) && nVal > 0 && nVal <= max;

  }
}

export class MapInfo implements IMapInfo {
  constructor(public coords: IBox, public maxIterations: number, public threshold: number, public iterationsPerStep: number) {
    if (coords === null) {
      throw new Error('When creating a MapInfo, the coords argument cannot be null.');
    }
  }

  public static fromPoints(bottomLeft: IPoint, topRight: IPoint, maxIterations: number, threshold: number, iterationsPerStep: number): IMapInfo {
    let coords: IBox = new Box(bottomLeft, topRight);
    let result: IMapInfo = new MapInfo(coords, maxIterations, threshold, iterationsPerStep);
    return result;
  }

  public static fromIMapInfo(mi: IMapInfo) {
    let bl = new Point(mi.coords.botLeft.x, mi.coords.botLeft.y);
    let tr = new Point(mi.coords.topRight.x, mi.coords.topRight.y);

    let coords: IBox = new Box(bl, tr);

    let threshold: number;
    if (mi.threshold === undefined) {
      threshold = 4;
    }
    else {
      threshold = mi.threshold;
    }

    let result: IMapInfo = new MapInfo(coords, mi.maxIterations, threshold, mi.iterationsPerStep);
    return result;

  }

  public get bottomLeft(): IPoint {
    return this.coords.botLeft;
  }

  public get topRight(): IPoint {
    return this.coords.topRight;
  }

  public get upsideDown(): boolean {
    return this.coords.isUpsideDown;
  }

  public isEqual(other: IMapInfo): boolean {
    if (other === null) return false;
    if (!this.coords.isEqual(other.coords)) return false;
    if (this.maxIterations !== other.maxIterations) return false;
    if (this.iterationsPerStep !== other.iterationsPerStep) return false;
    if (this.threshold !== other.threshold) return false;

    return true;
  }

  public toString(): string {
    return 'sx:' + this.coords.botLeft.x + ' ex:' + this.coords.topRight.x + ' sy:' + this.coords.botLeft.y + ' ey:' + this.coords.topRight.y + ' mi:' + this.maxIterations + ' ips:' + this.iterationsPerStep + '.';
  }
}

class IndexAndRunningSum {
  constructor(public idx: number, public runningSum: number) { }
}

export class HistArrayPair {
  constructor(public vals: Uint16Array, public occurances: Uint16Array) { }
}

export class HistEntry {
  constructor(public val: number, public occurances: number) { }

  public toString(): string {
    return this.val.toString() + ': ' + this.occurances.toString();
  }
}

export class Histogram {

  public entriesMap: Map<number, number>;

  private _maxVal: number = -1;

  public get maxVal(): number {
    if (this._maxVal === -1) {
      // The getHistEntries method also sets the value of _maxVal.
      this.getHistEntries();
    }

    return this._maxVal;
  }

  constructor() {
    this.entriesMap = new Map<number, number>();
  }

  /// ---  By Division ----

  public getEqualGroupsForAll(numberOfGroups: number): number[] {
    let result = this.getEqualGroupsForSubset(numberOfGroups, 0, -1);

    return result;
  }

  public getEqualGroupsForSubset(numberOfGroups: number, startCutOff: number, endCutOff: number): number[] {
    console.log('GetEqualGroupsForSubset is being called with cnt:' + numberOfGroups + ' sc:' + startCutOff + ' ec:' + endCutOff + '.');

    let hes = this.getHistEntries();

    // Get index of starting cutoff;
    let startIdx = this.getIndexFromVal(hes, startCutOff, 0);

    // Get index of ending cutoff;
    let maxIdx = this.getIndexOfMaxIter(hes, 5);
    maxIdx-- // Don't include the entry at the end that corresponds to the maxIterations.

    let endIdx: number;

    if (endCutOff === -1) {
      endIdx = maxIdx;
    }
    else {
      endIdx = this.getIndexFromVal(hes, endCutOff, startIdx);
      if (endIdx > maxIdx) endIdx = maxIdx;
    }

    let cnt = 1 + endIdx - startIdx;
    let result = this.getEqualGroupsForSubset_Int(hes, numberOfGroups, startIdx, cnt);
    return result;
  }

  public getEqualGroupsForSubset_Int(hes: HistEntry[], numberOfGroups: number, startIdx: number, cnt: number): number[] {
    console.log('GetEqualGroupsForSubset_Int is being called with cnt:' + numberOfGroups + ' si:' + startIdx + ' cnt:' + cnt + '.');

    let numOfResultsRemaining = numberOfGroups; // - 2;
    let result = Array<number>(numOfResultsRemaining);

    let resultPtr = 0;
    let resultEndPtr = numberOfGroups - 1; // - 3;

    while (cnt > 0 && numOfResultsRemaining > 0) {
      let sum = this.getSumHits(hes, startIdx, cnt);
      let target = parseInt((0.5 + sum / numberOfGroups).toString(), 10);

      if (hes[startIdx].occurances >= target) {
        result[resultPtr++] = hes[startIdx].val;
        startIdx++;
        cnt--;
      }
      else if (hes[startIdx + cnt - 1].occurances >= target) {
        result[resultEndPtr--] = hes[startIdx + cnt - 1].val;
        cnt--;
      }
      else {
        let bp = this.getForwardBreakPoint(hes, startIdx, cnt, target);
        result[resultPtr++] = hes[bp].val;
        let newStart = bp + 1;
        let ac = newStart - startIdx;
        startIdx = newStart;
        cnt -= ac;
      }

      numOfResultsRemaining--;
      numberOfGroups--;
    }

    return result;
  }

  // Returns the index into hes where the runnng sum is >= target.
  getForwardBreakPoint(hes: HistEntry[], startIdx: number, cnt: number, target: number): number {
    let runSum: number = 0;

    let ptr: number;
    for (ptr = startIdx; ptr < startIdx + cnt; ptr++) {
      runSum += hes[ptr].occurances;
      if (runSum >= target) {
        // We have found the breakpoint at ptr.
        return ptr;
      }
    }

    // The breakpoint is the last index into hes.
    let result = startIdx + cnt - 1;
    return result;
  }

  private getIndexFromVal(hes: HistEntry[], val: number, startIdx: number): number {

    let found = false;
    let result: number;

    let ptr: number;
    for (ptr = startIdx; ptr < hes.length; ptr++) {
      if (hes[ptr].val === val) {
        result = ptr;
        found = true;
        break;
      }
      if (hes[ptr].val > val) {
        result = ptr - 1;
        if (result < 0) result = 0;
        found = true;
        break;
      }
    }

    if (!found) {
      result = hes.length - 1;
    }

    return result;
  }

  getSumHits(hes: HistEntry[], startIdx: number, cnt: number): number {
    let result: number = 0;

    let ptr: number;
    for (ptr = startIdx; ptr < startIdx + cnt; ptr++) {
      result += hes[ptr].occurances;
    }

    return result;
  }

  getAverageOcc(hes: HistEntry[], startIdx: number, cnt: number): number {
    let total = this.getSumHits(hes, startIdx, cnt);
    let avg = total / cnt;

    return avg;
  }

  private getIndexOfMaxIter(hes: HistEntry[], numberOfEntriesToCheck: number): number {

    let result = 0;
    let curMaxVal: number = -1;

    let ptr: number;
    let start = hes.length - 1;
    let end = start - numberOfEntriesToCheck;
    if (end < 0) end = 0;

    for (ptr = start; ptr >= end; ptr--) {
      if (hes[ptr].occurances > curMaxVal) {
        curMaxVal = hes[ptr].occurances;
        result = ptr;
      }
    }

    if (result !== start) {
      // Perhaps there is no large entry at the end for the maxInterations
      // If the maximum value found is less than 5 times the average occurances
      // then just use the last entry.
      let avg = this.getAverageOcc(hes, 0, hes.length);

      if (curMaxVal < avg * 5) {
        result = start;
      }
      else {
        // We did find a large entry near the end, but it was not at the very end.
        let cnt = end - start;
        console.log('The maximum value of the last ' + cnt + ' histogram entries is not the last entry.');
      }
    }

    return result;
  }

  /// --- End By Division ---

  /// --- By Percentages ---

  public getCutoffs(percentages: number[]): number[] {
    let result = new Array<number>(percentages.length);

    let hes = this.getHistEntries();

    // Get Total hits excluding the hits from those points that reached the maxium iteration count.
    let maxIterIndex = this.getIndexOfMaxIter(hes, 5);
    let total = this.getSumHits(hes, 0, maxIterIndex);

    let runningPercent = 0;

    let idxAndSum = new IndexAndRunningSum(0, 0);

    let ptr: number;
    for (ptr = 0; ptr < percentages.length; ptr++) {
      runningPercent += percentages[ptr]; // / 100;
      let target = runningPercent * total;
      idxAndSum = this.getCutOff(target, hes, idxAndSum);
      if (idxAndSum.idx < hes.length) {
        result[ptr] = hes[idxAndSum.idx].val;
      }
      else {
        // Use the value of the last entry and exit.
        result[ptr] = hes[hes.length - 1].val;
        break;
      }
    }

    return result;
  }

  public getCutOff(targetVal: number, hes: HistEntry[], startIdxAndSum: IndexAndRunningSum): IndexAndRunningSum {

    let ptr = startIdxAndSum.idx;
    let rs = startIdxAndSum.runningSum;

    //if (targetVal > rs) {
    //  throw new RangeError('targetVal > running sum on call to getCutOff.');
    //}

    let haveAdvanced = false;
    while (ptr < hes.length) {
      let newRs = rs + hes[ptr].occurances;

      if (newRs > targetVal) {
        if (haveAdvanced) {
          let diffPrev = targetVal - rs;
          let diffNext = newRs - targetVal;

          if (diffNext <= diffPrev) {
            rs = newRs;
            ptr++;
          }
        }
        else {
          // Must use the next value because we have not yet advanced any -- which means the current value has already been used.
          rs = newRs;
          ptr++;
        }
        break;
      }
      else {
        rs = newRs;
        ptr++;
        haveAdvanced = true;
      }
    }

    let result = new IndexAndRunningSum(ptr, rs);
    return result;
  }

  /// --- End Target Percentage ---

  public getHistEntries(): HistEntry[] {
    let result: HistEntry[] = new Array<HistEntry>(this.entriesMap.size);

    let vals = Array.from(this.entriesMap.keys());
    let occs = Array.from(this.entriesMap.values());

    let ptr: number;
    for (ptr = 0; ptr < this.entriesMap.size; ptr++) {
      result[ptr] = new HistEntry(vals[ptr], occs[ptr]);
    }

    result.sort((a, b) => a.val - b.val);

    // Set our maxVal, while since we have gone to the trouble of getting sorting our map.
    this._maxVal = result[result.length - 1].val;
    return result;
  }

  public getHistArrayPair(): HistArrayPair {
    let vals = new Uint16Array(Array.from(this.entriesMap.keys()));
    let occs = new Uint16Array(Array.from(this.entriesMap.values()));

    let result = new HistArrayPair(vals, occs);
    return result;
  }

  addVal(val: number): void {
    let exEntry = this.entriesMap.get(val);

    if (exEntry === undefined) {
      this.entriesMap.set(val, 1);
    }
    else {
      this.entriesMap.set(val, exEntry + 1);
    }
  }

  addVals(vals: Uint16Array): void {
    if (vals === undefined || vals.length === 0) return;

    let lastVal = vals[0];
    let lastOcc = this.entriesMap.get(lastVal);
    lastOcc = lastOcc === undefined ? 1 : lastOcc + 1;

    let ptr: number;

    for (ptr = 1; ptr < vals.length; ptr++) {
      let val = vals[ptr];

      if (val === lastVal) {
        lastOcc++;
      }
      else {
        this.entriesMap.set(lastVal, lastOcc);
        lastOcc = this.entriesMap.get(val);
        lastOcc = lastOcc === undefined ? 1 : lastOcc + 1;
        lastVal = val;
      }
    }

    if (!(lastVal === undefined)) {
      this.entriesMap.set(lastVal, lastOcc);
    }
  }

  public static fromHistArrayPair(arrayPair: HistArrayPair): Histogram {
    let result = new Histogram();

    let ptr: number;
    for (ptr = 0; ptr < arrayPair.vals.length; ptr++) {
      result.entriesMap.set(arrayPair.vals[ptr], arrayPair.occurances[ptr]);
    }
    return result;
  }

  public addFromArrayPair(arrayPair: HistArrayPair): void {
    let ptr: number;
    for (ptr = 0; ptr < arrayPair.vals.length; ptr++) {
      let val = arrayPair.vals[ptr];
      let occ = this.entriesMap.get(val);
      if (occ === undefined) {
        this.entriesMap.set(val, arrayPair.occurances[ptr]);
      }
      else {
        this.entriesMap.set(val, occ + arrayPair.occurances[ptr]);
      }
    }
  }

  public getGroupCnts(breakPoints: number[]): number[] {
    let result = new Array<number>(breakPoints.length);

    let hes = this.getHistEntries();
    let lastIdx = 0;

    let ptr: number;
    for (ptr = 0; ptr < breakPoints.length; ptr++) {

      let accum = 0;

      let thisBp = breakPoints[ptr];
      let p2: number;
      for (p2 = lastIdx; p2 < hes.length; p2++) {
        if (hes[p2].val <= thisBp) {
          accum += hes[p2].occurances;
        }
        else {
          break;
        }
      }

      result[ptr] = accum;
      lastIdx = p2;
    }

    // Add up all occurances after the last break point.
    let accum2 = 0;
    let p3: number;
    for (p3 = lastIdx; p3 < hes.length; p3++) {
      accum2 += hes[p3].occurances;
    }

    result.push(accum2);

    return result;
  }

  public getGroupPercentages(groupCounts: number[]): number[] {
    let result = new Array<number>(groupCounts.length);

    let hes = this.getHistEntries();
    let maxIterIndex = this.getIndexOfMaxIter(hes, 5);
    let total = this.getSumHits(hes, 0, maxIterIndex);

    let ptr: number;
    for (ptr = 0; ptr < groupCounts.length; ptr++) {
      result[ptr] = groupCounts[ptr] / total;
    }

    return result;
  }

  public toString(): string {

    let result: string = '';
    let hEntries = this.getHistEntries();

    let ptr: number;

    for (ptr = 0; ptr < hEntries.length; ptr++) {
      let he = hEntries[ptr];
      result = result + he.toString() + '\n';
    }

    return result;
  }

  public static getBreakPointsDisplay(bps: number[]): string {
    let result: string = '';

    let startRange = 0;

    let ptr: number;
    for (ptr = 0; ptr < bps.length; ptr++) {
      let endRange = bps[ptr];
      result += 'Range ' + ptr + ': ' + startRange + '-' + endRange + '\n';
      startRange = endRange;
    }

    return result;
  }
}

export class CurWorkVal {
  public z: IPoint;
  public cnt: number;
  public escapeVel: number;
  public done: boolean;

  //---
  //public zAp: PointAp;

  constructor(apRatSettings: apRationalSettings) {
    this.z = new Point(0, 0);
    this.cnt = 0;
    this.escapeVel = 0;
    this.done = false;

    //this.zAp = new PointAp(
    //  apRatSettings.getNewZero(),
    //  apRatSettings.getNewZero()
    //)
  }
}

export class MapWorkingData implements IMapWorkingData {

  public elementCount: number;
  public workingVals: CurWorkVal[];

  public xVals: number[];
  public yVals: number[];

  public curIterations: number;

  private log2: number;

  //---
  public apRatSettings: apRationalSettings;
  //private xValsAp: apRational[];
  //private yValsAp: apRational[];


  constructor(public canvasSize: ICanvasSize, public mapInfo: IMapInfo, public colorMap: ColorMap, public sectionAnchor: IPoint) {

    this.apRatSettings = new apRationalSettings(25, RoundingMode.HalfUp);

    this.elementCount = this.getNumberOfElementsForCanvas(this.canvasSize);
    this.workingVals = this.buildWorkingVals(this.elementCount, this.apRatSettings);

    // X coordinates get larger as one moves from the left of the map to  the right.
    this.xVals = MapWorkingData.buildVals(this.canvasSize.width, this.mapInfo.bottomLeft.x, this.mapInfo.topRight.x);

    // Y coordinates get larger as one moves from the bottom of the map to the top.
    // But ImageData "blocks" are drawn from top to bottom.

    if (mapInfo.upsideDown) {
      // The y coordinates are already reversed, just use buildVals
      this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
    }
    else {
      // if we only have a single section, then we must reverse the y values.
      // The y coordinates are not reversed, reverse them here.
      this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.topRight.y, this.mapInfo.bottomLeft.y);
    }

    this.curIterations = 0;
    this.log2 = Math.log10(2) as number;

    //----
    //let boxAp = BoxAp.fromBox(this.mapInfo.coords, this.apRatSettings);

    //this.xValsAp = MapWorkingData.buildValsAp(this.canvasSize.width, boxAp.botLeft.x, boxAp.topRight.x, this.apRatSettings);

    //if (mapInfo.upsideDown) {
    //  // The y coordinates are already reversed, just use buildVals
    //  this.yValsAp = MapWorkingData.buildValsAp(this.canvasSize.height, boxAp.botLeft.y, boxAp.topRight.y, this.apRatSettings);
    //}
    //else {
    //  // if we only have a single section, then we must reverse the y values.
    //  // The y coordinates are not reversed, reverse them here.
    //  this.yValsAp = MapWorkingData.buildValsAp(this.canvasSize.height, boxAp.topRight.y, boxAp.botLeft.y, this.apRatSettings);
    //}

    console.log('Constructing MapWorkingData, ColorMap = ' + this.colorMap + '.');
  }

  private buildWorkingVals(elementCount: number, apRatSettings: apRationalSettings): CurWorkVal[] {
    let result = new Array<CurWorkVal>(elementCount);

    let ptr: number;
    for (ptr = 0; ptr < this.elementCount; ptr++) {
      result[ptr] = new CurWorkVal(apRatSettings);
    }

    return result;
  }

  // Calculate the number of elements in our single dimension data array needed to cover the
  // two-dimensional map.
  private getNumberOfElementsForCanvas(cs: ICanvasSize): number {
    return cs.width * cs.height;
  }

  // Build the array of 'c' values for one dimension of the map.
  static buildVals(canvasExtent: number, start: number, end: number): number[] {
    let result: number[] = new Array<number>(canvasExtent);

    let mapExtent: number = end - start;
    let unitExtent: number = mapExtent / canvasExtent;

    var i: number;
    for (i = 0; i < canvasExtent; i++) {
      result[i] = start + i * unitExtent;
    }
    return result;
  }

  // Build the array of 'c' values for one dimension of the map.
  static buildValsAp(canvasExtent: number, start: apRational, end: apRational, apRatSettings: apRationalSettings): apRational[] {

    console.log('Building ValsAp.');

    let result: apRational[] = new Array<apRational>(canvasExtent);

    let mapExtent: apRational = end.clone().minus(start);
    let canvasExtentAp = apRatSettings.parse(canvasExtent);
    let unitExtent: apRational = mapExtent.divide(canvasExtentAp);

    var i: number;
    for (i = 0; i < canvasExtent; i++) {
      let iAp = apRatSettings.parse(i);
      let tue = iAp.multiply(unitExtent);
      result[i] = tue.plus(start);
    }

    return result;
  }

  // The number of times each point has been iterated.
  public get cnts(): Uint16Array {
    let result = new Uint16Array(this.elementCount);

    let ptr: number;
    for (ptr = 0; ptr < this.elementCount; ptr++) {
      result[ptr] = this.workingVals[ptr].cnt;
    }

    return result;
  }

  // Returns the index to use when accessing wAData, wBData, cnts or flags.
  public getLinearIndex(c: IPoint): number {
    return c.x + c.y * this.canvasSize.width;
  }

  // Takes the current value of z for a given coordinate,
  // calculates the next value
  // and updates the current value with this next value.
  // If the 'done' flag is set, no update is made.
  //
  // If the magnitude of the new value is greater than 2 (the square of the magnitude > 4) then it sets the 'done' flag
  // Returns the (new) value of the 'done' flag for this coordinate.
  private iterateElement(mapCoordinate:IPoint, iterCount:number): boolean {
    const ptr = this.getLinearIndex(mapCoordinate);

    let wv = this.workingVals[ptr];

    if (wv.done) {
      // This point has been flagged, don't iterate.
      return true;
    }

    let z: IPoint = wv.z;
    const c: IPoint = new Point(this.xVals[mapCoordinate.x], this.yVals[mapCoordinate.y]);

    //let zAp = wv.zAp;
    //let cAp = new PointAp(this.xValsAp[mapCoordinate.x], this.yValsAp[mapCoordinate.y]);
    //let two = this.apRatSettings.parse(2);

    let zxSquared = z.x * z.x;
    let zySquared = z.y * z.y;

    //let zxApSquared = zAp.x.clone().multiply(zAp.x);
    //let zyApSquared = zAp.y.clone().multiply(zAp.y);

    let cntr: number;
    for (cntr = 0; cntr < iterCount; cntr++) {

      z.y = 2 * z.x * z.y + c.y;
      z.x = zxSquared - zySquared + c.x;

      zxSquared = z.x * z.x;
      zySquared = z.y * z.y;

      //if (cntr < 2) {
      //  zAp.y = zAp.y.multiply(zAp.x).multiply(two).plus(cAp.y);
      //  zAp.x = zxApSquared.minus(zyApSquared).plus(cAp.x);

      //  zxApSquared = zAp.x.clone().multiply(zAp.x);
      //  zyApSquared = zAp.y.clone().multiply(zAp.y);
      //}

      if ( zxSquared + zySquared > this.mapInfo.threshold) {
        // This point is done.

        // One more interation
        z.y = 2 * z.x * z.y + c.y;
        z.x = zxSquared - zySquared + c.x;
        zxSquared = z.x * z.x;
        zySquared = z.y * z.y;

        // Ok, two more interations
        z.y = 2 * z.x * z.y + c.y;
        z.x = zxSquared - zySquared + c.x;
        zxSquared = z.x * z.x;
        zySquared = z.y * z.y;

        let modulus: number = Math.log10(zxSquared + zySquared) / 2;
        let nu: number = Math.log10(modulus / this.log2) / this.log2;
        //let nu: number = Math.log(modulus) / this.log2;

        wv.escapeVel = 1 - nu / 2; // / 4;
        //wv.escapeVel = nu;

        wv.done = true;
        break;
      }
    }

    // Store the new value back to our Working Data.
    wv.z.x = z.x;
    wv.z.y = z.y;

    // Increment the number of times this point has been iterated.
    wv.cnt += cntr;

    this

    return wv.done;
  }

  // Updates each element by performing a single interation.
  // Returns true if at least one point is not done.
  public doIterationsForAll(iterCount: number): boolean {

    // The processed values will be old after this completes.
    //this.isProcessed = false;

    let stillAlive: boolean = false; // Assume all done until one is found that is not done.

    let x: number;
    let y: number;

    for (y = 0; y < this.canvasSize.height; y++) {
      for (x = 0; x < this.canvasSize.width; x++) {
        let pointIsDone = this.iterateElement(new Point(x, y), iterCount);
        if (!pointIsDone) stillAlive = true;
      }
    }
    return stillAlive;
  }

  public getPixelData(): Uint8ClampedArray {
    let imgData = new Uint8ClampedArray(this.elementCount * 4);

    // Address the image data buffer as Int32's
    let pixelData = new Uint32Array(imgData.buffer);

    let ptr: number;
    for (ptr = 0; ptr < this.elementCount; ptr++) {
      let wv = this.workingVals[ptr];

      let cNum = this.colorMap.getColor(wv.cnt, wv.escapeVel);
      pixelData[ptr] = cNum;
    }

    return imgData;
  }

  // Divides the specified MapWorking data into the specified vertical sections, each having the width of the original Map.
  static getWorkingDataSections(canvasSize: ICanvasSize, mapInfo: IMapInfo, colorMap: ColorMap, numberOfSections: number): IMapWorkingData[] {

    console.log('At getWorkingDataSections, ColorMap = ' + colorMap + '.');


    let result: IMapWorkingData[] = Array<IMapWorkingData>(numberOfSections);

    // Calculate the heigth of each section, rounded down to the nearest whole number.
    let sectionHeight = canvasSize.height / numberOfSections;
    let sectionHeightWN = parseInt(sectionHeight.toString(), 10);

    // Calculate the height of the last section.
    let lastSectionHeight: number = canvasSize.height - sectionHeightWN * (numberOfSections - 1);

    let left = mapInfo.bottomLeft.x;
    let right = mapInfo.topRight.x;

    let bottomPtr = 0;
    let topPtr = sectionHeightWN;

    let yVals: number[];

    if (mapInfo.upsideDown) {
      // The y coordinates are already reversed, just use buildVals
      yVals = MapWorkingData.buildVals(canvasSize.height, mapInfo.bottomLeft.y, mapInfo.topRight.y);
    }
    else {
      // The y coordinates are not reversed, reverse them here.
      yVals = MapWorkingData.buildVals(canvasSize.height, mapInfo.topRight.y, mapInfo.bottomLeft.y);
    }

    let ptr: number = 0;

    // Build all but the last section.
    for (; ptr < numberOfSections - 1; ptr++) {

      let secCanvasSize = new CanvasSize(canvasSize.width, sectionHeightWN);

      let secBottom = yVals[bottomPtr];
      let secTop = yVals[topPtr];

      let secBotLeft = new Point(left, secBottom);
      let secTopRight = new Point(right, secTop);

      let coords: IBox = new Box(secBotLeft, secTopRight);
      let secMapInfo = new MapInfo(coords, mapInfo.maxIterations, mapInfo.threshold, mapInfo.iterationsPerStep);

      let yOffset = ptr * sectionHeightWN;
      let secAnchor: IPoint = new Point(0, yOffset);
      result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, colorMap, secAnchor);

      // The next bottomPtr should point to one immediately following the last top.
      bottomPtr = topPtr + 1;
      topPtr += sectionHeightWN;
    }

    // Build the last section.
    let secCanvasSize = new CanvasSize(canvasSize.width, lastSectionHeight);

    let secBottom = yVals[bottomPtr];
    let secBotLeft = new Point(left, secBottom);

    topPtr = yVals.length - 1;
    let secTop = yVals[topPtr];
    let secTopRight = new Point(right, secTop);

    let coords: IBox = new Box(secBotLeft, secTopRight);
    let secMapInfo = new MapInfo(coords, mapInfo.maxIterations, mapInfo.threshold, mapInfo.iterationsPerStep);

    let yOffset = ptr * sectionHeightWN;
    let secAnchor: IPoint = new Point(0, yOffset);

    result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, colorMap, secAnchor);

    return result;
  }
 
  public iterationCountForNextStep(): number {
    let result: number;
    let gap = this.mapInfo.maxIterations - this.curIterations;

    if (gap > this.mapInfo.iterationsPerStep) {
      result = this.mapInfo.iterationsPerStep;
    }
    else {
      result = gap;
    }

    return result;
  }

  public getHistogram(): Histogram {
    let result = new Histogram();
    result.addVals(this.cnts);
    return result;
  }

} // End Class MapWorkingData

export enum ColorMapEntryBlendStyle {
  none,
  next,
  endColor
}

export class ColorMapEntry {

  public prevCutOff: number;
  public bucketWidth: number;

  constructor(public cutOff: number, public colorNum: number, public blendStyle: ColorMapEntryBlendStyle, public endColorNum) {
  }
}

export class ColorMap {

  constructor(public ranges: ColorMapEntry[], public highColor: number) {
    if (ranges === null || ranges.length === 0) {
      throw new Error('When creating a ColorMap, the ranges argument must have at least one entry.');
    }

    // Update the prevCutOff and bucketWidth values for each of our ColorMapEntries.
    this.setBucketWidths();

    
  }

  //public static FromTypedArrays(cutOffs: Uint16Array, colorNums: Uint32Array, highColor: number): ColorMap {
  //  let workRanges: ColorMapEntry[] = new Array<ColorMapEntry>(cutOffs.length);
  //  let i: number = 0;

  //  for (; i < cutOffs.length; i++) {
  //    workRanges[i] = new ColorMapEntry(cutOffs[i], colorNums[i], ColorMapEntryBlendStyle.none, null);
  //  }

  //  let result: ColorMap = new ColorMap(workRanges, highColor);

  //  return result;
  //}

  public getColor(countValue: number, escapeVel: number): number {
    let result: number;
    let index = this.searchInsert(countValue);

    if (index === this.ranges.length) {
      result = this.highColor;
      return result;
    }

    let cme = this.ranges[index];
    let cNum1 = cme.colorNum;

    if (cme.blendStyle === ColorMapEntryBlendStyle.none) {
      result = cme.colorNum;
      return result;
    }

    let cNum2: number;

    if (cme.blendStyle === ColorMapEntryBlendStyle.next) {
      if (index + 1 === this.ranges.length) {
        cNum2 = this.highColor;
      }
      else {
        cNum2 = this.ranges[index + 1].colorNum;
      }
    }
    else {
      cNum2 = cme.endColorNum;
    }

    result = this.blend(cme.prevCutOff, cme.bucketWidth, countValue, cNum1, cNum2, escapeVel);

    return result;
  }

  private blend(botBucketVal: number, bucketWidth: number, countValue: number, cNum1: number, cNum2: number, escapeVel: number): number {

    let c1 = ColorNumbers.getColorComponents(cNum1);
    let c2 = ColorNumbers.getColorComponents(cNum2);

    let cStart: number[];
    if (countValue === botBucketVal) {
      // We're starting at the very bottom.
      //cStart = new Array<number>(...c1);
      cStart = c1;
    }
    else {
      let stepFactor = (-1 + countValue - botBucketVal) / bucketWidth;
      cStart = this.simpleBlend(c1, c2, stepFactor);
    }

    let intraStepFactor = escapeVel / bucketWidth; // 1 / bucketWidth; //

    let r = cStart[0] + (c2[0] - c1[0]) * intraStepFactor;
    let g = cStart[1] + (c2[1] - c1[1]) * intraStepFactor;
    let b = cStart[2] + (c2[2] - c1[2]) * intraStepFactor;

    if (r < 0 || r > 255) {
      console.log('Bad red value.');
    }

    if (g < 0 || g > 255) {
      console.log('Bad green value.');
    }

    if (b < 0 || b > 255) {
      console.log('Bad blue value.');
    }

    let newCNum = ColorNumbers.getColor(r, g, b, 255);

    return newCNum;
  }

  private simpleBlend(c1: number[], c2: number[], factor: number): number[] {

    if (factor === 0) {
      return c1;
    }

    let r = c1[0] + (c2[0] - c1[0]) * factor;
    let g = c1[1] + (c2[1] - c1[1]) * factor;
    let b = c1[2] + (c2[2] - c1[2]) * factor;

    if (r < 0 || r > 255) {
      console.log('Bad red value.');
    }

    if (g < 0 || g > 255) {
      console.log('Bad green value.');
    }

    if (b < 0 || b > 255) {
      console.log('Bad blue value.');
    }

    let result = [r, g, b, 255];

    return result;
  }

  // Returns the index of the range entry that either
  // 1. matches the given countVal
  // or
  // 2. contains the first entry with a cutOff value greater than the given countVal.
  private searchInsert(countVal: number): number {

    let start = 0;
    let end = this.ranges.length - 1;
    let index = Math.floor((end - start) / 2) + start;

    if (countVal > this.ranges[this.ranges.length - 1].cutOff) {
      // The target is beyond the end of this array.
      index = this.ranges.length;
    }
    else {
      // Start in middle, divide and conquer.
      while (start < end) {
        // Get value at current index.
        let value: number = this.ranges[index].cutOff;

        if (value === countVal) {
          // Found our target.
          //result = index;
          break;
        }
        else if (countVal < value) {
          // Target is lower in array, move the index halfway down.
          end = index;
        }
        else {
          // Target is higher in array, move the index halfway up.
          start = index + 1;
        }

        // Get next mid-point.
        index = Math.floor((end - start) / 2) + start;
      }
    }

    return index;
  }

  private setBucketWidths(): void {
    let ptr: number;

    this.ranges[0].bucketWidth = this.ranges[0].cutOff;
    this.ranges[0].prevCutOff = 0;

    let prevCutOff = this.ranges[0].cutOff;

    for (ptr = 1; ptr < this.ranges.length; ptr++) {
      this.ranges[ptr].prevCutOff = prevCutOff;
      this.ranges[ptr].bucketWidth = this.ranges[ptr].cutOff - prevCutOff;

      prevCutOff = this.ranges[ptr].cutOff;
    }

    //this.ranges[this.ranges.length - 1].prevCutOff = prevCutOff;
  }

  public getCutOffs(): Uint16Array {
    let result = new Uint16Array(this.ranges.length);
    let i: number = 0;

    for (; i < this.ranges.length; i++) {
      result[i] = this.ranges[i].cutOff;
    }

    return result;
  }

  public getColorNums(): Uint32Array {
    let result = new Uint32Array(this.ranges.length);
    let i: number = 0;

    for (; i < this.ranges.length; i++) {
      result[i] = this.ranges[i].colorNum;
    }

    return result;
  }

  public toString(): string {
    let result = 'ColorMap with ' + this.ranges.length + ' entries.';
    return result;
  }
}

// ---- WebWorker Message Interfaces ----

export interface IWebWorkerMessage {
  messageKind: string;
}

export interface IWebWorkerStartRequest extends IWebWorkerMessage {
  canvasSize: ICanvasSize;
  mapInfo: IMapInfo;
  colorMap: ColorMap;
  sectionAnchor: IPoint;
  sectionNumber: number;

  getMapWorkingData(): IMapWorkingData;
}

export interface IWebWorkerIterateRequest extends IWebWorkerMessage {
  iterateCount: number;
}

export interface IWebWorkerImageDataRequest extends IWebWorkerMessage {
}

export interface IWebWorkerImageDataResponse extends IWebWorkerMessage {
  sectionNumber: number;
  pixelData: Uint8ClampedArray;

  getImageData(cs: ICanvasSize): ImageData;
}

export interface IWebWorkerAliveFlagsRequest extends IWebWorkerMessage {
}

export interface IWebWorkerAliveFlagsResponse extends IWebWorkerMessage {
  sectionNumber: number;
  flagData: Uint8Array;

  getAliveFlags(): boolean[];
}

export interface IWebWorkerIterCountsRequest extends IWebWorkerMessage {
}

export interface IWebWorkerIterCountsResponse extends IWebWorkerMessage {
  sectionNumber: number;
  iterCountsData: Uint16Array;
}

export interface IWebWorkerHistogramRequest extends IWebWorkerMessage {
}

export interface IWebWorkerHistogramResponse extends IWebWorkerMessage {
  sectionNumber: number;
  vals: Uint16Array;
  occurances: Uint16Array;

  getHistorgram(): Histogram;
  getHistArrayPair(): HistArrayPair;
}

export interface IWebWorkerUpdateColorMapRequest extends IWebWorkerMessage {
  colorMap: ColorMap;
}

// -- WebWorker Message Implementations

export class WebWorkerMessage implements IWebWorkerMessage {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerMessage {
    return new WebWorkerMessage(data.messageKind || data || 'no data');
  }
}

export class WebWorkerStartRequest implements IWebWorkerStartRequest {

  constructor(
    public messageKind: string,
    public canvasSize: ICanvasSize,
    public mapInfo: IMapInfo,
    public colorMap: ColorMap,
    public sectionAnchor: IPoint,
    public sectionNumber: number
  ) { }

  static FromEventData(data: any): IWebWorkerStartRequest {
    let result = new WebWorkerStartRequest(
      data.messageKind,
      data.canvasSize,
      // Because the MapInfo class has methods, we must build a new instance from the data.
      MapInfo.fromIMapInfo(data.mapInfo),
      // Because the ColorMap class has methods, we must build a new instance from the data.
      new ColorMap(data.colorMap.ranges, data.colorMap.highColor),
      data.sectionAnchor,
      data.sectionNumber
    );
    return result;
  }

  static CreateRequest(mapWorkingData: IMapWorkingData, sectionNumber: number): IWebWorkerStartRequest {
    let result = new WebWorkerStartRequest(
      'Start',
      mapWorkingData.canvasSize,
      mapWorkingData.mapInfo,
      mapWorkingData.colorMap,
      mapWorkingData.sectionAnchor,
      sectionNumber
    );

    return result;
  }

  public getMapWorkingData(): IMapWorkingData {
    let result = new MapWorkingData(this.canvasSize, this.mapInfo, this.colorMap, this.sectionAnchor);
    return result;
  }
}

export class WebWorkerIterateRequest implements IWebWorkerIterateRequest {
  constructor(public messageKind: string, public iterateCount: number) { }

  static FromEventData(data: any): IWebWorkerIterateRequest {
    let result = new WebWorkerIterateRequest(data.messageKind,  data.iterateCount);
    return result;
  }

  static CreateRequest(iterateCount: number): IWebWorkerIterateRequest {
    let result = new WebWorkerIterateRequest('Iterate', iterateCount);
    return result;
  }
}

export class WebWorkerImageDataRequest implements IWebWorkerImageDataRequest {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerImageDataRequest {
    let result = new WebWorkerImageDataRequest(data.messageKind);
    return result;
  }

  static CreateRequest(): IWebWorkerImageDataRequest {
    let result = new WebWorkerImageDataRequest('GetImageData');
    return result;
  }
}

export class WebWorkerImageDataResponse implements IWebWorkerImageDataResponse {

  constructor(public messageKind: string, public sectionNumber: number, public pixelData: Uint8ClampedArray) { }

  static FromEventData(data: any): IWebWorkerImageDataResponse {
    let result = new WebWorkerImageDataResponse(data.messageKind, data.sectionNumber, data.pixelData);

    return result;
  }

  static CreateResponse(sectionNumber: number, pixelData: Uint8ClampedArray): IWebWorkerImageDataResponse {
    let result = new WebWorkerImageDataResponse("ImageDataResponse", sectionNumber, pixelData);
    return result;
  }

  public getImageData(cs: ICanvasSize): ImageData {
    let result: ImageData = null;

    //if (this.pixelData) {
      let pixelCount = this.pixelData.length / 4;
      if (pixelCount !== cs.width * cs.height) {
        console.log('The image data being returned is not the correct size for our canvas.');
      }
      result = new ImageData(this.pixelData, cs.width, cs.height);
    //}
    return result;
  }
}

export class WebWorkerAliveFlagsRequest implements IWebWorkerAliveFlagsRequest {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerAliveFlagsRequest {
    let result = new WebWorkerAliveFlagsRequest(data.messageKind);
    return result;
  }

  static CreateRequest(flagData: Uint8Array): IWebWorkerAliveFlagsRequest {
    let result = new WebWorkerAliveFlagsRequest('GetAliveFlags');
    return result;
  }
}

export class WebWorkerAliveFlagsResponse implements IWebWorkerAliveFlagsResponse {  

  constructor(public messageKind: string, public sectionNumber: number, public flagData: Uint8Array) { }

  static FromEventData(data: any): IWebWorkerImageDataResponse {
    let result = new WebWorkerImageDataResponse(data.messageKind, data.sectionNumber, data.flagData);

    return result;
  }

  static CreateResponse(sectionNumber: number, flagData: Uint8Array): IWebWorkerAliveFlagsResponse {
    let result = new WebWorkerAliveFlagsResponse("AliveFlagResults", sectionNumber, flagData);
    return result;
  }

  public getAliveFlags(): boolean[] {
    let result: boolean[] = new Array<boolean>(this.flagData.length);

    let ptr: number = 0;
    for (; ptr < this.flagData.length; ptr++) {
      result[ptr] = this.flagData[ptr] !== 0;
    }

    return result;
  }
}

export class WebWorkerIterCountsRequest implements IWebWorkerIterCountsRequest {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerAliveFlagsRequest {
    let result = new WebWorkerIterCountsRequest(data.messageKind);
    return result;
  }

  static CreateRequest(flagData: Uint8Array): IWebWorkerAliveFlagsRequest {
    let result = new WebWorkerIterCountsRequest('GetIterCounts');
    return result;
  }

}

export class WebWorkerIterCountsResponse implements IWebWorkerIterCountsResponse {
  constructor(public messageKind: string, public sectionNumber: number, public iterCountsData: Uint16Array) { }

  static FromEventData(data: any): IWebWorkerIterCountsResponse {
    let result = new WebWorkerIterCountsResponse(data.messageKind, data.sectionNumber, data.iterCountsData);

    return result;
  }
  
  static CreateResponse(sectionNumber: number, iterCountsData: Uint16Array): IWebWorkerIterCountsResponse {
    let result = new WebWorkerIterCountsResponse("IterCountsResults", sectionNumber, iterCountsData);
    return result;
  }
}

export class WebWorkerHistogramRequest implements IWebWorkerHistogramRequest {
  constructor(public messageKind: string) { }

  static FromEventData(data: any): IWebWorkerHistogramRequest {
    let result = new WebWorkerHistogramRequest(data.messageKind);
    return result;
  }

  static CreateRequest(): IWebWorkerHistogramRequest {
    let result = new WebWorkerHistogramRequest('GetHistogram');
    return result;
  }

}

export class WebWorkerHistorgramResponse implements IWebWorkerHistogramResponse {
  constructor(public messageKind: string, public sectionNumber: number, public vals: Uint16Array, public occurances: Uint16Array) { }

  static FromEventData(data: any): IWebWorkerHistogramResponse {
    let result = new WebWorkerHistorgramResponse(data.messageKind, data.sectionNumber, data.vals, data.occurances);

    return result;
  }

  static CreateResponse(sectionNumber: number, histogram: Histogram): IWebWorkerHistogramResponse {
    let arrayPair = histogram.getHistArrayPair();
    let result = new WebWorkerHistorgramResponse("HistogramResults", sectionNumber, arrayPair.vals, arrayPair.occurances);
    return result;
  }

  public getHistorgram(): Histogram {
    let arrayPair = new HistArrayPair(this.vals, this.occurances);
    let result = Histogram.fromHistArrayPair(arrayPair);

    return result;
  }

  public getHistArrayPair(): HistArrayPair {
    let result = new HistArrayPair(this.vals, this.occurances);
    return result;
  }
}

export class WebWorkerUpdateColorMapRequest implements IWebWorkerUpdateColorMapRequest {

  constructor(public messageKind: string, public colorMap: ColorMap) { }

  static FromEventData(data: any): IWebWorkerUpdateColorMapRequest {

    // Since the value of data does not contain any of the functions defined for a ColorMap object,
    // we must create a new ColorMap from the raw data members of the provided 'raw' instance.

    let newColorMap = new ColorMap(data.colorMap.ranges, data.colorMap.highColor);
    let result = new WebWorkerUpdateColorMapRequest(data.messageKind, newColorMap);

    return result;
  }

  static CreateRequest(colorMap: ColorMap): IWebWorkerUpdateColorMapRequest {

    let result = new WebWorkerUpdateColorMapRequest("UpdateColorMap", colorMap);
    return result;
  }

}

//// Only used when the javascript produced from compiling this TypeScript is used to create worker.js

//var mapWorkingData: IMapWorkingData = null;
//var sectionNumber: number = 0;

//// Handles messages sent from the window that started this web worker.
//onmessage = function (e) {

//  var pixelData: Uint8ClampedArray;
//  var imageDataResponse: IWebWorkerImageDataResponse;

//  //console.log('Worker received message: ' + e.data + '.');
//  let plainMsg: IWebWorkerMessage = WebWorkerMessage.FromEventData(e.data);

//  if (plainMsg.messageKind === 'Start') {
//    let startMsg = WebWorkerStartRequest.FromEventData(e.data);

//    mapWorkingData = startMsg.getMapWorkingData();
//    sectionNumber = startMsg.sectionNumber;
//    console.log('Worker created MapWorkingData with element count = ' + mapWorkingData.elementCount);

//    let responseMsg = new WebWorkerMessage('StartResponse');
//    console.log('Posting ' + responseMsg.messageKind + ' back to main script');
//    self.postMessage(responseMsg, "*");
//  }
//  else if (plainMsg.messageKind === 'Iterate') {
//    let iterateRequestMsg = WebWorkerIterateRequest.FromEventData(e.data);
//    let iterCount = iterateRequestMsg.iterateCount;
//    mapWorkingData.doIterationsForAll(iterCount);

//    pixelData = mapWorkingData.getPixelData();
//    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);
//    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
//    self.postMessage(imageDataResponse, "*", [pixelData.buffer]);
//  }
//  else if (plainMsg.messageKind === 'GetImageData') {
//    //mapWorkingData.doIterationsForAll(1);

//    pixelData = mapWorkingData.getPixelData();
//    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);
//    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
//    self.postMessage(imageDataResponse, "*", [pixelData.buffer]);
//  }
//  else if (plainMsg.messageKind === "UpdateColorMap") {
//    let upColorMapReq = WebWorkerUpdateColorMapRequest.FromEventData(e.data);

//    mapWorkingData.colorMap = upColorMapReq.colorMap;
//    console.log('WebWorker received an UpdateColorMapRequest with ' + mapWorkingData.colorMap.ranges.length + ' entries.');

//    pixelData = mapWorkingData.getPixelData();
//    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);
//    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
//    self.postMessage(imageDataResponse, "*", [pixelData.buffer]);
//  }
//  else if (plainMsg.messageKind === "GetHistogram") {
//    let histogram = mapWorkingData.getHistogram();
//    let histogramResponse = WebWorkerHistorgramResponse.CreateResponse(sectionNumber, histogram);

//    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
//    self.postMessage(histogramResponse, "*", [histogramResponse.vals.buffer, histogramResponse.occurances.buffer]);
//  }
//  else {
//    console.log('Received unknown message kind: ' + plainMsg.messageKind);
//  }

//};





