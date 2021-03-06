﻿using FSTypes;
using Hjg.Pngcs;
using PngImageBuilder;
using System;
using System.IO;

namespace FractalImageBuilder
{
	public class PngBuilder
	{
		public readonly string BasePath;
		public readonly int BlockWidth;
		public readonly int BlockHeight;

		public PngBuilder(string basePath, int blockWidth, int blockHeight)
		{
			BasePath = basePath;
			BlockWidth = blockWidth;
			BlockHeight = blockHeight;
		}

		public void Build(string fn, bool hiRez)
		{
			// TODO: HiRez, blockWidth and blockHeight should come from the RepoFile.

			MapInfoWithColorMap miwcm = ReadFromJson(fn);
			int maxIterations = miwcm.MapInfo.MaxIterations;
			ColorMap colorMap = miwcm.ColorMap;

			string repofilename = miwcm.MapInfo.Name;

			//ValueRecords<KPoint, MapSectionWorkResult> countsRepo = new ValueRecords<KPoint, MapSectionWorkResult>(repofilename, useHiRezFolder: hiRez);
			//int blockLength = BlockWidth * BlockHeight;
			//MapSectionWorkResult workResult = new MapSectionWorkResult(blockLength, hiRez: hiRez, includeZValuesOnRead: false);
			//CanvasSize imageSizeInBlocks = GetImageSizeInBlocks(countsRepo);

			int blockLength = BlockWidth * BlockHeight;
			CountsRepoReader countsRepoReader = new CountsRepoReader(repofilename, hiRez, BlockWidth, BlockHeight);
			CanvasSize imageSizeInBlocks = GetImageSizeInBlocks(countsRepoReader);

			int w = imageSizeInBlocks.Width;
			int h = imageSizeInBlocks.Height;

			CanvasSize imageSize = new CanvasSize(w * BlockWidth, h * BlockHeight);

			string imagePath = GetImageFilename(fn, imageSize.Width, hiRez, BasePath);

			KPoint key = new KPoint(0, 0);

			using (PngImage pngImage = new PngImage(imagePath, imageSize.Width, imageSize.Height))
			{
				for (int vBPtr = 0; vBPtr < h; vBPtr++)
				{
					key.Y = vBPtr;
					for (int lPtr = 0; lPtr < 100; lPtr++)
					{
						ImageLine iLine = pngImage.ImageLine;
						int linePtr = vBPtr * BlockHeight + lPtr;

						for (int hBPtr = 0; hBPtr < w; hBPtr++)
						{
							key.X = hBPtr;

							//if (countsRepo.ReadParts(key, workResult))
							//{
							//	int[] allCounts = workResult.Counts;
							//	int[] countsForThisLine = GetOneLineFromCountsBlock(allCounts, lPtr);
							//	BuildPngImageLineSegment(hBPtr * BlockWidth, countsForThisLine, iLine, maxIterations, colorMap);
							//}
							//else
							//{
							//	BuildBlankPngImageLineSegment(hBPtr * BlockWidth, BlockWidth, iLine);
							//}

							int[] countsForThisLine = countsRepoReader.GetCounts(key, lPtr);
							if (countsForThisLine != null)
							{
								BuildPngImageLineSegment(hBPtr * BlockWidth, countsForThisLine, iLine, maxIterations, colorMap);
							}
							else
							{
								BuildBlankPngImageLineSegment(hBPtr * BlockWidth, BlockWidth, iLine);
							}
						}

						pngImage.WriteLine(iLine);
					}
				}
			}
		}

		private MapInfoWithColorMap ReadFromJson(string fn)
		{
			string fnWithExt = Path.ChangeExtension(fn, "json");
			string path = Path.Combine(BasePath, fnWithExt);

			JsonReader jr = new JsonReader();
			MapInfoWithColorMap miwcm = jr.Read(path);
			return miwcm;
		}

		private string GetImageFilename(string fn, int imageWidth, bool hiRez, string basePath)
		{
			string imagePath;
			if (hiRez)
			{
				imagePath = Path.Combine(basePath, $"{fn}_hrez_{imageWidth}.png");
			}
			else
			{
				imagePath = Path.Combine(basePath, $"{fn}_{imageWidth}.png");
			}

			return imagePath;
		}

		//private int[] GetOneLineFromCountsBlock(int[] counts, int lPtr)
		//{
		//	int[] result = new int[BlockWidth];

		//	Array.Copy(counts, lPtr * BlockWidth, result, 0, BlockWidth);
		//	return result;
		//}

		//private int[] GetOneLineFromCountsBlock(uint[] counts, int lPtr)
		//{
		//	int[] result = new int[BlockWidth];
		//	int srcPtr = lPtr * BlockWidth;

		//	for (int i = 0; i < result.Length; i++)
		//		result[i] = (int)counts[srcPtr++];

		//	return result;
		//}

		public static void BuildPngImageLineSegment(int pixPtr, int[] counts, ImageLine iLine, int maxIterations, ColorMap colorMap)
		{
			for (int xPtr = 0; xPtr < counts.Length; xPtr++)
			{
				double escapeVelocity = GetEscVel(counts[xPtr], out int cnt);

				int[] cComps;
				if (cnt == maxIterations)
				{
					cComps = colorMap.HighColorEntry.StartColor.ColorComps;
				}
				else
				{
					cComps = colorMap.GetColor(cnt, escapeVelocity);
				}

				ImageLineHelper.SetPixel(iLine, pixPtr++, cComps[0], cComps[1], cComps[2]);
			}
		}

		public static void BuildBlankPngImageLineSegment(int pixPtr, int len, ImageLine iLine)
		{
			for (int xPtr = 0; xPtr < len; xPtr++)
			{
				ImageLineHelper.SetPixel(iLine, pixPtr++, 255, 255, 255);
			}
		}

		private static double GetEscVel(int rawCount, out int count)
		{
			double result = rawCount / 10000d;
			count = (int)Math.Truncate(result);
			result -= count;
			return result;
		}

		private CanvasSize GetImageSizeInBlocks(CountsRepoReader countsRepo)
		{
			bool foundMax = false;

			int w = 10;
			int h = 0;

			KPoint key = new KPoint(w, h);
			foundMax = !countsRepo.ContainsKey(key);

			if (foundMax) return new CanvasSize(0, 0);

			// Find max value where w and h are equal.
			while (!foundMax)
			{
				w++;
				h++;
				key = new KPoint(w, h);
				foundMax = !countsRepo.ContainsKey(key);
			}

			w--;
			h--;
		
			foundMax = false;
			// Find max value of h
			while (!foundMax)
			{
				h++;
				key = new KPoint(w, h);
				foundMax = !countsRepo.ContainsKey(key);
			}

			h--;

			foundMax = false;
			// Find max value of h
			while (!foundMax)
			{
				w++;
				key = new KPoint(w, h);
				foundMax = !countsRepo.ContainsKey(key);
			}

			//w--;

			return new CanvasSize(w, ++h);
		}

	}
}
