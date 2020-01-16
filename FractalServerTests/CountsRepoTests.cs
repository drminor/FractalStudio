using System;
using CountsRepo;
using FractalServer;
using FSTypes;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MqMessages;

namespace FractalServerTests
{
	[TestClass]
	public class CountsRepoTests
	{
		[TestMethod]
		public void TestMethod1()
		{
			string filename = "Center1";

			using (ValueRecords<RectangleInt, MapSectionWorkResult> repo = new ValueRecords<RectangleInt, MapSectionWorkResult>(filename, useHiRezFolder: false))
			{
				RectangleInt key = new RectangleInt(new PointInt(0, 0), new SizeInt(100, 100));
				MapSectionWorkResult val = BuildMSWR(100 * 100);

				repo.Add(key, val);

				MapSectionWorkResult val2 = new MapSectionWorkResult(100 * 100, hiRez: false, includeZValuesOnRead: true);
				repo.ReadParts(key, val2);
			}

			using (ValueRecords<RectangleInt, MapSectionWorkResult> repo = new ValueRecords<RectangleInt, MapSectionWorkResult>(filename, useHiRezFolder: false))
			{
				RectangleInt key = new RectangleInt(new PointInt(0, 0), new SizeInt(100, 100));
				MapSectionWorkResult val2 = new MapSectionWorkResult(100 * 100, hiRez: false, includeZValuesOnRead: true);

				repo.ReadParts(key, val2);
			}
		}

		private MapSectionWorkResult BuildMSWR(int size)
		{
			int[] counts = new int[size];
			int iterationCount = 100;
			bool[] doneFlags = new bool[size];
			DPoint[] zValues = new DPoint[size];

			for(int i = 0; i < size; i++)
			{
				zValues[i] = new DPoint(i, i);
			}

			MapSectionWorkResult result = new MapSectionWorkResult(counts, iterationCount, zValues, doneFlags);

			return result;
		}
	}
}
