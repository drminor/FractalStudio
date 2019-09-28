using MqMessages;
using Newtonsoft.Json;
using System;

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

		public CanvasSize GetWholeUnits(int blockSize)
		{
			CanvasSize result = new CanvasSize()
			{
				Width = (int) Math.Ceiling(Width / (double)blockSize),
				Height = (int) Math.Ceiling(Height / (double)blockSize)
			};
			return result;
		}

    }
}
