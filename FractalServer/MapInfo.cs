using System.Drawing;

namespace FractalServer
{
    public class MapInfo
    {
        public readonly RectangleF Coords;
        public readonly int MaxIterations;

        public MapInfo(RectangleF coords, int maxIterations)
        {
            Coords = coords;
            MaxIterations = maxIterations;
        }

    }
}
