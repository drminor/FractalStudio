using FractalEngine;
using FractalImageBuilder;
using FractalServer;
using FSTypes;
using Microsoft.VisualStudio.TestTools.UnitTesting;

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

			SCoords coords = new SCoords(new SPoint(leftBot), new SPoint(rightTop));
			MapSection area = new MapSection(new Point(0, 0), canvasSize.GetWholeUnits(Engine.BLOCK_SIZE));

			string connectionId = "dummy";

			SMapWorkRequest mapWorkRequest = new SMapWorkRequest("FET", coords, canvasSize, area, maxIterations, connectionId);

			Job job = new Job(mapWorkRequest);
			mapWorkRequest.JobId = job.JobId;

			SubJob subJob = null;
			while((subJob = job.GetNextSubJob()) != null)
			{
				int lx = subJob.MapSectionWorkRequest.MapSection.SectionAnchor.X;
				ProcessSubJob(subJob);
			}
        }

		private void ProcessSubJob(SubJob subJob)
		{
			MapSectionWorkRequest mswr = subJob.MapSectionWorkRequest;

			//MapWorkingData2 workingData = new MapWorkingData2(mswr.MapSection.CanvasSize, mswr.MaxIterations, mswr.XValues, mswr.YValues);
			//int[] packedCntsAndEscVels = workingData.GetValues();

			Job parentJob = subJob.ParentJob as Job;
			double[] xValues = parentJob.SamplePoints.XValueSections[subJob.MapSectionWorkRequest.HPtr];
			double[] YValues = parentJob.SamplePoints.YValueSections[subJob.MapSectionWorkRequest.VPtr];


			MapCalculator workingData = new MapCalculator();
			int[] packedCntsAndEscVels = workingData.GetValues(xValues, YValues, subJob.MapSectionWorkRequest.MaxIterations);
		}

		[TestMethod]
		public void TestRequiresQuadPrecision()
		{
			string connectionId = "dummy";
			int maxIterations = 100;
			CanvasSize canvasSize = new CanvasSize(1000, 1000);

			//DPoint leftBot = new DPoint(-0.7764118407199196, 0.13437492059936854);
			//DPoint rightTop = new DPoint(-0.7764117329761986, 0.13437499747905846);

			SPoint leftBot =  new SPoint("-0.7764118407199196", "0.13437492059936854");
			SPoint rightTop = new SPoint("-0.7764118407199300", "0.13437499747905846");

			SCoords coords = new SCoords(leftBot, rightTop);
			MapSection area = new MapSection(new Point(0, 0), canvasSize.GetWholeUnits(Engine.BLOCK_SIZE));

			SMapWorkRequest mapWorkRequest = new SMapWorkRequest("FET2", coords, canvasSize, area, maxIterations, connectionId);
			bool requiresQuadPrecision = mapWorkRequest.RequiresQuadPrecision();

		}
	}
}
