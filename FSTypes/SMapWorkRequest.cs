using System;
using System.Diagnostics;
using Newtonsoft.Json;

namespace FSTypes
{
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

		public bool RequiresQuadPrecision()
		{
			if (Coords.TryGetFromSCoords(SCoords, out Coords coords))
			{
				if (!HasPrecision(GetSamplePointDiff(coords.LeftBot.X, coords.RightTop.X, CanvasSize.Width))
					|| !HasPrecision(GetSamplePointDiff(coords.LeftBot.Y, coords.RightTop.Y, CanvasSize.Height)))
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
				Debug.WriteLine("Cannot parse the SCoords value.");
				return false;
			}
		}

		private double GetSamplePointDiff(double s, double e, int extent)
		{
			double unit = (e - s) / extent;
			double second = s + unit;
			double diff = second - s;
			return diff;
		}

		private bool HasPrecision(double x)
		{
			if (x == 0)
				return false;

			if (IsSubnormal(x))
				return false;

			return true;
		}

		const long ExponentMask = 0x7FF0000000000000;
		private bool IsSubnormal(double v)
		{
			long bithack = BitConverter.DoubleToInt64Bits(v);
			if (bithack == 0) return false;
			return (bithack & ExponentMask) == 0;
		}
	}

}
