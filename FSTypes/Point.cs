using MqMessages;
using Newtonsoft.Json;

namespace FSTypes
{
	public class Point
	{
		[JsonProperty("x")]
		public int X;

		[JsonProperty("y")]
		public int Y;

		private Point()
		{
			X = 0;
			Y = 0;
		}

		public Point(int x, int y)
		{
			X = x;
			Y = y;
		}

		public PointInt GetPointInt()
		{
			return new PointInt(X, Y);
		}

		public KPoint GetKPoint()
		{
			return new KPoint(X, Y);
		}
	}
}
