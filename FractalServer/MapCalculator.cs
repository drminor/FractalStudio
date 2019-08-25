using System;

namespace FractalServer
{
	public class MapCalculator
    {
		public int[] GetValues(MapSectionWorkRequest mswr)
		{
			int width = mswr.MapSection.CanvasSize.Width;
			int height = mswr.MapSection.CanvasSize.Height;

			MPointWork mPointWork = new MPointWork(mswr.MaxIterations);
			int[] result = new int[width * height];
			int ptr = 0;

			for (int yPtr = 0; yPtr < height; yPtr++)
			{
				DPoint c = new DPoint(0, mswr.YValues[yPtr]);

				for (int xPtr = 0; xPtr < width; xPtr++)
				{
					c.X = mswr.XValues[xPtr];

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
