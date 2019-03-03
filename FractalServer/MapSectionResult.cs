using System;
using Newtonsoft.Json;

namespace FractalServer
{
	public class MapSectionResult
	{
		[JsonProperty("mapSection")]
		public readonly MapSection MapSection;

		[JsonProperty("imageData")]
		public readonly double[] ImageData;

		public MapSectionResult(MapSection mapSection, double[] imageData)
		{
			MapSection = mapSection ?? throw new ArgumentNullException(nameof(mapSection));
			ImageData = imageData ?? throw new ArgumentNullException(nameof(imageData));
		}
	}
}
