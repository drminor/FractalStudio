using System;
using Newtonsoft.Json;

namespace FractalServer
{
    public class MapInfoWithColorMapForExport
    {
        [JsonProperty("mapInfo")]
        public MapInfo MapInfo;

        [JsonProperty("colorMap")]
        public ColorMapForExport ColorMapForExport;

        [JsonProperty("version")]
        public double Version;

        private MapInfoWithColorMapForExport()
        {
            MapInfo = null;
            ColorMapForExport = null;
            Version = -1;
        }

        public MapInfoWithColorMapForExport(MapInfo mapInfo, ColorMapForExport colorMapForExport, double version)
        {
            MapInfo = mapInfo ?? throw new ArgumentNullException(nameof(mapInfo));
            ColorMapForExport = colorMapForExport ?? throw new ArgumentNullException(nameof(colorMapForExport));
            Version = version;
        }
    }
}
