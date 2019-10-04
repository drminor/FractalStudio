using System;
using Newtonsoft.Json;

namespace FractalImageBuilder
{
    public class ColorMapEntryForExport
    {
        [JsonProperty("cutOff")]
        public int CutOff;

        [JsonProperty("cssColor")]
        public string CssColor;

        [JsonProperty("startCssColor")]
        public string StartCssColor;

        [JsonProperty("blendStyle")]
        public ColorMapBlendStyle BlendStyle;

        [JsonProperty("endCssColor")]
        public string EndCssColor;

        private ColorMapEntryForExport()
        {
            CutOff = 0;
            CssColor = null;
            StartCssColor = null;
            BlendStyle = ColorMapBlendStyle.None;
            EndCssColor = null;
        }

        public ColorMapEntryForExport(int cutOff, string cssColor)
        {
            CutOff = cutOff;
            StartCssColor = cssColor ?? throw new ArgumentNullException(nameof(cssColor));
            BlendStyle = ColorMapBlendStyle.None;
            EndCssColor = cssColor;
        }

        public ColorMapEntryForExport(int cutOff, string startCssColor, ColorMapBlendStyle blendStyle, string endCssColor)
        {
            CutOff = cutOff;
            StartCssColor = startCssColor ?? throw new ArgumentNullException(nameof(startCssColor));
            BlendStyle = blendStyle;
            EndCssColor = endCssColor ?? throw new ArgumentNullException(nameof(endCssColor));
        }

    }
}
