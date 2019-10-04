using System;
using FSTypes;
using Newtonsoft.Json;

namespace FractalImageBuilder
{
    public class MapInfo
    {
        [JsonProperty("coords")]
        public Coords Coords;

        [JsonProperty("maxIterations")]
        public int MaxIterations;

        private MapInfo()
        {
            Coords = null;
            MaxIterations = 0;
        }

        public MapInfo(Coords coords, int maxIterations)
        {
            Coords = coords ?? throw new ArgumentNullException(nameof(coords));
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
