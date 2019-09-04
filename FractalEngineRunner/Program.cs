using FractalEngine;
using FractalServer;
using System;

namespace FractalEngineRunner
{
	class Program
	{
		static Engine _engine;

		static void Main(string[] args)
		{
			_engine = new Engine();
			IClientConnector clientConnector = null;
			_engine.Start(clientConnector);

			Console.WriteLine("Enter Command:");
			string com =  Console.ReadLine();
			com = com.ToLower().Trim();

			while (com != "quit")
			{
				bool isGenerateJob = IsGenerateRequest(com, out int jobId);

				if (jobId == -1)
				{
					Console.WriteLine("Command not recognized.");
				}
				else if (isGenerateJob)
				{
					Console.WriteLine($"Submitting Generate Job with JobId {jobId}.");
					IJob job = GetJobRequest(jobId);
					_engine.SubmitJob(job);
				}
				else
				{
					// must be a delete request.
					Console.WriteLine($"Cancelling Job with JobId {jobId}.");
					_engine.CancelJob(jobId);
				}

				Console.WriteLine("Enter Command:");
				com = Console.ReadLine();
			}

			Console.WriteLine("Quitting, press any key to exit.");

			Console.Read();
		}

		static IJob GetJobRequest(int jobId)
		{
			SMapWorkRequest sMapRequest = CreateWorkRequest(jobId);

			IJob result = new JobForMq(sMapRequest, sMapRequest.ConnectionId);
			return result;
		}

		static bool IsGenerateRequest(string com, out int jobId)
		{
			char[] delimiters = new char[] { ' ' };
			string[] parts = com.Split(delimiters, StringSplitOptions.RemoveEmptyEntries);

			if(parts.Length < 2)
			{
				jobId = -1;
				return false;
			}

			if(!int.TryParse(parts[1], out jobId))
			{
				// Cannot parse the JobId.
				jobId = -1;
				return false;
			}

			if(parts[0].StartsWith("g"))
			{
				// Generate request.
				return true;
			}
			else if (parts[0].StartsWith("d"))
			{
				// Delete request.
				return false;
			}
			else
			{
				// Invalid input.
				jobId = -1;
				return false;
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
