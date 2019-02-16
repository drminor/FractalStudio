export class apsrRationalSettings {

  public base: number;
  public maxInt: number;
  public decGroups: number;
  public maxLastGroupVal: number;

  public posExp: number;
  public negExp: number;

  public IncludeSignForZero: boolean;
  public IncludeTrailingZeros: boolean;

  constructor(public dp: number/*, public rm: srRoundingMode*/, public logBase: number) {

    this.base = Math.pow(this.logBase, 10);
    this.maxInt = this.base;

    let t = dp / this.logBase;
    let iPart = Math.trunc(t);

    if (iPart === t) {
      this.decGroups = iPart;
      this.maxLastGroupVal = this.base - 1;
    }
    else {
      this.decGroups = iPart + 1;
      let rem = t - iPart;
      let digCnt = rem * this.logBase;
      this.maxLastGroupVal = Math.pow(10, digCnt) - 1;
    }

    this.posExp = 8;
    this.negExp = 8;

    this.IncludeSignForZero = false;
    this.IncludeTrailingZeros = false;
  }

  public parse(sn: string | number): apsrRational {

    let result = apsrRational.parse(sn, this);
    return result;
  }

  public getNewZero(): apsrRational {
    let result = new apsrRational(true, [0], this);
    return result;
  }


}

export class apsrRational {

  // Error messages.
  static NAME = '[apsrRational]';
  static INVALID = apsrRational.NAME + ' Invalid ';
  static INVALID_DP = apsrRational.INVALID + ' decimal places';
  static INVALID_PERCISE = apsrRational.INVALID + '  too many digits in coefficient ';
  static INVALID_TOO_BIG = apsrRational.INVALID + ' value is too large ';

  static INVALID_RM = apsrRational.INVALID + ' rounding mode';
  static DIV_BY_ZERO = apsrRational.NAME + ' Division by zero';

  static NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;

  public isZero: boolean;

  constructor(public sign: boolean, public cof: number[], public settings: apsrRationalSettings) {

    // The number of groups is 1 (before the decimal) and decGroups after the decimal.
    const gl = this.settings.decGroups + 1;
    const cl = this.cof.length;

    if (cl > gl) {
      throw Error(apsrRational.INVALID_PERCISE + cof);
    }

    // Determine if we are zero.
    this.isZero = true;
    let ptr = 0;
    for (; ptr < cl; ptr++) {
      if (this.cof[ptr] !== 0) {
        this.isZero = false;
        break;
      }
    }

    if (cl === gl) {
      if (this.cof[cl - 1] > this.settings.maxLastGroupVal) {
        throw Error(apsrRational.INVALID_DP + ' number');
      }
    }
    else {
      // Make sure all groups are allocated.
      for (ptr = cl; ptr < gl; ptr++) {
        this.cof.push(0);
      }
    }

  }

  public static parse(sn: string | number, settings: apsrRationalSettings): apsrRational {

    let s: string;

    // Minus zero?
    if (sn === 0 && 1 / sn < 0) {
      s = '-0';
    }
    else {
      s = sn + '';
      if (!apsrRational.NUMERIC.test(s)) {
        throw Error(apsrRational.INVALID + s);
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

    // Now we have an array of digits and an exponent.
    console.log('apsrRational parsing cof:' + cof + ' exp:' + exp);

    if (exp > settings.logBase) {
      throw Error(apsrRational.INVALID_TOO_BIG + ' cof:' + cof + ' exp:' + exp);
    }

    // 123456
    // E    -1          0         1         2
    //0.123456          1.23456   12.3456   123.456

    let fv: number;
    let numLeadingZeros: number;

    if (exp > -1) {
      fv = Number(cof.slice(0, exp + 1).join(''));
      cof = cof.slice(exp + 1);
    }
    else {
      fv = 0;

      // Append zeros to make the first value in cof be the digit just after the decimal.
      cof = cof.reverse();
      for (; ++exp;) {
        cof.push(0);
      }
      cof = cof.reverse();
    }

    let dGroups: number[] = [];
    dGroups.push(fv);

    let cl: number;
    for (i = 1; i < settings.decGroups; i++) {
      cl = cof.length;
      if (cl > 0) {
        let nv = Number(cof.slice(0, settings.logBase).join('').padEnd(settings.logBase, '0'));
        dGroups[i] = nv;
        cof = cof.slice(settings.logBase);
      }
      else {
        break;
      }
    }

    if (cl > 0) {
      throw Error(apsrRational.INVALID_PERCISE + s);
    }

    let result = new apsrRational(sign, dGroups, settings);
    return result;
  }

  public clone(): apsrRational {
    return new apsrRational(this.sign, this.cof.slice(0), this.settings);
  }

  public round(): apsrRational {
    return this.roundCustom(this.settings.dp);
  }

  public roundCustom(dp: number): apsrRational {

    let t = dp / this.settings.logBase;
    let iPart = Math.trunc(t);

    if (iPart === t) {
      // Round the group pointed to by iPart + 1, based on the value of the group iPart + 2;
      iPart++;
      if (iPart > this.cof.length - 1 || iPart + 1 > this.cof.length - 1 || this.cof[iPart + 1] === 0) {
        // There is no group to round or there is no group following to use to round the group.
        return this;
      }
      else {
        let followingValue = this.cof[iPart + 1] / this.settings.base;
        if (followingValue >= 0.5) {
          this.cof[iPart] += 1;
          for (t = this.cof.length - 1; t > iPart; t--) {
            this.cof[t] = 0;
          }
          this.normalize();
        }
        else {
          for (t = this.cof.length - 1; t > iPart; t--) {
            this.cof[t] = 0;
          }
        }
        this.isZero = this.isThisZero();
      }
    }
    else {
      if (iPart + 1 < this.cof.length) {

        for (t = this.cof.length - 1; t > iPart + 1; t--) {
          this.cof[t] = 0;
        }

        let rem = t - iPart;

        let digCnt = rem * this.settings.logBase;
        let fac = Math.pow(10, this.settings.logBase - digCnt);

        iPart += 1;
        let val = this.cof[iPart];
        val = Math.round(val / fac) * fac;

        if (this.cof[iPart] !== val) {
          this.cof[iPart] = val;

          if (1 === this.settings.logBase - digCnt) {
            this.normalize();
          }
        }
        this.isZero = this.isThisZero();
      }
    }

    return this;
  }

  private isThisZero(): boolean {
    let ptr: number;
    for (ptr = 0; ptr < this.cof.length; ptr++) {
      if (this.cof[ptr] !== 0) {
        return false;
      }
    }
    return true;
  }

  private normalize() {

    let ptr: number;
    for (ptr = this.cof.length - 1; ptr > 0; ptr--) {
      if (this.cof[ptr] > this.settings.base - 1) {
        this.cof[ptr] -= this.settings.base;
        this.cof[ptr - 1] = this.cof[ptr - 1] + 1; // Carry the one.
      }
    }

    if (this.cof[0] >= this.settings.base) {
      throw new Error(apsrRational.INVALID_TOO_BIG + this.cof);
    }
  }

  public abs(): apsrRational {
    this.sign = true;
    return this;
  }

  public multiply(y: apsrRational): apsrRational {


    return this;
  }

  public divide(y: apsrRational): apsrRational {

    // Divisor is zero?
    if (y.isZero) {
      throw Error(apsrRational.DIV_BY_ZERO);
    }

    // Dividend is 0? Return +-0.
    if (this.isZero) {
      this.sign = this.sign === y.sign;
      return this;
    }




    return this;
  }



  public toString(): string {
    let result = (this.sign ? '' : '-') + this.cof;

    return result;
  }

  public toStringF(): string {
    let result = (this.sign ? '' : '-');

    if (this.isZero) {
      result += '0';
    }
    else {
      result += this.cof[0].toLocaleString();

      let dGroups = this.removeTrailingZeroDGroups(this.cof.slice(1));
      if (dGroups.length > 0) {
        result += '.' + this.removeTrailingZeros(this.padDGroups(dGroups, this.settings.logBase));
      }
    }

    return result;
  }

  private removeTrailingZeroDGroups(cof: number[]): number[] {
    let cp = cof.slice(0);
    let l = cp.length;
    for (; l > 0 && cp[--l] === 0;)
      cp.pop();

    return cp;
  }

  private removeTrailingZeros(x: string): string {
    let ptr: number;

    for (ptr = x.length - 1; ptr > -1; ptr--) {
      if (x.charAt(ptr) !== '0') {
        break;
      }
    }

    let result = x.slice(0, ptr + 1);
    return result;
  }

  private padDGroups(dGroups: number[], numDigitsPerGroup: number): string {

    let result: string = '';

    // Pad each group left with zeros.
    let ptr: number;
    for (ptr = 0; ptr < dGroups.length; ptr++) {
      result +=  dGroups[ptr].toString().padStart(numDigitsPerGroup, '0');
    }
    return result;
  }
}

//  export enum srRoundingMode {
//    Down,
//    HalfUp,
//    HalfEven,
//    Up
//}
