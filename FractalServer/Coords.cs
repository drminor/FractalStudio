using System;
using Newtonsoft.Json;

namespace FractalServer
{
	public class Coords
    {
        [JsonProperty("botLeft")]
        public DPoint LeftBot;

        [JsonProperty("topRight")]
        public DPoint RightTop;

        private Coords()
        {
            LeftBot = new DPoint(0, 0);
            RightTop = new DPoint(0, 0);
        }

        public Coords(DPoint leftBot, DPoint rightTop)
        {
            LeftBot = leftBot ?? throw new ArgumentNullException(nameof(leftBot));
            RightTop = rightTop ?? throw new ArgumentNullException(nameof(rightTop));
        }

		public static bool TryGetFromSCoords(SCoords sCoords, out Coords coords)
		{
			if(DPoint.TryGetFromSPoint(sCoords.LeftBot, out DPoint leftBot))
			{
				if(DPoint.TryGetFromSPoint(sCoords.RightTop, out DPoint rightTop))
				{
					coords = new Coords(leftBot, rightTop);
					return true;
				}
				else
				{
					coords = new Coords();
					return false;
				}
			}
			else
			{
				coords = new Coords();
				return false;
			}
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
