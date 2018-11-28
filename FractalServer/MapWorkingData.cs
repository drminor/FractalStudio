﻿using System.Drawing;

namespace FractalServer
{
    public class MapWorkingData
    {
        public readonly Size CanvasSize;
        public readonly MapInfo MapInfo;
        public readonly ColorMap ColorMap;

        public readonly long ElementCount;

        private readonly double[] _xVals;
        private readonly double[] _yVals;
        //private readonly int[] _cnts;

        public MapWorkingData(Size canvasSize, MapInfo mapInfo, ColorMap colorMap)
        {
            CanvasSize = canvasSize;
            MapInfo = mapInfo;
            ColorMap = colorMap;

            ElementCount = GetNumberOfElementsForCanvas(CanvasSize);

            _xVals = BuildVals(CanvasSize.Width, MapInfo.Coords.Left, MapInfo.Coords.Right);
            _yVals = BuildValsRev(CanvasSize.Height, MapInfo.Coords.Bottom, MapInfo.Coords.Top);

            //_cnts = new int[ElementCount];
        }

        //public int[][] IterateAll()
        //{
        //    int[][] result = new int[]
        //    for(int yPtr = 0; yPtr < CanvasSize.Height; yPtr ++)
        //    {
        //        IterateLine(yPtr, this.MapInfo.MaxIterations);
        //    }

        //    return _cnts;
        //}

        public int[] GetPixelDataForLine(int lineNumber, int iterCount)
        {
            int[] result = new int[this.CanvasSize.Width];

            for (int xPtr = 0; xPtr < CanvasSize.Width; xPtr++)
            {
                Point mapCoordinate = new Point(xPtr, lineNumber);
                //int elementPtr = GetLinearIndex(mapCoordinate);
                int cnt = IterateElement(mapCoordinate, iterCount);

                result[xPtr] = ColorMap.GetColorNum(cnt);
            }

            return result;
        }

        public int[] IterateLine(int lineNumber, int iterCount)
        {
            int[] result = new int[this.CanvasSize.Width];

            for(int xPtr = 0; xPtr < CanvasSize.Width; xPtr++)
            {
                Point mapCoordinate = new Point(xPtr, lineNumber);
                //int elementPtr = GetLinearIndex(mapCoordinate);
                result[xPtr] = IterateElement(mapCoordinate, iterCount);
            }

            return result;
        }

        private int IterateElement(Point mapCoordinate, int iterCount)
        {
            DPoint z = new DPoint(0, 0);
            DPoint c = new DPoint(_xVals[mapCoordinate.X], _yVals[mapCoordinate.Y]);

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

        private long GetNumberOfElementsForCanvas(Size cs)
        {
            long result = cs.Width * cs.Height;
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

        private double[] BuildValsRev(int canvasExtent, double start, double end)
        {
            double mapExtent = end - start;
            double unitExtent = mapExtent / canvasExtent;

            double[] result = new double[canvasExtent];

            int ptr = 0;
            for (int i = canvasExtent - 1; i > -1; i--)
            {
                result[ptr++] = start + i * unitExtent;
            }

            return result;
        }

        private int GetLinearIndex(Point c)
        {
            int result = c.X + c.Y * this.CanvasSize.Width;
            return result;
        }

    }
}