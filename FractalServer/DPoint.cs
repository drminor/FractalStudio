using Newtonsoft.Json;

namespace FractalServer
{
	public class SPoint
	{
		public double x;

		public double y;

		public SPoint()
		{
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
