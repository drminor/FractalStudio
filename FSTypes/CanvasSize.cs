using MqMessages;
using Newtonsoft.Json;

namespace FSTypes
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

		public SizeInt GetSizeInt()
		{
			return new SizeInt(Width, Height);
		}

    }
}
