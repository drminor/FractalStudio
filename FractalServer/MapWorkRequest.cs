using System;
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

	public class SMapWorkRequest
	{
		[JsonProperty("coords")]
		public SCoords SCoords;

		[JsonProperty("maxIterations")]
		public int MaxIterations;

		[JsonProperty("canvasSize")]
		public CanvasSize CanvasSize;

		[JsonProperty("connectionId")]
		public string ConnectionId;

		[JsonProperty("jobId")]
		public int JobId;

		private SMapWorkRequest()
		{
			SCoords = null;
			CanvasSize = new CanvasSize(0, 0);
			ConnectionId = null;
			JobId = -1;
		}

		public SMapWorkRequest(SCoords sCoords, int maxIterations, CanvasSize canvasSize, string connectionId)
		{
			SCoords = sCoords ?? throw new ArgumentNullException(nameof(sCoords));
			MaxIterations = maxIterations;
			CanvasSize = canvasSize ?? throw new ArgumentNullException(nameof(canvasSize));
			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
		}

		public bool RequiresDoublePrecision()
		{
			if (Coords.TryGetFromSCoords(SCoords, out Coords coords))
			{
				if (!HasPrecision(coords.Width) || !HasPrecision(coords.Height))
				{
					return true;
				}
				else
				{
					return false;
				}
			}
			else
			{
				// Cannot parse the values -- invalid string values.
				return false;
			}
		}

		private bool HasPrecision(double x)
		{
			if (x == 0) return false;

			double temp = x / 1000;
			if (x != temp * 1000)
			{
				return false;
			}

			return true;
		}
	}

}
