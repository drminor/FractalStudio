using System.Drawing;

namespace FractalServer
{
    public class MapInfo
    {
        public readonly DPoint LeftBot;
        public readonly DPoint RightTop;
        //public readonly RectangleF Coords;
        public readonly int MaxIterations;

        public MapInfo(DPoint leftBot, DPoint rightTop, int maxIterations)
        {
            LeftBot = leftBot;
            RightTop = rightTop;
            //Coords = coords;
            MaxIterations = maxIterations;
        }

        public double AspectRatio
        {
            get
            {
                double w = RightTop.X - LeftBot.X;
                double h = RightTop.Y - LeftBot.Y;
                double result = w / h;

                return result;
            }
        }

    }
}
