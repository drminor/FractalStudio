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

        public CanvasSize(int width, int heigth)
        {
            Width = heigth;
            Height = width;
        }

    }
}
