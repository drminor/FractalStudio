using System;
using MqMessages;
using Newtonsoft.Json;

namespace FSTypes
{
	public class SCoordsWorkRequest
	{
		[JsonProperty("transformType")]
		public TransformType TransformType;

		[JsonProperty("coords")]
		public SCoords SCoords;

		[JsonProperty("canvasSize")]
		public CanvasSize CanvasSize;

		[JsonProperty("mapSection")]
		public MapSection MapSection;

		[JsonProperty("jobId")]
		public int JobId;

		private SCoordsWorkRequest()
		{
			TransformType = TransformType.In;
			SCoords = null;
			CanvasSize = new CanvasSize(0, 0);
			MapSection = new MapSection(new Point(0, 0), new CanvasSize(0, 0));
			JobId = -1;
		}

		public SCoordsWorkRequest(TransformType transformType, SCoords sCoords, CanvasSize canvasSize, MapSection mapSection, int jobId)
		{
			TransformType = transformType;
			SCoords = sCoords ?? throw new ArgumentNullException(nameof(sCoords));
			CanvasSize = canvasSize ?? throw new ArgumentNullException(nameof(canvasSize));
			MapSection = mapSection ?? throw new ArgumentNullException(nameof(mapSection));
			JobId = jobId;
		}
	}

}
