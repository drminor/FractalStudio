using Newtonsoft.Json;

namespace FractalServer
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
	}


	public class DPoint
    {
        [JsonProperty("x")]
        public double X;

        [JsonProperty("y")]
        public double Y;

        private DPoint()
        {
            X = 0;
            Y = 0;
        }

        public DPoint(double x, double y)
        {
            X = x;
            Y = y;
        }

		public static bool TryGetFromSPoint(SPoint sPoint, out DPoint dPoint)
		{
			if(double.TryParse(sPoint.X, out double x))
			{
				if(double.TryParse(sPoint.Y, out double y))
				{
					dPoint = new DPoint(x, y);
					return true;
				}
				else
				{
					dPoint = new DPoint();
					return false;
				}
			}
			else
			{
				dPoint = new DPoint();
				return false;
			}
		}

        [JsonIgnore]
        public double SizeSquared
        {
            get
            {
                return X * X + Y * Y;
            }
        }
    }

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
	}
}
