using System;
using FSTypes;
using Newtonsoft.Json;

namespace FractalServer
{
	public class MapWorkRequest
	{
        [JsonProperty("coords")]
        public Coords Coords;

		[JsonProperty("maxIterations")]
		public int MaxIterations;

		[JsonProperty("canvasSize")]
		public CanvasSize CanvasSize;

        [JsonProperty("connectionId")]
        public string ConnectionId;

		[JsonProperty("jobId")]
		public int JobId;

		private MapWorkRequest()
        {
			Coords = null;
			CanvasSize = new CanvasSize(0, 0);
			ConnectionId = null;
			JobId = -1;
        }

		public MapWorkRequest(Coords coords, int maxIterations, CanvasSize canvasSize, string connectionId)
		{
			Coords = coords ?? throw new ArgumentNullException(nameof(coords));
			MaxIterations = maxIterations;
			CanvasSize = canvasSize ?? throw new ArgumentNullException(nameof(canvasSize));
			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
		}
	}

}
