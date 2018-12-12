using System;
using Newtonsoft.Json;

namespace FractalServer
{
    public class ColorMapEntryForExport
    {
        [JsonProperty("cutOff")]
        public int CutOff;

        [JsonProperty("cssColor")]
        public string CssColor;

        private ColorMapEntryForExport()
        {
            CutOff = 0;
            CssColor = null;
        }

        public ColorMapEntryForExport(int cutOff, string cssColor)
        {
            CutOff = cutOff;
            CssColor = cssColor ?? throw new ArgumentNullException(nameof(cssColor));
        }
    }
}
