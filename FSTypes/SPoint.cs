using Newtonsoft.Json;

namespace FSTypes
{
	public class SPoint
	{
		[JsonProperty("x")]
		public string X;

		[JsonProperty("y")]
		public string Y;

		private SPoint()
		{
			X = "0";
			Y = "0";
		}

		public SPoint(string x, string y)
		{
			X = x;
			Y = y;
		}

		public SPoint(DPoint dPoint)
		{
			X = dPoint.X.ToString("R");
			Y = dPoint.Y.ToString("R");
		}

		public override string ToString()
		{
			string result = $"x:{X}; y:{Y}";
			return result;
		}
	}
}
