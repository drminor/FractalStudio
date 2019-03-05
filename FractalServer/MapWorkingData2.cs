using Hjg.Pngcs;
using System;
using System.Drawing;

namespace FractalServer
{
    public class MapWorkingData2
    {
        public readonly CanvasSize CanvasSize;
        public readonly int MaxIterations;

        private readonly double[] _xVals;
        private readonly double[] _yVals;

        public MapWorkingData2(CanvasSize canvasSize, int maxIterations, double[] xVals, double[] yVals)
        {
            CanvasSize = canvasSize;
            MaxIterations = maxIterations;

			_xVals = xVals;
			_yVals = yVals;
        }

		public int[] GetValues()
		{
			MPointWork mPointWork = new MPointWork(MaxIterations);
			int[] result = new int[CanvasSize.Width * CanvasSize.Height];
			int ptr = 0;

			for (int yPtr = 0; yPtr < CanvasSize.Height; yPtr++)
			{
				DPoint c = new DPoint(0, _yVals[yPtr]);

				for (int xPtr = 0; xPtr < CanvasSize.Width; xPtr++)
				{
					c.X = _xVals[xPtr];

					int cnt = mPointWork.Iterate(c, out double escapeVelocity);

					cnt *= 10000;
					escapeVelocity = Math.Truncate(escapeVelocity * 10000);

					result[ptr++] = (int) (cnt + escapeVelocity);
				}
			}
			return result;
		}

    }
}
