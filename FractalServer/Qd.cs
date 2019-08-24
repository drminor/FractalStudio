using System.Runtime.InteropServices;

namespace FractalServer
{

	[StructLayout(LayoutKind.Sequential)]
	public struct Qd
	{
		public double Hi;
		public double Lo;

		public Qd(double hi, double lo)
		{
			Hi = hi;
			Lo = lo;
		}

		public Qd(string number)
		{
			Hi = QdWrapper.CallParse(number, out double lo);
			Lo = lo;
		}

		public override string ToString()
		{
			string result = QdWrapper.CallGetDigits(Hi, Lo, 32);
			return result;
		}

	}
}
