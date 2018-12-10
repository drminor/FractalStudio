using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FractalServer
{
    public class MapInfoWithColorMap
    {
        public readonly MapInfo MapInfo;
        public readonly ColorMap ColorMap;
        public readonly double Version;

        public MapInfoWithColorMap(MapInfo mapInfo, ColorMap colorMap, double version)
        {
            MapInfo = mapInfo;
            ColorMap = colorMap;
            Version = version;
        }
    }

}
