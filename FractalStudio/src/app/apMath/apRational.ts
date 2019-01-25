
export class apRational {

  constructor(public sign: boolean, public exp: number, public cof: number[]) { }

  public toString(): string {
    let result = (this.sign ? '' : '-') +  this.cof.join('') + 'e' + this.exp;
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

  public posExp: number;
  public negExp: number;

  public MaxDp: number;
  public MaxPower: number;

  //public IncludeSignForZero: boolean;
  //public IncludeTrailingZeros: boolean;

  constructor(public dp: number, public rm: RoundingMode) {
    this.posExp = 8;
    this.negExp = 8;

    this.MaxDp = 1000000;
    this.MaxPower = 1000000;

    //this.IncludeSignForZero = false;
    //this.IncludeTrailingZeros = false;
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

  public stringify(x: apRational): string {
    let result: string = '';

    if (x.exp >= this.posExp || x.exp <= this.negExp) {
      result = this.toExponential(x);
    }
    else {
      result = this.toFixed(x);
    }

    return result;
  }

  //  P.toExponential = function (dp) {
  //    return stringify(this, 1, dp, dp);

  //  P.toFixed = function (dp) {
  //    return stringify(this, 2, dp, this.e + dp);

  //  P.toPrecision = function (sd) {
  //    return stringify(this, 3, sd, sd - 1);

  public toFixed(x: apRational): string {
    return this.toFixedCustom(x, this.dp, this.rm);
  }

  public toFixedCustom(x: apRational, dp: number, roundingMode: RoundingMode): string {

    if (!Number.isInteger(dp) || dp < 0 || dp > this.MaxDp) {
      // Consider using ~~dp !== dp instead of Number.isInteger(dp)
      throw new Error(apRationalCalc.INVALID_DP);
    }

    let k = dp + 1;

    // n is the index of the digit that may be rounded up.
    let n = dp;

    // Round?
    if (x.cof.length > k) {
      x = this.roundCustom(x, n, roundingMode, false);

      // Recalculate k as x.exp may have changed if value rounded up.
      k = x.exp + dp + 1;
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

    return !x.sign && (!z /*|| this.IncludeSignForZero*/) ? '-' + s : s;
  }

  public toExponential(x: apRational): string {
    return this.toExponentialCustom(x, this.dp, this.rm);
  }

  public toExponentialCustom(x: apRational, dp: number, roundingMode: RoundingMode): string {

    if (!Number.isInteger(dp) || dp < 0 || dp > this.MaxDp) {
      // Consider using ~~dp !== dp instead of Number.isInteger(dp)
      throw new Error(apRationalCalc.INVALID_DP);
    }

    let k = dp + 1;

    // n is the index of the digit that may be rounded up.
    let n = dp - x.exp;

    // Round?
    if (x.cof.length > k) {
      this.roundCustom(x, n, roundingMode, false);
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

    return !x.sign && (!z /*|| this.IncludeSignForZero*/) ? '-' + s : s;
  }

  public clone(x: apRational): apRational {
    let result = new apRational(x.sign, x.exp, x.cof);
    return result;
  }

  public roundCustom(x: apRational, dp: number, rm: RoundingMode, more: boolean): apRational {
    let result = this.roundInPlace(this.clone(x), dp, rm, more);
    return result;
  }

  public round(x: apRational): apRational {
    let result = this.roundInPlace(this.clone(x), this.dp, this.rm, false);
    return result;
  }

  /**
   * 
   * @param x - The value that will be rounded.
   * @param dp - Number of digits after the decimal
   * @param rm - Rounding Mode
   * @param {boolean} more - true if you want force rounding up when the last digit is 5. Useful if this is called after a division and the division operation truncates the mantissa.
   * 
   */
  public roundInPlace(x: apRational, dp: number, rm: RoundingMode, more: boolean): apRational {
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

  public abs(x: apRational): apRational {
    return new apRational(true, x.exp, x.cof);
  }

  public divide(x: apRational, y: apRational): apRational {

    y = this.clone(y);

    let a = x.cof;
    let b = y.cof;

    let sn = x.sign === y.sign;

    // Divisor is zero?
    if (!b[0]) throw Error(apRationalCalc.DIV_BY_ZERO);

    // Dividend is 0? Return +-0.
    if (!a[0]) return new apRational(sn, 0, [0]);

    let bz = b.slice();
    let bl = b.length;
    let ai = bl;

    let al = a.length;

    let r = a.slice(0, bl);
    let rl = r.length;

    let q = y;
    q.cof = [];
    q.exp = x.exp - q.exp;
    q.sign = sn;

    let qc = q.cof;
    let qi = 0;
    let d = this.dp + q.exp + 1;    // number of digits of the result

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
        if (bl != rl) {
          cmp = bl > rl ? 1 : -1;
        }
        else
        {
          for (ri = -1, cmp = 0; ++ri < bl;) {
            if (b[ri] != r[ri]) {
              cmp = b[ri] > r[ri] ? 1 : -1;
              break;
            }
          }
        }


        // If divisor < remainder, subtract divisor from remainder.
        if (cmp < 0) {

          // Remainder can't be more than 1 digit longer than divisor.
          // Equalise lengths using divisor with extra leading zero?
          rl = bl;
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
        else
        {
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

    } while (  (ai++ < al || r[0] !== undefined) && k--);

    // Leading zero? Do not remove if result is simply zero (qi == 1).
    if (!qc[0] && qi != 1) {

      // There can't be more than one zero.
      qc.shift();
      q.exp--;
    }

    // Round?
    if (qi > d)
      this.roundInPlace(q, this.dp, this.rm, r[0] !== undefined);

    return q;
  }

  public multiply(x: apRational, y: apRational): apRational {

    y = this.clone(y);

    let xc = x.cof;
    let yc = y.cof;
    let a = xc.length;
    let b = yc.length;
    let i = x.exp;
    let j = y.exp;

    // Determine sign of result.
    y.sign = x.sign === y.sign;

    // Return signed 0 if either 0.
    if (!xc[0] || !yc[0]) {
      return new apRational(y.sign, 0, [0]);
    }

    // Initialise exponent of result as x.e + y.e.
    y.exp = i + j;

    let c: number[];

    // If array xc has fewer digits than yc, swap xc and yc, and lengths.
    if (a < b) {
      let c = xc;
      xc = yc;
      yc = c;
      j = a;
      a = b;
      b = j;
    }

    j = a + b;
    c = new Array(j);

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
      ++y.exp;
    else
      c.shift();

    // Remove trailing zeros.
    for (i = c.length; !c[--i];) c.pop();
    y.cof = c;

    return y;
  }

  public minus(x: apRational, y: apRational): apRational {

    if (x.sign !== y.sign) {
      return this.plusInt(x, y, true);
    }
    else {
      return this.minusInt(x, y, false);
    }
  }

  private minusInt(x: apRational, y: apRational, negateY: boolean): apRational {

    y = this.clone(y);
    if (negateY) y.sign = !y.sign;

    let xc = x.cof;
    let yc = y.cof;

    // Either zero?
    if (!xc[0] || !yc[0]) {

      if (yc[0]) {
        // y is not zero, therefor x is: return 0 - y, i.e., -y
        return y;
      }
      else
      {
        // y is zero; x - 0 = x: return x
        return this.clone(x);
      }
    }

    xc = xc.slice();

    let xe = x.exp;
    let ye = y.exp;
    let t: number[];

    let a = xe - ye;
    let b: number;
    let xlty: boolean;
    let i: number;
    let j: number;

    // Determine which is the bigger number. Prepend zeros to equalise exponents.
    if (a = xe - ye) {
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
        if (xc[b] != yc[b]) {
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
      y.sign = !y.sign;
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
      y.sign = true;

      // Result must be zero.
      ye = 0;
      xc = [0];
    }

    y.cof = xc;
    y.exp = ye;

    return y;
  }

  public plus(x: apRational, y: apRational): apRational {

    if (x.sign !== y.sign) {
      return this.minusInt(x, y, true);
    }
    else {
      return this.plusInt(x, y, false);
    }
  }

  private plusInt(x: apRational, y: apRational, negateY: boolean): apRational {

    y = this.clone(y);
    if (negateY) y.sign = !y.sign;

    let xc = x.cof;
    let yc = y.cof;

    // Either zero?
    if (!xc[0] || !yc[0]) {

      if (yc[0]) {
        // y is not zero, therefor x is: return 0 + y, i.e., y
        return y;
      }
      else {
        // y is zero; x + 0 = x
        return this.clone(x);
      }
    }

    xc = xc.slice();

    let xe = x.exp;
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

    y.cof = xc;
    y.exp = ye;

    return y;
  }

}

export enum RoundingMode {
  Down,
  HalfUp,
  HalfEven,
  Up
}
