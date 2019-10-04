using FSTypes;
using System;

namespace FractalServer
{
	public class MapCalculator
    {
		public MapCalculator()
		{
		}

		public MapSectionWorkResult GetWorkingValues(double[] XValues, double[] YValues, int maxIterations, MapSectionWorkResult currentValues)
		{
			int width = XValues.Length;
			int height = YValues.Length;

			CheckCurrentValues(width * height, currentValues);

			MPointWork mPointWork = new MPointWork(maxIterations);
			int ptr = 0;
			for (int yPtr = 0; yPtr < height; yPtr++)
			{
				DPoint c = new DPoint(0, YValues[yPtr]);

				for (int xPtr = 0; xPtr < width; xPtr++)
				{
					if (currentValues.DoneFlags[ptr]) continue;

					DPoint z = currentValues.ZValues[ptr];
					int cnt = currentValues.Counts[ptr];
					cnt /= 10000;

					c.X = XValues[xPtr];

					double escapeVelocity = mPointWork.Iterate(c, ref z, ref cnt, out bool done);

					double cAndE = cnt + escapeVelocity;
					cAndE *= 10000;
					cAndE = Math.Truncate(cAndE);

					currentValues.Counts[ptr] = (int)(cAndE);
					currentValues.ZValues[ptr] = z;
					currentValues.DoneFlags[ptr] = done;
					ptr++;
				}
			}

			currentValues.IterationCount = maxIterations;
			return currentValues;
		}

		public int[] GetValues(double[] XValues, double[] YValues, int maxIterations)
		{
			int cntr = 0;
			DPoint z = new DPoint(0, 0);

			int width = XValues.Length;
			int height = YValues.Length;

			int[] result = new int[width * height];

			MPointWork mPointWork = new MPointWork(maxIterations);
			int ptr = 0;
			for (int yPtr = 0; yPtr < height; yPtr++)
			{
				DPoint c = new DPoint(0, YValues[yPtr]);

				for (int xPtr = 0; xPtr < width; xPtr++)
				{
					c.X = XValues[xPtr];

					// Reset the input values for each map point.
					z.X = 0; z.Y = 0; cntr = 0;
					double escapeVelocity = mPointWork.Iterate(c, ref z, ref cntr, done: out bool notUsed);

					double cAndE = cntr + escapeVelocity;
					cAndE *= 10000;
					cAndE = Math.Truncate(cAndE);
					result[ptr++] = (int) (cAndE);
				}
			}

			return result;
		}

		private void CheckCurrentValues(int totalSampleCount, MapSectionWorkResult currentValues)
		{
			if (currentValues.Counts.Length != totalSampleCount)
			{
				throw new ArgumentException("The current values must have a Counts array of length matching the size of the work request.");
			}

			if (currentValues.ZValues.Length != totalSampleCount)
			{
				throw new ArgumentException("The current values must have a ZValues array of length matching the size of the work request.");
			}
		}

	}
}
