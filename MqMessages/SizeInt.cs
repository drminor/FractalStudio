using System;

namespace MqMessages
{
	[Serializable]
	public class SizeInt
	{
		public SizeInt() : this(0, 0) { }

		public SizeInt(int w, int h)
		{
			W = w;
			H = h;
		}

		public int W { get; set; }
		public int H { get; set; }
	}
}
