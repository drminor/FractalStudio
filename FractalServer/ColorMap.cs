namespace FractalServer
{
    public class ColorMap
    {
        public  readonly int[] _cutOffs;
        //private readonly int[] _colorNums;
        public readonly ColorMapEntry[] _colorMapEntries;

        public readonly ColorMapEntry HighColorEntry;

        //public int HighColor;

        public ColorMap(ColorMapEntry[] colorMapEntries, string highColor)
        {
            _colorMapEntries = colorMapEntries;
            _cutOffs = new int[colorMapEntries.Length];
            //_colorNums = new int[colorMapEntries.Length];

            for(int ptr = 0; ptr < colorMapEntries.Length; ptr++)
            {
                _cutOffs[ptr] = colorMapEntries[ptr].CutOff;
                //_colorNums[ptr] = colorMapEntries[ptr].ColorNum;
            }

            //HighColor = ColorMapEntry.GetColorNumFromCss(highColor);
            HighColorEntry = new ColorMapEntry(-1, highColor);
        }

        //public int GetColorNum(int countVal)
        //{
        //    int result = 0;
        //    int newIndex = System.Array.BinarySearch(_cutOffs, countVal);
        //    if(newIndex > _cutOffs.Length - 1)
        //    {
        //        result = HighColor;
        //    }
        //    else if(newIndex < 0)
        //    {
        //        result = _colorNums[0];
        //    }
        //    else
        //    {
        //        result = _colorNums[newIndex];
        //    }

        //    return result;
        //}

        public ColorMapEntry GetColorMapEntry(int countVal)
        {
            ColorMapEntry result;
            int newIndex = System.Array.BinarySearch(_cutOffs, countVal);

            if(newIndex < 0)
            {
                newIndex = ~newIndex;
            }
            //else //if(newIndex > 0)
            //{
            //    newIndex++;
            //}

            if (newIndex > _cutOffs.Length - 1)
            {
                result = HighColorEntry;
            }
            //else if(newIndex < 0)
            //{
            //    result = _colorMapEntries[0];
            //}
            else
            {
                result = _colorMapEntries[newIndex];
            }

            //if(newIndex < 0)
            //{
            //    // The countVal would be inserted just before ~newIndex
            //    newIndex = -1 + ~newIndex;
            //    if(newIndex >= _cutOffs.Length - 1)
            //    {
            //        result = HighColorEntry;
            //    }
            //    else if(newIndex < 0)
            //    {
            //        result = _colorMapEntries[0];
            //    }
            //    else
            //    {
            //        result = _colorMapEntries[newIndex];
            //    }
            //}
            //else
            //{
            //    // Got an exact hit at index: newIndex
            //    result = _colorMapEntries[newIndex];
            //}

            //if (newIndex > _cutOffs.Length - 1)
            //{
            //    result = HighColorEntry;
            //}
            //else if (newIndex < 0)
            //{
            //    result = _colorMapEntries[0];
            //}
            //else
            //{
            //    result = _colorMapEntries[newIndex];
            //}

            return result;
        }
    }
}
