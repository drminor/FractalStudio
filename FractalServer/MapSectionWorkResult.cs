using FSTypes;
using System;
using System.Collections.Generic;
using System.Linq;

namespace FractalServer
{
	public class MapSectionWorkResult : IPartsBin
	{
		public int[] Counts { get; private set; }
		public bool[] DoneFlags { get; private set; }
		public DPoint[] ZValues { get; private set; }
		public int IterationCount { get; set; }

		private readonly int _size;

		public MapSectionWorkResult(int[] counts) : this(counts, 0, null, null, counts.Length, false, false)
		{
		}

		public MapSectionWorkResult(int[] counts, int iterationCount, DPoint[] zValues, bool[] doneFlags) : this(counts, iterationCount, zValues, doneFlags, counts.Length, true, true)
		{
		}

		public MapSectionWorkResult(int size, bool haveZValues, bool includeZValuesOnRead) : this(null, 0, null, null, size, haveZValues, includeZValuesOnRead)
		{
		}

		private MapSectionWorkResult(int[] counts, int iterationCount, DPoint[] zValues, bool[] doneFlags, int size, bool haveZValues, bool includeZValuesOnRead)
		{
			_size = size;

			Counts = counts;
			DoneFlags = doneFlags;
			IterationCount = iterationCount;
			ZValues = zValues;

			PartDetails = BuildPartDetails(_size, haveZValues, includeZValuesOnRead, out uint totalBytes);
			TotalBytesToWrite = totalBytes;
		}

		private List<PartDetail> BuildPartDetails(int size, bool haveZValues, bool includeZValuesOnRead, out uint totalBytesToWrite)
		{
			List<PartDetail> partDetails;

			if(haveZValues)
			{
				partDetails = new List<PartDetail>
				{
					new PartDetail(size * 4, true), // Counts
					new PartDetail(4, true), // IterationCount
					new PartDetail(size * 16, includeZValuesOnRead), // ZValues
					new PartDetail(size, includeZValuesOnRead) // DoneFlags
				};

				totalBytesToWrite = 4 + (uint) size * 21;
			}
			else
			{
				partDetails = new List<PartDetail>
				{
					new PartDetail(size * 4, true),
				};

				totalBytesToWrite = (uint)size * 4;
			}

			return partDetails;
		}

		//public bool IncludeZValuesOnRead
		//{
		//	get
		//	{
		//		return PartDetails[1].IncludeOnRead;
		//	}
		//	set
		//	{
		//		PartDetail curValue = PartDetails[1];
		//		if(value != curValue.IncludeOnRead)
		//		{
		//			PartDetails[1] = new PartDetail(curValue.PartLength, value);
		//		}
		//	}
		//}

		public int PartCount => PartDetails.Count;

		public List<PartDetail> PartDetails { get; }

		public uint TotalBytesToWrite { get; }

		public byte[] GetPart(int partNumber)
		{
			if(partNumber > PartCount - 1)
			{
				throw new ArgumentException($"This Parts Bin only has {PartCount} parts. Cannot get Part for PartNumber: {partNumber}.");
			}
			switch (partNumber)
			{
				case 0:
					return GetBytesFromCounts(Counts);
				case 1:
					return BitConverter.GetBytes(IterationCount);
				case 2:
					return GetBytesFromZValues(ZValues);
				case 3:
					return GetBytesFromDoneFlags(DoneFlags);
				default:
					throw new ArgumentException("The partnumber is out of bounds.");
			}
		}

		public void LoadPart(int partNumber, byte[] buf)
		{
			if (partNumber > PartCount - 1)
			{
				throw new ArgumentException($"This Parts Bin only has {PartCount} parts. Cannot get Part for PartNumber: {partNumber}.");
			}
			switch (partNumber)
			{
				case 0:
					LoadBytesFromCounts(Counts, buf);
					break;
				case 1:
					Array.Copy(BitConverter.GetBytes(IterationCount), buf, 4);
					break;
				case 2:
					LoadBytesFromZValues(ZValues, buf);
					break;
				case 3:
					LoadBytesFromDoneFlags(DoneFlags, buf);
					break;
				default:
					throw new ArgumentException("The partnumber is out of bounds.");
			}
		}

		public void SetPart(int partNumber, byte[] value)
		{
			if (partNumber > PartCount - 1)
			{
				throw new ArgumentException($"This Parts Bin only has {PartCount} parts. Cannot get Part for PartNumber: {partNumber}.");
			}
			switch (partNumber)
			{
				case 0:
					Counts = GetCounts(value, _size);
					break;
				case 1:
					IterationCount = BitConverter.ToInt32(value, 0);
					break;
				case 2:
					ZValues = GetZValues(value, _size);
					break;
				case 3:
					DoneFlags = GetDoneFlags(value, _size);
					break;
			}
		}

		private int[] GetCounts(byte[] buf, int size)
		{
			int[] result = new int[size];
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

		private void LoadBytesFromCounts(int[] values, byte[] buf)
		{
			for (int i = 0; i < values.Length; i++)
			{
				Array.Copy(BitConverter.GetBytes(values[i]), 0, buf, i * 4, 4);
			}
		}

		private bool[] GetDoneFlags(byte[] buf, int size)
		{
			bool[] result = new bool[size];
			for (int i = 0; i < size; i++)
			{
				result[i] = BitConverter.ToBoolean(buf, i);
			}

			return result;
		}

		private byte[] GetBytesFromDoneFlags(bool[] values)
		{
			byte[] tempBuf = values.SelectMany(value => BitConverter.GetBytes(value)).ToArray();
			return tempBuf;
		}

		private void LoadBytesFromDoneFlags(bool[] values, byte[] buf)
		{
			for (int i = 0; i < values.Length; i++)
			{
				Array.Copy(BitConverter.GetBytes(values[i]), 0, buf, i, 1);
			}
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

		private void LoadBytesFromZValues(DPoint[] values, byte[] buf)
		{
			for (int i = 0; i < values.Length; i++)
			{
				Array.Copy(BitConverter.GetBytes(values[i].X), 0, buf, i * 16, 8);
				Array.Copy(BitConverter.GetBytes(values[i].Y), 0, buf, 8 + (i * 16), 8);
			}
		}

	}
}
