
export class apRational {

  constructor(public sign: boolean, public exp: number, public cof: number[]) { }

  public toString(): string {

    let result: string;
    result = this.cof + ' with exp = ' + this.exp;

    if (!this.sign) {
      result = '-' + result;
    }

    return result;
  }

}


export class apRationalCalc {

  // Error messages.
  static NAME = '[apRationalCalc]';
  static INVALID = apRationalCalc.NAME + ' Invalid';
  static INVALID_DP = apRationalCalc.INVALID + ' decimal places';
  static INVALID_RM = apRationalCalc.INVALID + ' rounding mode';
  static DIV_BY_ZERO = apRationalCalc.NAME + ' Division by zero';

  static NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;

  public MaxDp: number;
  public MaxPower: number;

  constructor(public dp: number, public rm: RoundingMode, public posExp: number, public negExp: number) {
    this.MaxDp = 1000000;
    this.MaxPower = 1000000;
  }

  public static parse(sn: string | number): apRational {

    let s: string;

    // Minus zero?
    if (sn === 0 && 1 / sn < 0) {
      s = '-0';
    }
    else {
      s = sn + '';
      if (!apRationalCalc.NUMERIC.test(s)) {
        throw Error(apRationalCalc.INVALID + ' number');
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
    for (i = 0; i < nl && s.charAt(i) == '0';)++i;

    if (i === nl) {
      // Zero.
      exp = 0;
      cof = [0];
    }
    else {
      // Determine trailing zeros.
      for (; nl > 0 && s.charAt(--nl) == '0';);

      exp = e - i - 1;
      cof = [];

      // Convert string to array of digits without leading/trailing zeros.
      for (e = 0; i <= nl;) cof[e++] = +s.charAt(i++);
    }

    let result = new apRational(sign, exp, cof);
    return result;
  }

  //  /*
//   * Return a string representing the value of Big x in normal or exponential notation.
//   * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
//   *
//   * x {Big}
//   * id? {number} Caller id.
//   *         1 toExponential
//   *         2 toFixed
//   *         3 toPrecision
//   *         4 valueOf
//   * n? {number|undefined} Caller's argument.
//   * k? {number|undefined}
//   */
//  function stringify(x, id, n, k) {
//    var e, s,
//      Big = x.constructor,
//      z = !x.c[0];

//    if (n !== UNDEFINED) {
//      if (n !== ~~n || n < (id == 3) || n > MAX_DP) {
//        throw Error(id == 3 ? INVALID + 'precision' : INVALID_DP);
//      }

//      x = new Big(x);

//      // The index of the digit that may be rounded up.
//      n = k - x.e;

//      // Round?
//      if (x.c.length > ++k) round(x, n, Big.RM);

//      // toFixed: recalculate k as x.e may have changed if value rounded up.
//      if (id == 2) k = x.e + n + 1;

//      // Append zeros?
//      for (; x.c.length < k;) x.c.push(0);
//    }

//    e = x.e;
//    s = x.c.join('');
//    n = s.length;

//    // Exponential notation?
//    if (id != 2 && (id == 1 || id == 3 && k <= e || e <= Big.NE || e >= Big.PE)) {
//      s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

//      // Normal notation.
//    } else if (e < 0) {
//      for (; ++e;) s = '0' + s;
//      s = '0.' + s;
//    } else if (e > 0) {
//      if (++e > n) for (e -= n; e--;) s += '0';
//      else if (e < n) s = s.slice(0, e) + '.' + s.slice(e);
//    } else if (n > 1) {
//      s = s.charAt(0) + '.' + s.slice(1);
//    }

//    return x.s < 0 && (!z || id == 4) ? '-' + s : s;
//  }


  //return stringify(this, 2, dp, this.e + dp);

  public toFixed(x: apRational): string {
    let result: string = '';

    let n = this.dp;
    //      // The index of the digit that may be rounded up.
//      n = k - x.e;


    return result;

  }

  public stringify(x: apRational): string {
    let result: string = '';



    return result;
  }


  public round(x: apRational, dp: number, rm: RoundingMode, more: boolean): apRational {
    let xc = x.cof;
    let i = x.exp + dp + 1;

    if (i < xc.length) {
      if (rm === RoundingMode.HalfUp) {
        
        // xc[i] is the digit after the digit that may be rounded up.
        more = xc[i] >= 5;
      } else if (rm === RoundingMode.HalfEven) {

        let mf = this.getMoreForHalfEven(xc, i, more);

        more = i > -1 && (xc[i] > 5 || xc[i] === 5 && (more || xc[i + 1] !== undefined || 0 !== (xc[i - 1] & 1) )  );
        if (mf !== more) throw new Error('mf != more');

      } else if (rm === RoundingMode.Up) {
        more = more || !!xc[0];
      } else {
        more = false;
        if (rm !== RoundingMode.Down) throw Error(apRationalCalc.INVALID_RM);
      }

      if (i < 1) {
        xc.length = 1;

        if (more) {
          // 1, 0.1, 0.01, 0.001, 0.0001 etc.
          x.exp = -dp;
          xc[0] = 1;
        } else {
          // Zero.
          xc[0] = 0;
          x.exp = 0;
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
              ++x.exp;
              xc.unshift(1);
            }
          }
        }

        // Remove trailing zeros.
        for (i = xc.length; !xc[--i];) xc.pop();
      }
    } 

    return x;
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

//  /*
//   * Round Big x to a maximum of dp decimal places using rounding mode rm.
//   * Called by stringify, P.div, P.round and P.sqrt.
//   *
//   * x {Big} The Big to round.
//   * dp {number} Integer, 0 to MAX_DP inclusive.
//   * rm {number} 0, 1, 2 or 3 (DOWN, HALF_UP, HALF_EVEN, UP)
//   * [more] {boolean} Whether the result of division was truncated.
//   */
//  function round(x, dp, rm, more) {
//    var xc = x.c,
//      i = x.e + dp + 1;

//    if (i < xc.length) {
//      if (rm === 1) {

//        // xc[i] is the digit after the digit that may be rounded up.
//        more = xc[i] >= 5;
//      } else if (rm === 2) {
//        more = xc[i] > 5 || xc[i] == 5 &&
//          (more || i < 0 || xc[i + 1] !== UNDEFINED || xc[i - 1] & 1);
//      } else if (rm === 3) {
//        more = more || !!xc[0];
//      } else {
//        more = false;
//        if (rm !== 0) throw Error(INVALID_RM);
//      }

//      if (i < 1) {
//        xc.length = 1;

//        if (more) {

//          // 1, 0.1, 0.01, 0.001, 0.0001 etc.
//          x.e = -dp;
//          xc[0] = 1;
//        } else {

//          // Zero.
//          xc[0] = x.e = 0;
//        }
//      } else {

//        // Remove any digits after the required decimal places.
//        xc.length = i--;

//        // Round up?
//        if (more) {

//          // Rounding up may mean the previous digit has to be rounded up.
//          for (; ++xc[i] > 9;) {
//            xc[i] = 0;
//            if (!i--) {
//              ++x.e;
//              xc.unshift(1);
//            }
//          }
//        }

//        // Remove trailing zeros.
//        for (i = xc.length; !xc[--i];) xc.pop();
//      }
//    } else if (rm < 0 || rm > 3 || rm !== ~~rm) {
//      throw Error(INVALID_RM);
//    }

//    return x;
//  }




}

export enum RoundingMode {
  Down,
  HalfUp,
  HalfEven,
  Up
}
