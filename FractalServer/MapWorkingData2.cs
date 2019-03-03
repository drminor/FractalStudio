using Hjg.Pngcs;
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

		public double[] GetValues()
		{
			double[] result = new double[CanvasSize.Width * CanvasSize.Height];
			int ptr = 0;

			for (int yPtr = 0; yPtr < CanvasSize.Height - 1; yPtr++)
			{
				DPoint c = new DPoint(0, _yVals[yPtr]);

				for (int xPtr = 0; xPtr < CanvasSize.Width - 1; xPtr++)
				{
					c.X = _xVals[xPtr];

					int cnt = MPointWork.Iterate(c, MaxIterations, out double escapeVelocity);
					result[ptr++] = cnt + escapeVelocity;
				}
			}
			return result;
		}

    }
}
