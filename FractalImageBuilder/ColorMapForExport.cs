using System;
using Newtonsoft.Json;

namespace FractalImageBuilder
{
    public class ColorMapForExport
    {
        [JsonProperty("ranges")]
        public ColorMapEntryForExport[] Ranges;

        [JsonProperty("highColorCss")]
        public string HighColorCss;

        [JsonProperty("version")]
        public double Version;

        private ColorMapForExport()
        {
            Ranges = new ColorMapEntryForExport[0];
            HighColorCss = null;
            Version = -1;
        }

        public ColorMapForExport(ColorMapEntryForExport[] ranges, string highColorCss, double version)
        {
            Ranges = ranges ?? throw new ArgumentNullException(nameof(ranges));
            HighColorCss = highColorCss ?? throw new ArgumentNullException(nameof(highColorCss));
            Version = version;
        }
    }
}
