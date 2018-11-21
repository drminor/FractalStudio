namespace FractalServer
{
    public class ColorMapEntry
    {
        public readonly int CutOff;
        public readonly int ColorNum;

        public ColorMapEntry(int cutOff, int colorNum)
        {
            this.CutOff = cutOff;
            this.ColorNum = colorNum;
        }
    }
}
