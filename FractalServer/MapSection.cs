//using MessagePack;
using Newtonsoft.Json;

namespace FractalServer
{
	//[MessagePackObject]
	public class MapSection
	{
		[JsonProperty("sectionAnchor")]
		//[Key(0)]
		public Point SectionAnchor;

		[JsonProperty("canvasSize")]
		//[Key(1)]
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
