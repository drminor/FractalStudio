using FSTypes;
using System;

namespace FractalServer
{
	public class MapSectionWorkRequest
	{
		public readonly MapSection MapSection;
		public readonly int MaxIterations;

		public readonly double[] XValues;
		public readonly double[] YValues;

		public MapSectionWorkRequest(MapSection mapSection, int maxIterations, double[] xValues, double[] yValues)
		{
			MaxIterations = maxIterations;
			MapSection = mapSection ?? throw new ArgumentNullException(nameof(mapSection));
			XValues = xValues; //?? throw new ArgumentNullException(nameof(xValues));
			YValues = yValues; //?? throw new ArgumentNullException(nameof(yValues));
		}
	}
}
