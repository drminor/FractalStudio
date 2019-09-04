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
		public FJobRequestType RequestType { get; set; }
		public TransformType? TransformType { get; set; }

		public FJobRequest() { }

		public FJobRequest(int jobId, Coords coords, SizeInt samplePoints, int maxIterations)
			: this(jobId,
				FJobRequestType.Generate,
				coords,
				samplePoints,
				new RectangleInt(new PointInt(0, 0), new SizeInt(samplePoints.W, samplePoints.H)),
				maxIterations
				  )
		{ }

		public static FJobRequest CreateDeleteRequest(int jobId)
		{
			return new FJobRequest(jobId, FJobRequestType.Delete, null, null, null, 0);
		}

		public FJobRequest(int jobId, FJobRequestType requestType, Coords coords, SizeInt samplePoints,
			RectangleInt area, int maxIterations, TransformType? transformType = null)
		{
			JobId = jobId;
			Coords = coords;
			SamplePoints = samplePoints;
			Area = area;
			MaxIterations = maxIterations;
			RequestType = requestType;
			TransformType = transformType;
		}
	}
}
