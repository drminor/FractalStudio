using System;

namespace FractalServer
{
	public class MapSectionWorkRequest<T> where T: struct
	{
		public readonly MapSection MapSection;
		public readonly int MaxIterations;

		public readonly T[] XValues;
		public readonly T[] YValues;

		public MapSectionWorkRequest(MapSection mapSection, int maxIterations, T[] xValues, T[] yValues)
		{
			MaxIterations = maxIterations;
			MapSection = mapSection ?? throw new ArgumentNullException(nameof(mapSection));
			XValues = xValues ?? throw new ArgumentNullException(nameof(xValues));
			YValues = yValues ?? throw new ArgumentNullException(nameof(yValues));
		}
	}
}
