using System;
using System.Linq;

namespace MqMessages
{
	[Serializable]
	public class FJobResult
	{
		public FJobResult() : this(new RectangleInt(), (string) null) {	}

		public FJobResult(RectangleInt area, string counts)
		{
			Area = area;
			Counts = counts;
		}

		public FJobResult(RectangleInt area, float[] values)
		{
			Area = area;
			SetCounts(values);
		}

		public RectangleInt Area { get; set; }

		public string Counts { get; set; }

		public void SetCounts(float[] values)
		{
			int len = Area.Size.W * Area.Size.H;
			if (values.Length != len)
			{
				throw new ArgumentException($"Values must have {len} elements.");
			}

			byte[] tempBuf = values.SelectMany(value => BitConverter.GetBytes(value)).ToArray();
			string result = Convert.ToBase64String(tempBuf);
			Counts = result;
		}

		public float[] GetValues()
		{
			int len = Area.Size.W * Area.Size.H;

			byte[] bytes = Convert.FromBase64String(Counts);
			if(bytes.Length / 4 != len)
			{
				throw new InvalidOperationException("Our Counts string has the wrong length.");
			}

			float[] result = new float[len];
			for (int i = 0; i < len; i++)
			{
				result[i] = BitConverter.ToSingle(bytes, i * 4);
			}

			return result;
		}
	}
}
