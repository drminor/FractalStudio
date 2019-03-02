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

        [JsonIgnore]
        public double SizeSquared
        {
            get
            {
                return X * X + Y * Y;
            }
        }
    }
}
