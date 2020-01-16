using System;
using System.Diagnostics;

namespace Apfp
{
	internal class DMathUtil
	{
		private static readonly double DOT_EIGHT_MULTPLIER = Math.Pow(2, -8);

		public static double ParseQ4Dot8(string x)
		{
			string[] parts = x.Split('.');

			double result = ParseBin(parts[0], 4);

			result += DOT_EIGHT_MULTPLIER * ParseBin(parts[1], 8);

			return result;
		}

		public static double ParseBin(string x, int maxLength)
		{
			if (x.Length > 4) throw new ArgumentException($"String must have length < {maxLength}.");

			if(string.IsNullOrEmpty(x))
			{
				return 0;
			}

			double result = 0;

			char[] array = x.Trim().ToCharArray();
			Array.Reverse(array);
			int val = 1;
			for(int i = 0; i < array.Length; i++)
			{
				char d = array[i];
				if(d == '1')
				{
					result += val;
				}
				if(d != '0')
				{
					throw new ArgumentException("String must contain only 0s and 1s.");
				}
				val *= 2;
			}

			return result;
		}

		public static void ReportDigitsBin(double v, double[] digits)
		{
			DComponents vDc = new DComponents(v);
			Debug.WriteLine($"The value is {vDc.ToBase2String(false)} (Decimal: {FmtDouble(v)}.");

			for (int i = 0; i < digits.Length; i++)
			{
				DComponents dc = new DComponents(digits[i]);
				Debug.WriteLine($"The {i} val is {dc.ToBase2String(false)}.");
			}
		}

		private static string FmtDouble(double x)
		{
			return x.ToString("#0.0###################");
		}
	}
}
