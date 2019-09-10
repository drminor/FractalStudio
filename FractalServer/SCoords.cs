using System;
using Newtonsoft.Json;

namespace FractalServer
{
	public class SCoords
	{
		[JsonProperty("botLeft")]
		public SPoint LeftBot;

		[JsonProperty("topRight")]
		public SPoint RightTop;

		private SCoords()
		{
			LeftBot = new SPoint("0", "0");
			RightTop = new SPoint("0", "0");
		}

		public SCoords(SPoint leftBot, SPoint rightTop)
		{
			LeftBot = leftBot ?? throw new ArgumentNullException(nameof(leftBot));
			RightTop = rightTop ?? throw new ArgumentNullException(nameof(rightTop));
		}

		public SCoords(Coords coords)
		{
			LeftBot = new SPoint(coords.LeftBot);
			RightTop = new SPoint(coords.RightTop);
		}

		public override string ToString()
		{
			string result = $"sx:{LeftBot.X}; sy:{LeftBot.Y}; ex:{RightTop.X}; ey:{RightTop.Y}";
			return result;
		}
	}

}
