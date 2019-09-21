using FSTypes;
using System;
using System.Collections.Generic;
using System.Linq;

namespace FractalServer
{
	public class MapSectionWorkResult : IPartsBin
	{
		public int[] Counts { get; private set; }
		public DPoint[] ZValues { get; private set; }

		private readonly int _size;

		public MapSectionWorkResult(int[] counts, DPoint[] zValues) : this(counts, zValues, counts.Length)
		{
		}

		public MapSectionWorkResult(int size) : this(null, null, size)
		{
		}

		private MapSectionWorkResult(int[] counts, DPoint[] zValues, int size)
		{
			_size = size;

			Counts = counts;
			ZValues = zValues;

			PartDetails = new List<PartDetail>
			{
				new PartDetail(_size * 4, true, true),
				new PartDetail(_size * 16, true, false)
			};

			TotalBytesToWrite = (uint)(_size * 20);
		}

		public int PartCount => PartDetails.Count;

		public List<PartDetail> PartDetails { get; }

		public uint TotalBytesToWrite { get; }

		public byte[] GetPart(int partNumber)
		{
			if(partNumber == 0)
			{
				return GetBytesFromCounts(Counts);
			}
			else if(partNumber == 1)
			{
				return GetBytesFromZValues(ZValues);
			}
			else
			{
				throw new ArgumentException($"This Parts Bin only has two parts. Cannot get Part for PartNumber: {partNumber}.");
			}
		}

		public void SetPart(int partNumber, byte[] value)
		{
			if (partNumber == 0)
			{
				Counts = GetCounts(value, _size);
			}
			else if (partNumber == 1)
			{
				ZValues = GetZValues(value, _size);
			}
			else
			{
				throw new ArgumentException($"This Parts Bin only has two parts. Cannot set Part for PartNumber: {partNumber}.");
			}
		}

		private int[] GetCounts(byte[] buf, int size)
		{
			int[] result = new int[size * 4];
			for (int i = 0; i < size; i++)
			{
				result[i] = BitConverter.ToInt32(buf, i * 4);
			}

			return result;
		}

		private byte[] GetBytesFromCounts(int[] values)
		{
			byte[] tempBuf = values.SelectMany(value => BitConverter.GetBytes(value)).ToArray();
			return tempBuf;
		}

		private DPoint[] GetZValues(byte[] buf, int size)
		{
			DPoint[] result = new DPoint[size];

			for (int i = 0; i < size; i++)
			{
				int ptr = i * 16;
				double x = BitConverter.ToDouble(buf, ptr);
				double y = BitConverter.ToDouble(buf, ptr + 8);

				result[i] = new DPoint(x, y);
			}

			return result;
		}

		private byte[] GetBytesFromZValues(DPoint[] zValues)
		{
			byte[] tempBuf = zValues.SelectMany(value => GetBytesFromDPoint(value)).ToArray();
			return tempBuf;
		}

		private byte[] GetBytesFromDPoint(DPoint value)
		{
			byte[] dBufX = BitConverter.GetBytes(value.X);
			byte[] dBufY = BitConverter.GetBytes(value.Y);

			byte[] result = new byte[16];

			Array.Copy(dBufX, result, 8);
			Array.Copy(dBufY, 0, result, 8, 8);

			return result;
		}
	}
}
