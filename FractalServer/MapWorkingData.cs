using Hjg.Pngcs;
using System.Drawing;

namespace FractalServer
{
    public class MapWorkingData
    {
        public readonly Size CanvasSize;
        public readonly MapInfo MapInfo;
        public readonly ColorMap ColorMap;

        private readonly double[] _xVals;
        private readonly double[] _yVals;

        public MapWorkingData(Size canvasSize, MapInfo mapInfo, ColorMap colorMap)
        {
            CanvasSize = canvasSize;
            MapInfo = mapInfo;
            ColorMap = colorMap;

            _xVals = BuildVals(CanvasSize.Width, MapInfo.LeftBot.X, MapInfo.RightTop.X);
            _yVals = BuildVals(CanvasSize.Height, MapInfo.RightTop.Y, MapInfo.LeftBot.Y);

            System.Diagnostics.Debug.WriteLine($"The aspect ratio (w/h) is {MapInfo.AspectRatio}.");
        }

        public void BuildPngImageLine(int lineNumber, int iterCount, ImageLine iLine)
        {
            DPoint c = new DPoint(0, _yVals[lineNumber]);

            for (int xPtr = 0; xPtr < CanvasSize.Width; xPtr++)
            {
                c.X = _xVals[xPtr];
                int cnt = IterateElement(c, iterCount);

                ColorMapEntry cme;
                if (cnt == iterCount)
                {
                    cme = ColorMap.HighColorEntry;
                }
                else
                {
                    cme = ColorMap.GetColorMapEntry(cnt);
                }

                int[] cComps = cme.ColorComps;
                ImageLineHelper.SetPixel(iLine, xPtr, cComps[0], cComps[1], cComps[2]);
            }
        }

        public int[] IterateLine(int lineNumber, int iterCount)
        {
            int[] result = new int[this.CanvasSize.Width];

            DPoint c = new DPoint(0, _yVals[lineNumber]);

            for (int xPtr = 0; xPtr < CanvasSize.Width; xPtr++)
            {
                c.X = _xVals[xPtr];
                result[xPtr] = IterateElement(c, iterCount);
            }

            return result;
        }

        private int IterateElement(DPoint c, int iterCount)
        {
            DPoint z = new DPoint(0, 0);

            int cntr;
            for(cntr = 0; cntr < iterCount; cntr++)
            {
                z = GetNextVal(z, c);
                if(z.SizeSquared > 4)
                {
                    break;
                }
            }

            return cntr;
        }

        private DPoint GetNextVal(DPoint z, DPoint c)
        {
            //double newX = z.X * z.X - z.Y * z.Y + c.X;
            //double newY = 2 * z.X * z.Y + c.Y;

            DPoint result = new DPoint
                (
                z.X * z.X - z.Y * z.Y + c.X,
                2 * z.X * z.Y + c.Y
                );
            return result;
        }

        private double[] BuildVals(int canvasExtent, double start, double end)
        {
            double mapExtent = end - start;
            double unitExtent = mapExtent / canvasExtent;

            double[] result = new double[canvasExtent];

            for(int i = 0; i < canvasExtent; i++)
            {
                result[i] = start + i * unitExtent;
            }

            return result;
        }

        //private double[] BuildValsRev(int canvasExtent, double start, double end)
        //{
        //    double mapExtent = end - start;
        //    double unitExtent = mapExtent / canvasExtent;

        //    double[] result = new double[canvasExtent];

        //    int ptr = 0;
        //    for (int i = canvasExtent - 1; i > -1; i--)
        //    {
        //        result[ptr++] = start + i * unitExtent;
        //    }

        //    return result;
        //}

        //private int GetLinearIndex(Point c)
        //{
        //    int result = c.X + c.Y * this.CanvasSize.Width;
        //    return result;
        //}

    }
}
