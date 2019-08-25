using System;

namespace MqMessages
{
	[Serializable]
	public class PointInt
	{
		public PointInt() : this(0,0) {	}

		public PointInt(int x, int y)
		{
			X = x;
			Y = y;
		}

		public int X { get; set; }
		public int Y { get; set; }
	}
}
