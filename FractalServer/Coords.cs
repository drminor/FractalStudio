using System;
using Newtonsoft.Json;

namespace FractalServer
{
    public class Coords
    {
        [JsonProperty("botLeft")]
        public readonly DPoint LeftBot;

        [JsonProperty("topRight")]
        public readonly DPoint RightTop;

        public Coords(DPoint leftBot, DPoint rightTop)
        {
            LeftBot = leftBot ?? throw new ArgumentNullException(nameof(leftBot));
            RightTop = rightTop ?? throw new ArgumentNullException(nameof(rightTop));
        }

        [JsonIgnore]
        public double Width
        {
            get
            {
                return RightTop.X - LeftBot.X;
            }
        }

        [JsonIgnore]
        public double Height
        {
            get
            {
                return RightTop.Y - LeftBot.Y;
            }
        }

        [JsonIgnore]
        public bool IsUpsideDown
        {
            get
            {
                return Height < 0;
            }
        }
    }
}
