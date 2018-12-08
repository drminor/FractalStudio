namespace FractalServer
{
    public class ColorMapEntry
    {
        public readonly int CutOff;
        //public readonly double TargetPercentage;
        public readonly int ColorNum;
        public readonly int[] ColorComps;

        public ColorMapEntry(int cutOff, string cssColor)
        {
            CutOff = cutOff;
            //TargetPercentage = 0;
            ColorComps = GetColorComps(cssColor);
            ColorNum = GetColorNum(ColorComps);
            //ColorNum = GetColorNumFromCss(cssColor);
        }

        private int[] GetColorComps(string cssColor)
        {
            int[] result = new int[3];

            result[0] = int.Parse(cssColor.Substring(1, 2), System.Globalization.NumberStyles.HexNumber);
            result[1] = int.Parse(cssColor.Substring(3, 2), System.Globalization.NumberStyles.HexNumber);
            result[2] = int.Parse(cssColor.Substring(5, 2), System.Globalization.NumberStyles.HexNumber);

            return result;
        }

        private int GetColorNum(int[] cComps)
        {
            int result = 255 << 24;
            result |= cComps[2] << 16;
            result |= cComps[1] << 8;
            result |= cComps[0];

            return result;
        }

        public static int GetColorNumFromCss(string cssColor)
        {
            int r = int.Parse(cssColor.Substring(1, 2), System.Globalization.NumberStyles.HexNumber);
            int g = int.Parse(cssColor.Substring(3, 2), System.Globalization.NumberStyles.HexNumber);
            int b = int.Parse(cssColor.Substring(5, 2), System.Globalization.NumberStyles.HexNumber);
            int a = 255;

            int result = a << 24;
            result |= b << 16;
            result |= g << 8;
            result |= r;

            return result;
        }

    }
}
