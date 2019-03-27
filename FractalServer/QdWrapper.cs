using System;
using System.Runtime.InteropServices;
using System.Text;

namespace FractalServer
{
	public class QdWrapper
	{
		[DllImport(@"C:\DEV\VS2013Projects\QD-1_1_3\Numerics\Debug\FractalQd", SetLastError = true)]
		public static extern void CalcMap(int maxIterations, int xLen, [In] Qd[] xVals, int yLen, [In] Qd[] yVals, [In, Out] int[] cnts);

		public static int[] CallCalcMap(int maxIterations, Qd[] xVals, Qd[] yVals)
		{
			int xLen = xVals.Length;
			int yLen = yVals.Length;

			int[] result = new int[xLen * yLen];
			CalcMap(maxIterations, xLen, xVals, yLen, yVals, result);

			return result;
		}

		[DllImport(@"C:\DEV\VS2013Projects\QD-1_1_3\Numerics\Debug\FractalQd", SetLastError = true)]
		public static extern void GetSamplePoints(Qd start,	Qd end, int n, [In, Out]  Qd[] array);

		public static Qd[] CallGetSamplePoints(Qd start, Qd end, int n)
		{
			Qd[] array = new Qd[n];
			GetSamplePoints(start, end, n, array);

			return array;
		}

		[DllImport(@"C:\DEV\VS2013Projects\QD-1_1_3\Numerics\Debug\FractalQd", SetLastError = true)]
		public static extern void TryComplex(Qd inputVar,
				ref Qd outputVar, int n, [In, Out]  Qd[] array);

		public static void CallTryComplex(Qd inputVar,
				  ref Qd outputVar, Qd[] array)
		{
			int n = 2;
			TryComplex(inputVar, ref outputVar, n, array);
		}

		[DllImport(@"C:\DEV\VS2013Projects\QD-1_1_3\Numerics\Debug\FractalQd", CharSet = CharSet.Ansi, SetLastError = true)]
		public static extern double Parse(string lpString, ref double lo);

		public static double CallParse(string str, out double lo)
		{
			lo = 0;
			double hi = Parse(str, ref lo);
			return hi;
		}

		[DllImport(@"C:\DEV\VS2013Projects\QD-1_1_3\Numerics\Debug\FractalQd", CharSet = CharSet.Ansi, SetLastError = true)]
		public static extern void GetDigits(double hi, double lo, StringBuilder buf, int precision);

		public static string CallGetDigits(double hi, double lo, int precision)
		{
			int ml = 40;
			StringBuilder sb = new StringBuilder(ml);

			GetDigits(hi, lo, sb, precision);
			string result = sb.ToString();

			result = RemoveExp(result);
			result = RemoveTrailingZeros(result);

			return result;
		}

		[DllImport(@"C:\DEV\VS2013Projects\QD-1_1_3\Numerics\Debug\FractalQd")]
		public static extern double quick_two_sum(double a, double b);

		public static double CallQuickTwoSum(double a, double b)
		{
			double r = quick_two_sum(a, b);
			return r;
		}

		public static string RemoveExp(string s)
		{
			if (s.EndsWith("e+00"))
				return s.Substring(0, s.Length - 4);
			else
				return s;
		}

		public static string RemoveTrailingZeros(string s)
		{
			if (s == null) throw new ArgumentNullException(nameof(s));

			string f;
			string b;
			int pos = s.IndexOf('e');
			if (pos > -1)
			{
				f = s.Substring(0, pos);
				b = s.Substring(pos);
			}
			else
			{
				f = s;
				b = string.Empty;
			}

			if (f.EndsWith("0"))
			{
				char[] digits = { '1', '2', '3', '4', '5', '6', '7', '8', '9' };

				int pos2 = f.LastIndexOfAny(digits);
				f = f.Substring(0, pos2 + 1);
			}

			return f + b;
		}

	}
}
