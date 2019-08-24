using Newtonsoft.Json;

namespace FractalServer
{
	public class MapSection
	{
		[JsonProperty("sectionAnchor")]
		public Point SectionAnchor;

		[JsonProperty("canvasSize")]
		public CanvasSize CanvasSize;

		private MapSection()
		{
			SectionAnchor = null;
			CanvasSize = null;
		}

		public MapSection(Point sectionAnchor, CanvasSize canvasSize)
		{
			SectionAnchor = sectionAnchor;
			CanvasSize = canvasSize;
		}


	}
}
