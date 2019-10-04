using FSTypes;
using System;

namespace FractalServer
{
	public class MapSectionWorkRequest
	{
		public readonly MapSection MapSection;
		public readonly int MaxIterations;

		public readonly int HPtr;
		public readonly int VPtr;

		public MapSectionWorkRequest(MapSection mapSection, int maxIterations, int hPtr, int vPtr)
		{
			MaxIterations = maxIterations;
			MapSection = mapSection ?? throw new ArgumentNullException(nameof(mapSection));
			HPtr = hPtr;
			VPtr = vPtr;
		}
	}
}
