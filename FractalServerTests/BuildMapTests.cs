using CountsRepo;
using FractalImageBuilder;
using FractalServer;
using FSTypes;
using Hjg.Pngcs;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MqMessages;
using PngImageBuilder;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;

namespace FractalServerTests
{
    [TestClass]
    public class BuildMapTests
    {
		public const int BLOCK_SIZE = 100;
		public string BasePath = @"C:\Users\david_000\Documents\Mbrodts";

		[TestMethod]
		public void BuildMapFromFrdFileHiRez()
		{
			BasePath = Path.Combine(BasePath, "HiRez");

			int blocksPerInch = 6;
			int w = 21 * blocksPerInch;
			int h = 14 * blocksPerInch;

			CanvasSize imageSize = new CanvasSize(w * BLOCK_SIZE, h * BLOCK_SIZE);

			string fn = "16";

			string MapInfoFilename = $"MandlebrodtMapInfo ({fn})";
			string Repofilename = $"HiRez{16}";
			string imagePath = Path.Combine(BasePath, $"HiRez_MBB({fn})_{imageSize.Width}.png");

			MapInfoWithColorMap miwcm = ReadFromJson(fn);
			int maxIterations = miwcm.MapInfo.MaxIterations;
			ColorMap colorMap = miwcm.ColorMap;
			ValueRecords<KPoint, SubJobResult> countsRepo = new ValueRecords<KPoint, SubJobResult>(Repofilename, useHiRezFolder: true);

			KPoint key = new KPoint(0,0);
			SubJobResult workResult = SubJobResult.GetEmptySubJobResult(10000, "0", false);

			using (PngImage pngImage = new PngImage(imagePath, imageSize.Width, imageSize.Height))
			{
				for (int vBPtr = 0; vBPtr < h; vBPtr++)
				{
					key.Y = vBPtr;
					for (int lPtr = 0; lPtr < 100; lPtr++)
					{
						ImageLine iLine = pngImage.ImageLine;
						int linePtr = vBPtr * BLOCK_SIZE + lPtr;

						for (int hBPtr = 0; hBPtr < w; hBPtr++)
						{
							key.X = hBPtr;

							if (countsRepo.ReadParts(key, workResult))
							{
								uint[] allCounts = workResult.Counts;
								int[] countsForThisLine = GetOneLineFromCountsBlock(allCounts, lPtr);
								MapWorkingData.BuildPngImageLineSegment(hBPtr * BLOCK_SIZE, countsForThisLine, iLine, maxIterations, colorMap);
							}
							else
							{
								MapWorkingData.BuildBlankPngImageLineSegment(hBPtr * BLOCK_SIZE, BLOCK_SIZE, iLine);
							}

						}

						pngImage.WriteLine(iLine);
					}
				}
			}
		}

		[TestMethod]
		public void BuildMapFromFrdFile()
		{
			bool hiRez = true;
			if (hiRez) BasePath = Path.Combine(BasePath, "HiRez");

			int blocksPerInch = 6;
			int w = 21 * blocksPerInch;
			int h = 14 * blocksPerInch;

			CanvasSize imageSize = new CanvasSize(w * BLOCK_SIZE, h * BLOCK_SIZE);

			string fn = "16";

			string MapInfoFilename;
			string Repofilename;
			string imagePath;
			if (hiRez)
			{
				MapInfoFilename = $"MandlebrodtMapInfo ({fn})";
				Repofilename = $"HiRez{16}";
				imagePath = Path.Combine(BasePath, $"HiRez_MBB({fn})_{imageSize.Width}.png");
			}
			else
			{
				MapInfoFilename = $"MandlebrodtMapInfo ({fn})";
				Repofilename = MapInfoFilename;
				imagePath = Path.Combine(BasePath, $"MBB({fn})_{imageSize.Width}.png");
			}

			MapInfoWithColorMap miwcm = ReadFromJson(fn);
			int maxIterations = miwcm.MapInfo.MaxIterations;
			ColorMap colorMap = miwcm.ColorMap;
			//MapWorkingData mapWorkingData = new MapWorkingData(imageSize, null, miwcm.ColorMap);

			ValueRecords<RectangleInt, MapSectionWorkResult> countsRepo = new ValueRecords<RectangleInt, MapSectionWorkResult>(Repofilename, useHiRezFolder: hiRez);

			RectangleInt key = new RectangleInt(new PointInt(0, 0), new SizeInt(BLOCK_SIZE, BLOCK_SIZE));
			MapSectionWorkResult workResult = new MapSectionWorkResult(10000, true, false);

			using (PngImage pngImage = new PngImage(imagePath, imageSize.Width, imageSize.Height))
			{
				for (int vBPtr = 0; vBPtr < h; vBPtr++)
				{
					key.Point.Y = vBPtr * BLOCK_SIZE;
					for (int lPtr = 0; lPtr < 100; lPtr++)
					{
						ImageLine iLine = pngImage.ImageLine;
						int linePtr = vBPtr * BLOCK_SIZE + lPtr;

						for (int hBPtr = 0; hBPtr < w; hBPtr++)
						{
							key.Point.X = hBPtr * BLOCK_SIZE;

							if(countsRepo.ReadParts(key, workResult))
							{
								int[] allCounts = workResult.Counts;
								int[] countsForThisLine = GetOneLineFromCountsBlock(allCounts, lPtr);
								MapWorkingData.BuildPngImageLineSegment(hBPtr * BLOCK_SIZE, countsForThisLine, iLine, maxIterations, colorMap);
							}
							else
							{
								MapWorkingData.BuildBlankPngImageLineSegment(hBPtr * BLOCK_SIZE, BLOCK_SIZE, iLine);
							}
						}

						pngImage.WriteLine(iLine);
					}
				}
			}
		}

		[TestMethod]
		public void GetHistogramTest()
		{
			int w = 108; // blocks
			int h = 72;

			CanvasSize imageSize = new CanvasSize(w * 100, h * 100);

			string fn = "17";
			string filename = $"MandlebrodtMapInfo ({fn})";
			string imagePath = Path.Combine(BasePath, $"MBB({fn})_{imageSize.Width}.png");

			IDictionary<int, int> hist = new Dictionary<int, int>();

			ValueRecords<RectangleInt, MapSectionWorkResult> countsRepo = new ValueRecords<RectangleInt, MapSectionWorkResult>(filename, useHiRezFolder: false);

			RectangleInt key = new RectangleInt(new PointInt(0, 0), new SizeInt(100, 100));
			MapSectionWorkResult workResult = new MapSectionWorkResult(10000, true, false);

			for (int vBPtr = 0; vBPtr < h; vBPtr++)
			{
				key.Point.Y = vBPtr * 100;
				for (int hBPtr = 0; hBPtr < w; hBPtr++)
				{
					key.Point.X = hBPtr * 100;
					if (countsRepo.ReadParts(key, workResult))
					{
						foreach (int cntAndEsc in workResult.Counts)
						{
							int cnt = cntAndEsc / 10000;
							if (hist.TryGetValue(cnt, out int occurances))
							{
								hist[cnt] = occurances + 1;
							}
							else
							{
								hist[cnt] = 1;
							}
						}
					}
				}
			}

			Debug.WriteLine($"The histogram has {hist.Count} entries.");
		}

		private int[] GetOneLineFromCountsBlock(int[] counts, int lPtr)
		{
			int[] result = new int[BLOCK_SIZE];

			Array.Copy(counts, lPtr * BLOCK_SIZE, result, 0, BLOCK_SIZE);
			return result;
		}

		private int[] GetOneLineFromCountsBlock(uint[] counts, int lPtr)
		{
			int[] result = new int[BLOCK_SIZE];
			int srcPtr = lPtr * BLOCK_SIZE;

			for (int i = 0; i < result.Length; i++)
				result[i] = (int)counts[srcPtr++];

			return result;
		}

		[TestMethod]
        public void BuildTestMap()
        {
            string imagePath = Path.Combine(BasePath,  "MBY1.png");

            //Size canvasSize = new Size(1440, 960);
            //Size canvasSize = new Size(7200, 4800);
            //Size canvasSize = new Size(10800, 7200);
            //Size canvasSize = new Size(14400, 9600);
            CanvasSize canvasSize = new CanvasSize(21600, 14400);

            DPoint leftBot = new DPoint(-0.7764118407199196, 0.13437492059936854);
            DPoint rightTop = new DPoint(-0.7764117329761986, 0.13437499747905846);

            int maxIterations = 400;
            MapInfo mapInfo = new MapInfo(leftBot, rightTop, maxIterations);

            ColorMap colorMap = BuildColorMap();

            MapInfoWithColorMap miwcm = new MapInfoWithColorMap(mapInfo, colorMap);

            BuildMap(imagePath, canvasSize, miwcm);
        }

        [TestMethod]
        public void BuildMapFromJason()
        {
            //string path = @"C:\MandlebrodtMapInfo.json";

            string fn = "x20";
			MapInfoWithColorMap miwcm = ReadFromJson(fn);

            //Size canvasSize = new Size(1440, 960);
            //Size canvasSize = new Size(7200, 4800);
            //Size canvasSize = new Size(10800, 7200);
            //Size canvasSize = new Size(14400, 9600);
            //Size canvasSize = new Size(21600, 14400);

            // Double the size of an 11 x 7.33 at 300 DPI
            CanvasSize canvasSize = new CanvasSize(6600, 4400);

            string imagePath = Path.Combine(BasePath, $"MBZ ({fn})_{canvasSize.Width}.png");

            BuildMap(imagePath, canvasSize, miwcm);
        }

		private MapInfoWithColorMap ReadFromJson(string fn)
		{
			string path = Path.Combine(BasePath, $"MandlebrodtMapInfo ({fn}).json");

			JsonReader jr = new JsonReader();
			MapInfoWithColorMap miwcm = jr.Read(path);
			return miwcm;
		}

        private void BuildMap(string path, CanvasSize canvasSize, MapInfoWithColorMap miwcm)
        {
            MapWorkingData mapWorkingData = new MapWorkingData(canvasSize, miwcm.MapInfo, miwcm.ColorMap);

            using (PngImage pngImage = new PngImage(path, canvasSize.Width, canvasSize.Height))
            {
                ImageLine iLine = pngImage.ImageLine;

                for (int linePtr = 0; linePtr < canvasSize.Height; linePtr++)
                {
                    mapWorkingData.BuildPngImageLine(linePtr, iLine);
                    pngImage.WriteLine(iLine);
                }
            }
        }

        [TestMethod]
        public void TestColorMap()
        {
            ColorMap colorMap = BuildColorMap();

            int val = colorMap.GetCutOff(0);

            System.Diagnostics.Debug.WriteLine($"Got co:{val} for cnt:0.");
            foreach(int co in colorMap.CutOffs)
            {
                val = colorMap.GetCutOff(co - 1);
                System.Diagnostics.Debug.WriteLine($"Got co:{val} for cnt:{co - 1}.");

                val = colorMap.GetCutOff(co);
                System.Diagnostics.Debug.WriteLine($"Got co:{val} for cnt:{co}.");

                val = colorMap.GetCutOff(co + 1);
                System.Diagnostics.Debug.WriteLine($"Got co:{val} for cnt:{co + 1}.");
            }

            val = colorMap.GetCutOff(400);
            System.Diagnostics.Debug.WriteLine($"Got co:{val} for cnt:400.");
        }

		private ColorMap BuildColorMap()
        {
            //ColorMapEntry[] colorMapEntries = new ColorMapEntry[18];

            //colorMapEntries[0] = new ColorMapEntry(258, "#ffffff");
            //colorMapEntries[1] = new ColorMapEntry(260, "#bf2ae2");
            //colorMapEntries[2] = new ColorMapEntry(262, "#f017c6");
            //colorMapEntries[3] = new ColorMapEntry(265, "#e1e10f");
            //colorMapEntries[4] = new ColorMapEntry(269, "#24d0e3");
            //colorMapEntries[5] = new ColorMapEntry(273, "#00ff00");
            //colorMapEntries[6] = new ColorMapEntry(277, "#0000ff");
            //colorMapEntries[7] = new ColorMapEntry(280, "#ff0000");
            //colorMapEntries[8] = new ColorMapEntry(283, "#00ff00");
            //colorMapEntries[9] = new ColorMapEntry(287, "#e77d4d");
            //colorMapEntries[10] = new ColorMapEntry(292, "#13bcb4");
            //colorMapEntries[11] = new ColorMapEntry(298, "#9da5b3");
            //colorMapEntries[12] = new ColorMapEntry(304, "#f50050");
            //colorMapEntries[13] = new ColorMapEntry(310, "#ffffff");
            //colorMapEntries[14] = new ColorMapEntry(318, "#bf2ae2");
            //colorMapEntries[15] = new ColorMapEntry(328, "#f017c6");
            //colorMapEntries[16] = new ColorMapEntry(340, "#e1e10f");
            //colorMapEntries[17] = new ColorMapEntry(357, "#24d0e3");

            //ColorMapEntry[] colorMapEntries = new ColorMapEntry[13];

            //colorMapEntries[0] = new ColorMapEntry(249, "#ffffff");
            //colorMapEntries[1] = new ColorMapEntry(252, "#bf2ae2");
            //colorMapEntries[2] = new ColorMapEntry(255, "#f017c6");
            //colorMapEntries[3] = new ColorMapEntry(259, "#e1e10f");
            //colorMapEntries[4] = new ColorMapEntry(263, "#24d0e3");
            //colorMapEntries[5] = new ColorMapEntry(268, "#00ff00");
            //colorMapEntries[6] = new ColorMapEntry(274, "#0000ff");
            //colorMapEntries[7] = new ColorMapEntry(280, "#ff0000");
            //colorMapEntries[8] = new ColorMapEntry(286, "#00ff00");
            //colorMapEntries[9] = new ColorMapEntry(294, "#e77d4d");
            //colorMapEntries[10] = new ColorMapEntry(304, "#13bcb4");
            //colorMapEntries[11] = new ColorMapEntry(316, "#9da5b3");
            //colorMapEntries[12] = new ColorMapEntry(333, "#f50050");

            ColorMapEntry[] colorMapEntries = new ColorMapEntry[13];

            colorMapEntries[0] = new ColorMapEntry(260, "#ffffff");
            colorMapEntries[1] = new ColorMapEntry(263, "#bf2ae2");
            colorMapEntries[2] = new ColorMapEntry(267, "#f017c6");
            colorMapEntries[3] = new ColorMapEntry(271, "#e1e10f");
            colorMapEntries[4] = new ColorMapEntry(276, "#24d0e3");
            colorMapEntries[5] = new ColorMapEntry(281, "#00ff00");
            colorMapEntries[6] = new ColorMapEntry(286, "#0000ff");
            colorMapEntries[7] = new ColorMapEntry(292, "#ff0000");
            colorMapEntries[8] = new ColorMapEntry(299, "#00ff00");
            colorMapEntries[9] = new ColorMapEntry(307, "#e77d4d");
            colorMapEntries[10] = new ColorMapEntry(317, "#13bcb4");
            colorMapEntries[11] = new ColorMapEntry(330, "#9da5b3");
            colorMapEntries[12] = new ColorMapEntry(347, "#f50050");

            string highColor = "#000000"; // black
            ColorMap result = new ColorMap(colorMapEntries, highColor);

            return result;
        }
    }
}
