using Newtonsoft.Json;

namespace FractalServer
{

	public class CanvasSize
	{
        [JsonProperty("width")]
        public int Width;

        [JsonProperty("height")]
        public int Height;

        private CanvasSize()
        {
            Width = 0;
            Height = 0;
        }

        public CanvasSize(int width, int height)
        {
            Width = width;
            Height = height;
        }

    }
}
