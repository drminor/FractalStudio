using Newtonsoft.Json;

namespace FractalServer
{
    public class MapInfo
    {
        [JsonProperty("coords")]
        public readonly Coords Coords;

        [JsonProperty("maxIterations")]
        public readonly int MaxIterations;

        public MapInfo(Coords coords, int maxIterations)
        {
            Coords = coords;
            MaxIterations = maxIterations;
        }

        public MapInfo(DPoint leftBot, DPoint rightTop, int maxIterations)
            : this(new Coords(leftBot, rightTop), maxIterations) { }

        [JsonIgnore]
        public DPoint LeftBot => Coords.LeftBot;

        [JsonIgnore]
        public DPoint RightTop => Coords.RightTop;

        [JsonIgnore]
        public double AspectRatio
        {
            get
            {
                double result = Coords.Width / Coords.Height;
                return result;
            }
        }

    }
}
