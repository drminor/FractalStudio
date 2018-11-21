using System;
using System.Drawing;
using FractalServer;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace FractalServerTests
{
    [TestClass]
    public class UnitTest1
    {
        [TestMethod]
        public void BuildTestMap()
        {
            //Size canvasSize = new Size(14400, 9600);
            Size canvasSize = new Size(21600, 14400);

            RectangleF coords = new RectangleF(-2, 1, 3, 2);
            int maxIterations = 5000;
            MapInfo mapInfo = new MapInfo(coords, maxIterations);

            ColorMap colorMap = BuildColorMap();

            MapWorkingData mapWorkingData = new MapWorkingData(canvasSize, mapInfo, colorMap);

            for(int linePtr = 0; linePtr < 14400; linePtr++)
            {
                //int[] cnts = mapWorkingData.IterateLine(linePtr, mapInfo.MaxIterations);
                int[] pixelData = mapWorkingData.GetPixelDataForLine(linePtr, mapInfo.MaxIterations);
            }
        }

        private ColorMap BuildColorMap()
        {
            ColorMapEntry[] colorMapEntries = new ColorMapEntry[6];

            colorMapEntries[0] = new ColorMapEntry(3, 0);
            colorMapEntries[1] = new ColorMapEntry(5, 255);
            colorMapEntries[2] = new ColorMapEntry(10, 16000);
            colorMapEntries[3] = new ColorMapEntry(100, 54000);
            colorMapEntries[4] = new ColorMapEntry(200, 90000);
            colorMapEntries[5] = new ColorMapEntry(700, 12000);

            int highColor = 0;
            ColorMap result = new ColorMap(colorMapEntries, highColor);

            return result;
        }
    }
}
