import * as bigInt from 'big-integer';
import { BigInteger } from 'big-integer';


export class Test {

  public x: BigInteger;

  public getSum(f: number, s: number): BigInteger {

    let fbn = bigInt(f);
    let sbn = bigInt(s);

    let r = fbn.add(sbn);

    return r;

  }

}
