using MqMessages;
using Newtonsoft.Json;

namespace FSTypes
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

		public MapSection(RectangleInt rectangleInt)
		{
			SectionAnchor = new Point(rectangleInt.Point.X, rectangleInt.Point.Y);
			CanvasSize = new CanvasSize(rectangleInt.Size.W, rectangleInt.Size.H);
		}


	}
}
