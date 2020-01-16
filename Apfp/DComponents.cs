using System;
using System.Text;

namespace Apfp
{
	public class DComponents
	{
		public bool IsNegative { get; set; }
		public int Exponent { get; set; }
		public long Mantissa { get; set; }

		public DComponents(double x) : this(GetDComponents(x))
		{
		}

		public DComponents(DComponents dc)
		{
			IsNegative = dc.IsNegative;
			Exponent = dc.Exponent;
			Mantissa = dc.Mantissa;
		}

		public DComponents(bool isNegative, int exponent, long mantissa)
		{
			IsNegative = isNegative;
			Exponent = exponent;
			Mantissa = mantissa;
		}

		public string ToBase2String(bool useExponentialForm)
		{
			string sign = IsNegative ? "-" : string.Empty;

			if (useExponentialForm)
			{
				if (Mantissa == 0)
				{
					return $"{sign}0";
				}

				return $"{sign}{GetMantissaAsBinString()}e{Exponent}";
			}
			else
			{
				string m = GetMantissaAsBinString();
				int e;
				if(Exponent < 0)
				{
					e = -Exponent;
					//if (m.Length <= e)
					m = m.PadLeft(e + 1, '0');
					m = m.Substring(0, m.Length - e) + '.' + m.Substring(m.Length - e);
				}
				else if(Exponent > 0)
				{
					e = Exponent;
					m = m + new string('0', e) + ".0";
						//string(3, '0');  m.PadRight(e + 1, '0');
					//m = m + new string('0', Exponent);
					//m = m.Substring(0, e) + '.' + m.Substring(e);
				}
				else
				{
					m = m + ".0";
				}

				return $"{sign}{m}";
			}
		}

		private string GetMantissaAsBinString()
		{
			if (Mantissa == 0)
				return "0";

			StringBuilder sb = new StringBuilder();

			long m = Mantissa;
			for (int i = 0; i < 52; i++)
			{
				if ((m & 1) == 0)
					sb.Append("0");
				else
					sb.Append("1");

				m >>= 1;
			}
			return ReverseString(sb.ToString()).TrimStart('0');
		}

		private string ReverseString(string s)
		{
			char[] array = s.ToCharArray();
			Array.Reverse(array);
			return new string(array);
		}

		public static DComponents GetDComponents(double d)
		{
			// Translate the double into sign, exponent and mantissa.
			long bits = BitConverter.DoubleToInt64Bits(d);

			// Note that the shift is sign-extended, hence the test against -1 not 1
			bool isNegative = (bits & (1L << 63)) != 0;
			int exponent = (int)((bits >> 52) & 0x7ffL);
			long mantissa = bits & 0xfffffffffffffL;

			if (mantissa == 0 && exponent == 0)
			{
				return new DComponents(isNegative, 0, 0);
			}

			// Subnormal numbers; exponent is effectively one higher,
			// but there's no extra normalisation bit in the mantissa
			if (exponent == 0)
			{
				exponent++;
			}
			// Normal numbers; leave exponent as it is but add extra
			// bit to the front of the mantissa
			else
			{
				mantissa = mantissa | (1L << 52);
			}

			// Bias the exponent. It's actually biased by 1023, but we're
			// treating the mantissa as m.0 rather than 0.m, so we need
			// to subtract another 52 from it.
			exponent -= 1075;

			if (mantissa != 0)
			{
				/* Normalize */
				while ((mantissa & 1) == 0)
				{    /*  i.e., Mantissa is even */
					mantissa >>= 1;
					exponent++;
				}
			}

			return new DComponents(isNegative, exponent, mantissa);
		}

	}
}
