using Newtonsoft.Json;

namespace FSTypes
{
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
}
