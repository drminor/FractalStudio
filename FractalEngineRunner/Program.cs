using FractalEngine;
using FractalServer;
using MqMessages;
using System;

namespace FractalEngineRunner
{
	class Program
	{
		static Engine _engine;
		static CoordsMath _coordsMath;

		static void Main(string[] args)
		{
			_engine = new Engine();
			_coordsMath = new CoordsMath();

			IClientConnector clientConnector = null;
			_engine.Start(clientConnector);

			Console.Write("Enter Command: ");
			string com =  Console.ReadLine();
			com = com.ToLower().Trim();

			while (com != "quit")
			{
				FJobRequestType? requestType = GetRequestType(com, out int jobId);

				if (!requestType.HasValue)
				{
					Console.WriteLine("Command not recognized.");
				}
				else
				{
					ProcessRequest(requestType.Value, jobId);
				}

				Console.Write("Enter Command: ");
				com = Console.ReadLine();
			}

			Console.WriteLine("Quitting, press any key to exit.");

			Console.Read();
		}

		static void ProcessRequest(FJobRequestType requestType, int jobId)
		{
			switch (requestType)
			{
				case FJobRequestType.Generate:
					Console.WriteLine($"Submitting Generate Job with JobId {jobId}.");
					IJob job = GetJobRequest(jobId);
					_engine.SubmitJob(job);
					break;

				//case FJobRequestType.IncreaseInterations:
				//	break;

				case FJobRequestType.TransformCoords:
					Console.WriteLine($"Submitting Transform Job with JobId {jobId}.");
					SCoordsWorkRequest sCoordsWorkRequest = GetTransformWorkRequest(jobId);

					SCoords sCoords = _coordsMath.ZoomIn(sCoordsWorkRequest);
					Console.WriteLine($"The new coords are: {sCoords.ToString()}.");
					break;

				case FJobRequestType.Delete:
					Console.WriteLine($"Cancelling Job with JobId {jobId}.");
					_engine.CancelJob(jobId);
					break;

				default:
					Console.WriteLine($"Not processing job with request type: {requestType}.");
					break;
			}
		}

		static IJob GetJobRequest(int jobId)
		{
			SMapWorkRequest sMapRequest = CreateWorkRequest(jobId);

			IJob result = new JobForMq(sMapRequest, sMapRequest.ConnectionId);
			return result;
		}

		static SCoordsWorkRequest GetTransformWorkRequest(int jobId)
		{
			SPoint leftBot = new SPoint("-1", "-1");
			SPoint rightTop = new SPoint("2", "1");
			SCoords sCoords = new SCoords(leftBot, rightTop);

			CanvasSize samplePoints = new CanvasSize(100, 100);
			MapSection mapSection = new MapSection(new Point(10, 10), new CanvasSize(10, 10));
			SCoordsWorkRequest result = new SCoordsWorkRequest(sCoords, samplePoints, mapSection, jobId);

			return result;
		}

		static FJobRequestType? GetRequestType(string com, out int jobId)
		{
			char[] delimiters = new char[] { ' ' };
			string[] parts = com.Split(delimiters, StringSplitOptions.RemoveEmptyEntries);

			if(parts.Length < 2)
			{
				jobId = -1;
				return null;
			}

			if(!int.TryParse(parts[1], out jobId))
			{
				// Cannot parse the JobId.
				jobId = -1;
				return null;
			}

			if(parts[0].StartsWith("g"))
			{
				// Generate request.
				return FJobRequestType.Generate;
			}
			else if (parts[0].StartsWith("d"))
			{
				// Delete request.
				return FJobRequestType.Delete;
			}
			else if (parts[0].StartsWith("t"))
			{
				// transform request.
				return FJobRequestType.TransformCoords;
			}
			else
			{
				// Invalid input.
				jobId = -1;
				return null;
			}

		}

		static SMapWorkRequest CreateWorkRequest(int jobId)
		{
			CanvasSize canvasSize = new CanvasSize(188, 125);
			DPoint leftBot = new DPoint(-2, -1);
			DPoint rightTop = new DPoint(1, 1);
			SCoords coords = new SCoords(new SPoint(leftBot), new SPoint(rightTop));
			int maxIterations = 100;
			string connectionId = "dummy";

			SMapWorkRequest mapWorkRequest = new SMapWorkRequest(coords, maxIterations, canvasSize, connectionId)
			{
				JobId = jobId
			};

			return mapWorkRequest;
		}

	}
}
