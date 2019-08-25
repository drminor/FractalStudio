using System;

namespace MqMessages
{
	[Serializable]
    public class FJobRequest
    {
		public string Name { get; set; }
		public Coords Coords { get; set; }
		public RectangleInt Area { get; set; }
		public SizeInt SamplePoints { get; set; }
		public int MaxIterations { get; set; }

		public FJobRequest() { }

		public FJobRequest(string name, Coords coords, SizeInt samplePoints, int maxIterations)
			: this(name,
				  coords,
				  new RectangleInt(new PointInt(0, 0), new SizeInt(samplePoints.W, samplePoints.H)),
				  samplePoints,
				  maxIterations
				  ) { }


		public FJobRequest(string name, Coords coords, RectangleInt area, SizeInt samplePoints, int maxIterations)
		{
			Name = name ?? throw new ArgumentNullException(nameof(name));


			Coords = coords;
			Area = area;
			SamplePoints = samplePoints;
			MaxIterations = maxIterations;
		}
	}
}
