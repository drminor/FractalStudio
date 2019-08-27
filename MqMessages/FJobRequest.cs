using System;

namespace MqMessages
{
	[Serializable]
    public class FJobRequest
    {
		public int JobId { get; set; }
		public Coords Coords { get; set; }
		public RectangleInt Area { get; set; }
		public SizeInt SamplePoints { get; set; }
		public int MaxIterations { get; set; }

		public FJobRequest() { }

		public FJobRequest(int jobId, Coords coords, SizeInt samplePoints, int maxIterations)
			: this(jobId,
				  coords,
				  new RectangleInt(new PointInt(0, 0), new SizeInt(samplePoints.W, samplePoints.H)),
				  samplePoints,
				  maxIterations
				  ) { }


		public FJobRequest(int jobId, Coords coords, RectangleInt area, SizeInt samplePoints, int maxIterations)
		{
			JobId = jobId;
			Coords = coords;
			Area = area;
			SamplePoints = samplePoints;
			MaxIterations = maxIterations;
		}
	}
}
