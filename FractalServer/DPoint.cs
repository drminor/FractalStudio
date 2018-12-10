using Newtonsoft.Json;

namespace FractalServer
{
    public class DPoint
    {
        [JsonProperty("x")]
        public double X;

        [JsonProperty("y")]
        public double Y;

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
