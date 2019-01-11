namespace FractalServer
{
    public class ColorMap
    {
        public readonly int[] _cutOffs;
        public readonly ColorMapEntry[] _colorMapEntries;
        public readonly ColorMapEntry HighColorEntry;

        public ColorMap(ColorMapEntry[] colorMapEntries, string highColor)
        {
            _colorMapEntries = colorMapEntries;
            _cutOffs = new int[colorMapEntries.Length];

            for(int ptr = 0; ptr < colorMapEntries.Length; ptr++)
            {
                _cutOffs[ptr] = colorMapEntries[ptr].CutOff;
            }

            HighColorEntry = new ColorMapEntry(-1, highColor, ColorMapBlendStyle.None, highColor);
        }

        public ColorMapEntry GetColorMapEntry(int countVal)
        {
            ColorMapEntry result;
            int newIndex = System.Array.BinarySearch(_cutOffs, countVal);

            if(newIndex < 0)
            {
                newIndex = ~newIndex;
            }

            if (newIndex > _cutOffs.Length - 1)
            {
                result = HighColorEntry;
            }
            else
            {
                result = _colorMapEntries[newIndex];
            }

            return result;
        }

        public static ColorMap GetFromColorMapForExport(ColorMapForExport cmfe)
        {
            ColorMap result;
            if (cmfe.Version == 1 || cmfe.Version == -1)
            {
                result = GetFromColorMapForExportV1(cmfe);
            }
            else
            {
                result = GetFromColorMapForExportV2(cmfe);
            }

            return result;
        }

        private static ColorMap GetFromColorMapForExportV1(ColorMapForExport cmfe)
        {
            ColorMapEntry[] newRanges = new ColorMapEntry[cmfe.Ranges.Length];

            for (int ptr = 0; ptr < cmfe.Ranges.Length; ptr++)
            {
                ColorMapEntryForExport sourceCme = cmfe.Ranges[ptr];

                newRanges[ptr] = new ColorMapEntry(sourceCme.CutOff, sourceCme.CssColor);
            }

            ColorMap result = new ColorMap(newRanges, cmfe.HighColorCss);

            return result;
        }

        private static ColorMap GetFromColorMapForExportV2(ColorMapForExport cmfe)
        {
            ColorMapEntry[] newRanges = new ColorMapEntry[cmfe.Ranges.Length];

            for (int ptr = 0; ptr < cmfe.Ranges.Length; ptr++)
            {
                ColorMapEntryForExport sourceCme = cmfe.Ranges[ptr];

                newRanges[ptr] = new ColorMapEntry(sourceCme.CutOff, sourceCme.StartCssColor, sourceCme.BlendStyle, sourceCme.EndCssColor);
            }

            ColorMap result = new ColorMap(newRanges, cmfe.HighColorCss);

            return result;
        }
    }
}
