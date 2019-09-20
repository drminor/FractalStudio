using System;
using System.Linq;

namespace MqMessages
{
	[Serializable]
	public class FJobResult
	{
		public int JobId { get; set; }
		public RectangleInt Area { get; set; }
		public string Counts { get; set; }

		public FJobResult() : this(-1, new RectangleInt(), (string) null) {	}

		public FJobResult(int jobId, RectangleInt area, string counts)
		{
			JobId = jobId;
			Area = area;
			Counts = counts;
		}

		public FJobResult(int jobId, RectangleInt area, float[] values)
		{
			JobId = jobId;
			Area = area;
			SetCountsF(values);
		}

		public FJobResult(int jobId, RectangleInt area, int[] values)
		{
			JobId = jobId;
			Area = area;
			SetCounts(values);
		}

		public void SetCountsF(float[] values)
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

		public float[] GetValuesF()
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

		public void SetCounts(int[] values)
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

		public int[] GetValues()
		{
			int len = Area.Size.W * Area.Size.H;

			byte[] bytes = Convert.FromBase64String(Counts);
			if (bytes.Length / 4 != len)
			{
				throw new InvalidOperationException("Our Counts string has the wrong length.");
			}

			int[] result = new int[len];
			for (int i = 0; i < len; i++)
			{
				result[i] = BitConverter.ToInt32(bytes, i * 4);
			}

			return result;
		}
	}
}
