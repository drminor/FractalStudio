using System;
using System.Diagnostics;
using System.Text;

namespace Apfp
{
	public class Fp
    {
		private const double STEP = 25;
		private readonly static double BASE = Math.Pow(2, STEP);
		private readonly static double HALF_BASE = Math.Pow(2, STEP - 1);

		private const int POS_COUNT = 5;

		private readonly double[] _digs;

		public Fp(double x)
		{
			_digs = new double[POS_COUNT];

			double remain = x;
			for(int i = 0; i < POS_COUNT; i++)
			{
				_digs[i] = BreakUp(remain, Math.Pow(2, i * -STEP), out remain);
			}
		}

		public Fp(Fp x) : this(x._digs)
		{
		}

		private Fp(double[] digs)
		{
			_digs = (double[])digs.Clone();
		}

		public double[] GetDigits()
		{
			return (double[]) _digs.Clone();
		}

		public double GetDouble()
		{
			double result = 0;

			for(int i = 0; i < _digs.Length; i++)
			{
				result += _digs[i] * Math.Pow(2, i * -STEP);
			}

			return result;
		}

		public string ToDecimalString()
		{
			string[] decComponents = GetDecimalStrings();
			string fixedFmtStr = AddDecimalStrings(decComponents);
			return fixedFmtStr;
		}

		public string[] GetDecimalStrings()
		{
			int pairCnt = BreakUp(_digs.Length, 2, out int remain);
			string[] result = new string[pairCnt + remain];

			for (int i = 0; i < pairCnt; i++)
			{
				int dPtr = i * 2;
				result[i] = FmtDoubleForAdd(_digs[dPtr] * Math.Pow(2, dPtr * -STEP) + _digs[dPtr + 1] * Math.Pow(2, (dPtr + 1) * -STEP));
			}

			if(remain == 1)
			{
				double a = _digs[_digs.Length - 1];
				double b = Math.Pow(2, (_digs.Length - 1) * -STEP);
				double c = a * b;
				result[pairCnt] = FmtDoubleForAdd(_digs[_digs.Length - 1] * Math.Pow(2, (_digs.Length - 1) * -STEP));
			}

			return result;
		}

		private string AddDecimalStrings(string[] decComps)
		{
			int rLen = 0;
			for(int i = 0; i < decComps.Length; i++)
			{
				rLen = Math.Max(rLen, decComps[i].Length);
			}

			//rLen--; // Not including the decimal point

			byte[][] decCompsB = new byte[decComps.Length][];
			for (int i = 0; i < decComps.Length; i++)
			{
				decCompsB[i] = GetDigitsFromString(decComps[i], rLen - 1);
			}

			byte[] output = new byte[rLen];
			byte carry = 0;
			for (int i = rLen-2; i >= 0; i--)
			{
				byte r = carry;
				for (int j = 0; j < decCompsB.Length; j++)
				{
					r += decCompsB[j][i];
					carry = GetCarry(r, out byte remain);
					output[i] = remain;
				}
			}

			StringBuilder sb = new StringBuilder();
			for(int i = 0; i < rLen; i++)
			{
				char g = (char)(output[i] + 48);
				sb.Append(g);
			}

			string result = sb.ToString();

			int ptPos = decComps[0].IndexOf('.');
			result = result.Substring(0, ptPos) + "." + result.Substring(ptPos);

			if(carry != 0)
			{
				result = ((char)carry + '0').ToString() + result;
			}

			return result.TrimStart('0');
		}

		private byte[] GetDigitsFromString(string s, int len)
		{
			s = s.Replace(".", "");
			char[] ca = s.ToCharArray();
			byte[] result = new byte[len];

			int i = 0;
			for(; i < ca.Length; i++)
			{
				result[i] = (byte)(ca[i] - '0');
			}

			for(; i < len; i++)
			{
				result[i] = 0;
			}

			return result;
		}

		public static Fp Mul(Fp a, Fp b)
		{
			double[] r = new double[POS_COUNT * 2];
			double carry = 0;
			int ri;

			for (int ai = POS_COUNT - 1; ai >= 0; ai--)
			{
				ri = ai + POS_COUNT;
				for(int bi = POS_COUNT - 1; bi >= 0; bi--)
				{
					//string lh = a.GetDigitBin(ai);
					//string rh = b.GetDigitBin(bi);

					double p = r[ri] + carry + a._digs[ai] * b._digs[bi];
					carry = BreakUp(p, BASE, out double remain);
					r[ri] = remain;
					ri--;
				}
			}

			//r[0] = carry;
			if (carry != 0)
				throw new OverflowException("Multiplication has caused an overflow.");

			//DMathUtil.ReportDigitsBin(a.GetDouble(), r);

			int cl = POS_COUNT; 
			//int cl = POS_COUNT * 2 - 1;
			//cl = 2;

			double[] rr = new double[cl];
			for (int i = 0; i < cl; i++)
			{
				rr[i] = r[i + 1];
			}

			Fp tResult = new Fp(rr);

			if(r[POS_COUNT + 1] > HALF_BASE)
			{
				//rr[POS_COUNT - 1] += Math.Pow(2, (POS_COUNT - 1) * -STEP);
				//Fp result = Add(tResult, new Fp(Math.Pow(2, (POS_COUNT - 1) * -STEP)));
				//return result;
				return tResult;
			}
			else
			{
				return tResult;
			}
		}

		// LSB * each of b
		//a2 * b2 -> r5;
		//a2 * b1 -> r4;
		//a2 * b0 -> r3;

		//a1 * b2 -> r4;
		//a1 * b1 -> r5;
		//a1 * b0 -> r2;

		// HSB * each of b
		//a0 * b2 -> r3;
		//a0 * b1 -> r2;
		//a0 * b0 -> r1;
		//	multiply(a[1..p], b[1..q], base)                            // Operands containing rightmost digits at index 1
		// product = [1..p+q]                                        // Allocate space for result
		// for b_i = 1 to q                                          // for all digits in b

		//carry = 0
		//   for a_i = 1 to p                                        // for all digits in a

		//  product[a_i + b_i - 1] += carry + a[a_i] * b[b_i]
		//  carry = product[a_i + b_i - 1] / base

		//  product[a_i + b_i - 1] = product[a_i + b_i - 1] mod base

		//product[b_i + p] = carry                               // last digit comes from final carry
		// return product

		public static Fp Add(Fp a, Fp b)
		{
			double[] r = new double[POS_COUNT];
			double carry = 0;

			for(int i = POS_COUNT - 1; i >= 0; i--)
			{
				double s = carry + a._digs[i] + b._digs[i];
				carry = BreakUp(s, BASE, out double remain);
				r[i] = remain;
			}

			if (carry != 0)
				throw new OverflowException("Addition has resulted in an overflow.");

			return new Fp(r);
		}

		public static Fp Add(Fp a, int b)
		{
			double carry = BreakUp(a._digs[0] + b, BASE, out double remain);

			if (carry != 0)
				throw new OverflowException("Addition (with integer) has resulted in an overflow.");

			Fp result = new Fp(a);
			result._digs[0] += b;
			return result;
		}

		public string[] GetDigValues()
		{
			string[] result = new string[POS_COUNT];

			for (int i = 0; i < POS_COUNT; i++)
			{
				result[i] = new DComponents(_digs[i]).ToBase2String(false);
			}

			return result;
		}

		public void ReportDigitsBin()
		{
			double v = GetDouble();
			DComponents vDc = new DComponents(v);
			Debug.WriteLine($"The value is {vDc.ToBase2String(false)} (Decimal: {FmtDouble(v)}).");

			Debug.WriteLine($"The decimal value is {ToDecimalString()}.");

			//string[] decComps = GetDecimalStrings();
			//for (int i = 0; i < decComps.Length; i++)
			//{
			//	Debug.WriteLine($"The decComp for {i} val is {decComps[i]}.");
			//}

			string[] digs = GetDigitsBin();
			for (int i = 0; i < digs.Length; i++)
			{
				Debug.WriteLine($"The {i} val is {digs[i]}, Decimal: {FmtDouble(_digs[i])}.");
			}
		}

		public string[] GetDigitsBin()
		{
			string[] result = new string[_digs.Length];

			for (int i = 0; i < _digs.Length; i++)
			{
				result[i] = new DComponents(_digs[i]).ToBase2String(false);
			}

			return result;
		}

		public string GetDigitBin(int index)
		{
			DComponents dc = new DComponents(_digs[index]);
			return dc.ToBase2String(false) + " Decimal: " + FmtDouble(_digs[index]);
		}

		private static double BreakUp(double x, double posValue, out double remain)
		{
			double result = Math.Truncate(x / posValue);
			remain = x - result * posValue;
			return result;
		}

		private static int BreakUp(int x, int posValue, out int remain)
		{
			int result = x / posValue;
			remain = x - result * posValue;

			return result;
		}

		private static byte GetCarry(byte x, out byte remain)
		{
			remain = x;
			byte result = 0;

			while(remain > 9)
			{
				result++;
				remain -= 10;
			}

			return result;
		}

		private string FmtDouble(double x)
		{
			return x.ToString("#0.0##################################################");
		}

		private string FmtDoubleForAdd(double x)
		{
			return x.ToString("#000000000.0##################################################");
		}

	}
}
