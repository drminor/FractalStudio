using FSTypes;
using System;
using System.Collections.Generic;

namespace FractalServer
{
	public class MapCalculator
    {
		private const int CNT_MULTIPLIER = 10000;
		public MapCalculator()
		{
		}

		public MapSectionWorkResult GetWorkingValues(double[] XValues, double[] YValues, int maxIterations, MapSectionWorkResult currentValues)
		{
			int width = XValues.Length;
			int height = YValues.Length;

			CheckCurrentValues(width * height, currentValues);

			MPointWork mPointWork = new MPointWork(maxIterations);
			DPoint c = new DPoint(0, 0);
			int ptr = 0;
			for (int yPtr = 0; yPtr < height; yPtr++)
			{
				c.Y = YValues[yPtr];

				for (int xPtr = 0; xPtr < width; xPtr++)
				{
					//if(ptr == 7382)
					//{
					//	int a = 0;
					//}

					if (currentValues.DoneFlags[ptr])
					{
						ptr++;
						continue;
					}

					c.X = XValues[xPtr];
					DPoint z = currentValues.ZValues[ptr]; //DPoint z = new DPoint(0, 0);
					int cnt = currentValues.Counts[ptr]; //int cnt = 0; //
					cnt /= CNT_MULTIPLIER;

					double escapeVelocity = mPointWork.Iterate(c, z, ref cnt, out bool done);

					//if(!done)
					//{
					//	int b = 0;
					//}

					double cAndE = cnt + escapeVelocity;
					cAndE *= CNT_MULTIPLIER;
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

		public void ComputeApprox(double[] XValues, double[] YValues, int maxIterations, int[] curCounts)
		{
			for(int i = 0; i < curCounts.Length; i++)
			{
				curCounts[i] = 0;
			}

			int width = XValues.Length;
			int height = YValues.Length;

			for (int yPtr = 1; yPtr < height - 1; yPtr += 3)
			{
				for (int xPtr = 1; xPtr < width - 1; xPtr += 3)
				{
					ApCell cell = GetCell(xPtr, yPtr, XValues, YValues);
					int[] cnts = cell.Iterate3(maxIterations);

					UpdateCnts(xPtr, yPtr, cnts, curCounts, XValues.Length);
				}
			}
		}

		private void UpdateCnts(int x, int y, int[] newCnts, int[] curCounts, int width)
		{
			int lPtr = (y - 1) * width;

			for(int i = 0; i < 3; i++)
			{
				curCounts[lPtr + x + i - 1] = newCnts[i];
			}

			lPtr += width;
			for (int i = 0; i < 3; i++)
			{
				curCounts[lPtr + x + i - 1] = newCnts[3 + i];
			}

			lPtr += width;
			for (int i = 0; i < 3; i++)
			{
				curCounts[lPtr + x + i - 1] = newCnts[6 + i];
			}
		}

		private ApCell GetCell(int x, int y, double[] XValues, double[] YValues)
		{
			DPoint refC = new DPoint(XValues[x], YValues[y]);

			ApDetail[] details = new ApDetail[8];

			details[0] = new ApDetail(refC - new DPoint(XValues[x - 1], YValues[y - 1]));
			details[1] = new ApDetail(refC - new DPoint(XValues[x], YValues[y - 1]));
			details[2] = new ApDetail(refC - new DPoint(XValues[x + 1], YValues[y - 1]));

			details[3] = new ApDetail(refC - new DPoint(XValues[x - 1], YValues[y]));
			details[4] = new ApDetail(refC - new DPoint(XValues[x + 1], YValues[y]));

			details[5] = new ApDetail(refC - new DPoint(XValues[x - 1], YValues[y + 1]));
			details[6] = new ApDetail(refC - new DPoint(XValues[x], YValues[y + 1]));
			details[7] = new ApDetail(refC - new DPoint(XValues[x + 1], YValues[y + 1]));

			ApCell result = new ApCell(refC, details);

			return result;
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
					double escapeVelocity = mPointWork.Iterate(c, z, ref cntr, done: out bool notUsed);

					double cAndE = cntr + escapeVelocity;
					cAndE *= CNT_MULTIPLIER;
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
