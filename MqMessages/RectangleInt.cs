using System;

namespace MqMessages
{
	[Serializable]
	public class RectangleInt
	{
		public RectangleInt() : this(new PointInt(), new SizeInt()) { }

		public RectangleInt(PointInt point, SizeInt size)
		{
			Point = point;
			Size = size;
		}

		public PointInt Point { get; set; }
		public SizeInt Size { get; set; }
	}
}
