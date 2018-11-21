namespace FractalServer
{
    public class ColorMap
    {
        private readonly int[] _cutOffs;
        private readonly int[] _colorNums;

        //public readonly ColorMapEntry[] ColorMapEntries;
        public int HighColor;

        public ColorMap(ColorMapEntry[] colorMapEntries, int highColor)
        {
            _cutOffs = new int[colorMapEntries.Length];
            _colorNums = new int[colorMapEntries.Length];

            for(int ptr = 0; ptr < colorMapEntries.Length; ptr++)
            {
                _cutOffs[ptr] = colorMapEntries[ptr].CutOff;
                _colorNums[ptr] = colorMapEntries[ptr].ColorNum;
            }

            HighColor = highColor;
        }

        public int GetColorNum(int countVal)
        {
            int result = 0;
            int newIndex = System.Array.BinarySearch(_cutOffs, countVal);
            if(newIndex > _cutOffs.Length - 1)
            {
                result = HighColor;
            }
            else if(newIndex < 0)
            {
                result = _colorNums[0];
            }
            else
            {
                result = _colorNums[newIndex];
            }

            return result;
        }
    }
}
