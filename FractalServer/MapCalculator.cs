using FSTypes;
using System;

namespace FractalServer
{
	public class MapCalculator
    {
		private readonly int _maxIterations;
		private readonly MPointWork _mPointWork;

		public MapCalculator(int maxIterations)
		{
			_maxIterations = maxIterations;
			_mPointWork = new MPointWork(_maxIterations);
		}

		public MapSectionWorkResult GetWorkingValues(MapSectionWorkRequest mswr, MapSectionWorkResult currentValues)
		{
			CheckMaxIterations(mswr, _maxIterations);
			CheckCurrentValues(mswr, currentValues);

			//MPointWork mPointWork = new MPointWork(mswr.MaxIterations);

			int width = mswr.MapSection.CanvasSize.Width;
			int height = mswr.MapSection.CanvasSize.Height;

			int ptr = 0;
			for (int yPtr = 0; yPtr < height; yPtr++)
			{
				DPoint c = new DPoint(0, mswr.YValues[yPtr]);

				for (int xPtr = 0; xPtr < width; xPtr++)
				{
					if (currentValues.DoneFlags[ptr]) continue;

					DPoint z = currentValues.ZValues[ptr];
					int cnt = currentValues.Counts[ptr];
					cnt /= 10000;

					c.X = mswr.XValues[xPtr];

					double escapeVelocity = _mPointWork.Iterate(c, ref z, ref cnt, out bool done);

					double cAndE = cnt + escapeVelocity;
					cAndE *= 10000;
					cAndE = Math.Truncate(cAndE);

					currentValues.Counts[ptr] = (int)(cAndE);
					currentValues.ZValues[ptr] = z;
					currentValues.DoneFlags[ptr] = done;
					ptr++;
				}
			}

			return currentValues;
		}

		public int[] GetValues(MapSectionWorkRequest mswr)
		{
			CheckMaxIterations(mswr, _maxIterations);

			int cntr = 0;
			DPoint z = new DPoint(0, 0);

			//MPointWork mPointWork = new MPointWork(mswr.MaxIterations);

			int width = mswr.MapSection.CanvasSize.Width;
			int height = mswr.MapSection.CanvasSize.Height;
			int[] result = new int[width * height];

			int ptr = 0;
			for (int yPtr = 0; yPtr < height; yPtr++)
			{
				DPoint c = new DPoint(0, mswr.YValues[yPtr]);

				for (int xPtr = 0; xPtr < width; xPtr++)
				{
					c.X = mswr.XValues[xPtr];
					// Reset the input values for each map point.
					z.X = 0; z.Y = 0; cntr = 0;
					double escapeVelocity = _mPointWork.Iterate(c, ref z, ref cntr, done: out bool notUsed);

					double cAndE = cntr + escapeVelocity;
					cAndE *= 10000;
					cAndE = Math.Truncate(cAndE);
					result[ptr++] = (int) (cAndE);
				}
			}

			return result;
		}

		private void CheckCurrentValues(MapSectionWorkRequest mswr, MapSectionWorkResult currentValues)
		{
			int width = mswr.MapSection.CanvasSize.Width;
			int height = mswr.MapSection.CanvasSize.Height;

			if(currentValues.Counts.Length != width * height)
			{
				throw new ArgumentException("The current values must have a Counts array of length matching the size of the work request.");
			}

			if (currentValues.ZValues.Length != width * height)
			{
				throw new ArgumentException("The current values must have a ZValues array of length matching the size of the work request.");
			}
		}

		private void CheckMaxIterations(MapSectionWorkRequest mswr, int maxIterations)
		{
			if(mswr.MaxIterations != maxIterations)
			{
				throw new ArgumentException("The Map Section Work Request has a different value for MaxIterations.");
			}
		}

	}
}
