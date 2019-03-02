using FractalEngine;
using FractalServer;
using Hjg.Pngcs;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using PngImageBuilder;
using System.Drawing;
using System.IO;

namespace FractalServerTests
{
    [TestClass]
    public class FractalEngineTests
	{
        [TestMethod]
        public void CreateJob()
        {

            //CanvasSize canvasSize = new CanvasSize(1440, 960);
			CanvasSize canvasSize = new CanvasSize(188, 125);

			//Size canvasSize = new Size(7200, 4800);
			//Size canvasSize = new Size(10800, 7200);
			//Size canvasSize = new Size(14400, 9600);
			//Size canvasSize = new Size(21600, 14400);

			//DPoint leftBot = new DPoint(-0.7764118407199196, 0.13437492059936854);
			//DPoint rightTop = new DPoint(-0.7764117329761986, 0.13437499747905846);

			DPoint leftBot = new DPoint(-2, -1);
			DPoint rightTop = new DPoint(1, 1);


			int maxIterations = 100;
            MapInfo mapInfo = new MapInfo(leftBot, rightTop, maxIterations);

			Coords coords = new Coords(leftBot, rightTop);

			string connectionId = "dummy";

			MapWorkRequest mapWorkRequest = new MapWorkRequest(coords, maxIterations, canvasSize, connectionId);

			Job job = new Job(mapWorkRequest, connectionId);

			SubJob subJob = null;
			while((subJob = job.GetNextSubJob()) != null)
			{
				int lx = subJob.MapSectionWorkRequest.XValues.Length;
				ProcessSubJob(subJob);
			}
        }

		private void ProcessSubJob(SubJob subJob)
		{
			MapSectionWorkRequest mswr = subJob.MapSectionWorkRequest;
			Size canvasSize = new Size(mswr.MapSection.CanvasSize.Width, mswr.MapSection.CanvasSize.Height);

			MapWorkingData2 workingData = new MapWorkingData2(canvasSize, mswr.MaxIterations, mswr.XValues, mswr.YValues);

			double[] imageData = workingData.GetValues();
		}

    }
}
