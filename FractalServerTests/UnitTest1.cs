﻿using FractalServer;
using Hjg.Pngcs;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using PngImageBuilder;
using System.Drawing;
using System.IO;

namespace FractalServerTests
{
    [TestClass]
    public class UnitTest1
    {
        public const string BasePath = @"C:\Users\david_000\Documents\Mbrodts";

        [TestMethod]
        public void BuildTestMap()
        {
            string imagePath = Path.Combine(BasePath,  "MBY1.png");

            //Size canvasSize = new Size(1440, 960);
            //Size canvasSize = new Size(7200, 4800);
            //Size canvasSize = new Size(10800, 7200);
            //Size canvasSize = new Size(14400, 9600);
            Size canvasSize = new Size(21600, 14400);

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
            string path = Path.Combine(BasePath, $"MandlebrodtMapInfo ({fn}).json");

            JsonReader jr = new JsonReader();
            MapInfoWithColorMap miwcm = jr.Read(path);

            //Size canvasSize = new Size(1440, 960);
            //Size canvasSize = new Size(7200, 4800);
            //Size canvasSize = new Size(10800, 7200);
            //Size canvasSize = new Size(14400, 9600);
            //Size canvasSize = new Size(21600, 14400);

            // Double the size of an 11 x 7.33 at 300 DPI
            Size canvasSize = new Size(6600, 4400);

            string imagePath = Path.Combine(BasePath, $"MBZ ({fn})_{canvasSize.Width}.png");

            BuildMap(imagePath, canvasSize, miwcm);
        }

        private void BuildMap(string path, Size canvasSize, MapInfoWithColorMap miwcm)
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
