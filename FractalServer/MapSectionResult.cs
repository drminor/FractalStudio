using System;
//using MessagePack;
using Newtonsoft.Json;

namespace FractalServer
{

	//[MessagePackObject]
	public class MapSectionResult
	{
		[JsonProperty("jobId")]
		//[Key(0)]
		public readonly int JobId;

		[JsonProperty("mapSection")]
		//[Key(0)]
		public readonly MapSection MapSection;

		[JsonProperty("imageData")]
		//[Key(1)]
		public readonly int[] ImageData;

		public MapSectionResult(int jobId, MapSection mapSection, int[] imageData)
		{
			JobId = jobId;
			MapSection = mapSection ?? throw new ArgumentNullException(nameof(mapSection));
			ImageData = imageData ?? throw new ArgumentNullException(nameof(imageData));
		}
	}
}
