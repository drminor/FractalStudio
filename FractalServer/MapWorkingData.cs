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

            // Build the y values from top to bottom
            if(MapInfo.Coords.IsUpsideDown)
            {
                // The values are already reversed go from bot to top.
                _yVals = BuildVals(CanvasSize.Height, MapInfo.LeftBot.Y, MapInfo.RightTop.Y);
            }
            else
            {
                // Go from top to bot.
                _yVals = BuildVals(CanvasSize.Height, MapInfo.RightTop.Y, MapInfo.LeftBot.Y);
            }

            System.Diagnostics.Debug.WriteLine($"The aspect ratio (w/h) is {MapInfo.AspectRatio}.");
        }

        public void BuildPngImageLine(int lineNumber, int iterCount, ImageLine iLine)
        {

            DPoint c = new DPoint(0, _yVals[lineNumber]);

            for (int xPtr = 0; xPtr < CanvasSize.Width; xPtr++)
            {
                c.X = _xVals[xPtr];
                //int cnt = IterateElement(c, iterCount);

                int cnt = MPointWork.Iterate(c, iterCount);

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

        //public int[] IterateLine(int lineNumber, int iterCount)
        //{
        //    int[] result = new int[this.CanvasSize.Width];

        //    DPoint c = new DPoint(0, _yVals[lineNumber]);

        //    for (int xPtr = 0; xPtr < CanvasSize.Width; xPtr++)
        //    {
        //        c.X = _xVals[xPtr];

        //        MPointWork mpw = new MPointWork(c);
        //        int cnt = mpw.Iterate(iterCount);


        //        //result[xPtr] = IterateElement(c, iterCount);
        //        result[xPtr] = cnt;
        //    }

        //    return result;
        //}

        //private int IterateElement(DPoint c, int iterCount)
        //{
        //    DPoint z = new DPoint(0, 0);

        //    DPoint zNew = new DPoint(0, 0);

        //    int cntr;
        //    for(cntr = 0; cntr < iterCount; cntr++)
        //    {
        //        GetNextVal(z, c, ref zNew);
        //        if(zNew.SizeSquared > 4)
        //        {
        //            break;
        //        }

        //        // Set the next input to the value of this round's output.
        //        z.X = zNew.X;
        //        z.Y = zNew.Y;
        //    }

        //    return cntr;
        //}

        //private void GetNextVal(DPoint z, DPoint c, ref DPoint result)
        //{
        //    //double newX = z.X * z.X - z.Y * z.Y + c.X;
        //    //double newY = 2 * z.X * z.Y + c.Y;

        //    result.X = z.X * z.X - z.Y * z.Y + c.X;
        //    result.Y = 2 * z.X * z.Y + c.Y;

        //    //DPoint result = new DPoint
        //    //    (
        //    //    z.X * z.X - z.Y * z.Y + c.X,
        //    //    2 * z.X * z.Y + c.Y
        //    //    );
        //    //return result;
        //}

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
