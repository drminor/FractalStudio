using System.Runtime.InteropServices;

namespace FractalServer
{

	//public struct Complex
	//{
	//	public double re;
	//	public double im;
	//};

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
