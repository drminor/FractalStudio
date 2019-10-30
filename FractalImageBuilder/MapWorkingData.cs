using FractalServer;
using FSTypes;
using Hjg.Pngcs;
using System;

namespace FractalImageBuilder
{
    public class MapWorkingData
    {
        public readonly CanvasSize CanvasSize;
        public readonly MapInfo MapInfo;
        public readonly ColorMap ColorMap;

        private readonly double[] _xVals;
        private readonly double[] _yVals;

		private readonly MPointWork _mPointWork;

		public MapWorkingData(CanvasSize canvasSize, MapInfo mapInfo, ColorMap colorMap)
        {
            CanvasSize = canvasSize;
            MapInfo = mapInfo;
            ColorMap = colorMap;

			if (mapInfo == null) return;

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

			_mPointWork = new MPointWork(mapInfo.MaxIterations);


			System.Diagnostics.Debug.WriteLine($"The aspect ratio (w/h) is {MapInfo.AspectRatio}.");
        }

        public void BuildPngImageLine(int lineNumber, ImageLine iLine)
        {
			DPoint c = new DPoint(0, _yVals[lineNumber]);

            for (int xPtr = 0; xPtr < CanvasSize.Width; xPtr++)
            {
                c.X = _xVals[xPtr];

				DPoint z = new DPoint(0, 0);
				int cnt = 0;
				double escapeVelocity = _mPointWork.Iterate(c, ref z, ref cnt, done: out bool notUsed);

				int[] cComps;
                if (cnt == MapInfo.MaxIterations)
                {
                    cComps = ColorMap.HighColorEntry.StartColor.ColorComps;
                }
                else
                {
                    cComps = ColorMap.GetColor(cnt, escapeVelocity);
                }

                ImageLineHelper.SetPixel(iLine, xPtr, cComps[0], cComps[1], cComps[2]);
            }
        }

		public static void BuildPngImageLineSegment(int pixPtr, int[] counts, ImageLine iLine, int maxIterations, ColorMap colorMap)
		{
			for (int xPtr = 0; xPtr < counts.Length; xPtr++)
			{
				double escapeVelocity = GetEscVel(counts[xPtr], out int cnt);

				int[] cComps;
				if (cnt == maxIterations)
				{
					cComps = colorMap.HighColorEntry.StartColor.ColorComps;
				}
				else
				{
					cComps = colorMap.GetColor(cnt, escapeVelocity);
				}

				ImageLineHelper.SetPixel(iLine, pixPtr++, cComps[0], cComps[1], cComps[2]);
			}
		}

		public static void BuildBlankPngImageLineSegment(int pixPtr, int len, ImageLine iLine)
		{
			for (int xPtr = 0; xPtr < len; xPtr++)
			{
				ImageLineHelper.SetPixel(iLine, pixPtr++, 255, 255, 255);
			}
		}

		private static double GetEscVel(int rawCount, out int count)
		{
			double result = rawCount / 10000d;
			count = (int)Math.Truncate(result);
			result -= count;
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

    }
}
