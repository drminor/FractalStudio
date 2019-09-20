using FSTypes;
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

		private readonly MPointWork _mPointWork;

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
				double escapeVelocity = _mPointWork.Iterate(c, ref z, ref cnt);

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
