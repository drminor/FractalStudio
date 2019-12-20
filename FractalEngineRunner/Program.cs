using FractalEngine;
using FSTypes;
using MqMessages;
using System;

namespace FractalEngineRunner
{
	class Program
	{
		static Engine _engine;
		static CoordsMath _coordsMath;

		static SCoords _curCoords;
		static int _curJobId;
		static readonly CanvasSize _samplePoints = new CanvasSize(100, 100);

		static void Main(string[] args)
		{
			_engine = new Engine();
			_coordsMath = new CoordsMath();
			_curCoords = GetInitialCoords();

			IClientConnector clientConnector = null;
			_engine.Start(clientConnector);

			Console.Write("Enter Command: ");
			string com =  Console.ReadLine();
			com = com.ToLower().Trim();

			while (com != "quit")
			{
				Request request = ParseCom(com);

				if (request == null)
				{
					Console.WriteLine("Command not recognized.");
				}
				else
				{
					ProcessRequest(request);
				}

				Console.Write("Enter Command: ");
				com = Console.ReadLine();
			}

			Console.WriteLine("Quitting, press return key to exit.");
			_engine.Stop();

			Console.Read();
		}

		static void ProcessRequest(Request request)
		{
			int jobId = request.JobId;

			switch (request.RequestType)
			{
				case FJobRequestType.Generate:
					Console.WriteLine($"Submitting Generate Job with JobId {jobId}.");
					IJob job = GetJobRequest(jobId);
					_curJobId = _engine.SubmitJob(job);
					break;

				case FJobRequestType.IncreaseInterations:
					_engine.ReplayJob(_curJobId, 200);
					//Console.WriteLine($"Resetting the current coordinates.");
					//_curCoords = GetInitialCoords();
					//WriteCoords(_curCoords);
					break;

				case FJobRequestType.TransformCoords:
					Console.WriteLine($"Submitting Transform Job with JobId {jobId}.");
					_curCoords = HandleTransCoRequest(request, _curCoords);
					WriteCoords(_curCoords);
					break;

				case FJobRequestType.Delete:
					Console.WriteLine($"Cancelling Job with JobId {jobId}.");
					_engine.CancelJob(jobId, false);
					break;

				default:
					Console.WriteLine($"Not processing job with request type: {request.RequestType}.");
					break;
			}
		}

		static void WriteCoords(SCoords coords)
		{
			Console.WriteLine("The new coords are:");
			Console.WriteLine($"sx: {_curCoords.LeftBot.X}");
			Console.WriteLine($"ex: {_curCoords.RightTop.X}");
			Console.WriteLine($"sy: {_curCoords.LeftBot.Y}");
			Console.WriteLine($"ey: {_curCoords.RightTop.Y}");
		}

		static SCoords HandleTransCoRequest(Request request, SCoords curCoords)
		{
			SCoordsWorkRequest sCoordsWorkRequest = null;

			switch (request.TransformType)
			{
				case TransformType.In:
					sCoordsWorkRequest = GetTransformWorkRequestZ(request.JobId, curCoords, _samplePoints);
					break;

				case TransformType.Out:
					sCoordsWorkRequest = GetTransformWorkRequest(request.JobId, curCoords, request.TransformType.Value, request.Amount);
					break;

				case TransformType.Down:
					sCoordsWorkRequest = GetTransformWorkRequest(request.JobId, curCoords, request.TransformType.Value, request.Amount);
					break;

				case TransformType.Up:
					sCoordsWorkRequest = GetTransformWorkRequest(request.JobId, curCoords, request.TransformType.Value, request.Amount);
					break;

				case TransformType.Left:
					sCoordsWorkRequest = GetTransformWorkRequest(request.JobId, curCoords, request.TransformType.Value, request.Amount);
					break;

				case TransformType.Right:
					sCoordsWorkRequest = GetTransformWorkRequest(request.JobId, curCoords, request.TransformType.Value, request.Amount);
					break;

				default:
					Console.WriteLine("Peforming no op.");
					return null;
			}

			SCoords result = _coordsMath.DoOp(sCoordsWorkRequest);
			return result;
		}

		static IJob GetJobRequest(int jobId)
		{
			SMapWorkRequest sMapRequest = CreateWorkRequest(jobId);

			//IJob result = new JobForMq(sMapRequest);
			IJob result = new Job(sMapRequest);
			return result;
		}

		static SCoordsWorkRequest GetTransformWorkRequestZ(int jobId, SCoords curCoords, CanvasSize samplePoints)
		{
			MapSection mapSection = new MapSection(new Point(40, 40), new CanvasSize(20, 20));
			SCoordsWorkRequest result = new SCoordsWorkRequest(TransformType.In, curCoords, samplePoints, mapSection, jobId);

			return result;
		}

		static SCoordsWorkRequest GetTransformWorkRequest(int jobId, SCoords curCoords, TransformType transformType, int amount)
		{
			CanvasSize samplePoints = new CanvasSize(0, 0);
			MapSection mapSection = new MapSection(new Point(amount, 0), new CanvasSize(0,0));
			SCoordsWorkRequest result = new SCoordsWorkRequest(transformType, curCoords, samplePoints, mapSection, jobId);

			return result;
		}

		static Request ParseCom(string com)
		{
			char[] delimiters = new char[] { ' ' };
			string[] parts = com.Split(delimiters, StringSplitOptions.RemoveEmptyEntries);

			if(parts.Length < 2)
			{
				return null;
			}

			if(!int.TryParse(parts[1], out int jobId))
			{
				// Cannot parse the JobId.
				Console.WriteLine("Must include jobId as second parameter.");
				return null;
			}

			if(parts[0].StartsWith("g"))
			{
				// Generate request.
				return new Request(jobId, FJobRequestType.Generate, null, 0);
			}
			else if (parts[0].StartsWith("d"))
			{
				// Delete request.
				return new Request(jobId, FJobRequestType.Delete, null, 0);
			}
			else if(parts[0].StartsWith("r"))
			{
				// Currently using this to reset the cur coords.
				return new Request(jobId, FJobRequestType.IncreaseInterations, null, 0);
			}
			else if (parts[0].StartsWith("t"))
			{
				if(parts.Length < 4)
				{
					// Invalid input.
					return null;
				}

				// transform request.
				TransformType? transformType = GetTType(parts[2].ToLower().Trim().ToCharArray()[0]);
				if(!transformType.HasValue)
				{
					return null;
				}

				if(!double.TryParse(parts[3], out double dAmount))
				{
					Console.WriteLine("Could not parse the amount. Using 0.5");
					dAmount = 0.5;
				}

				int amount = (int) Math.Round(dAmount * 10000);

				return new Request(jobId, FJobRequestType.TransformCoords, transformType, amount);
			}
			else
			{
				// Invalid input.
				return null;
			}
		}

		static TransformType? GetTType(char t)
		{
			switch(t)
			{
				case 'i': return TransformType.In;
				case 'o': return TransformType.Out;
				case 'r': return TransformType.Right;
				case 'l': return TransformType.Left ;
				case 'u': return TransformType.Up;
				case 'd': return TransformType.Down;

				default: return null;
			}
		}

		static SMapWorkRequest CreateWorkRequest(int jobId)
		{
			CanvasSize canvasSize = new CanvasSize(300, 200);
			DPoint leftBot = new DPoint(-2, -1);
			DPoint rightTop = new DPoint(1, 1);
			SCoords coords = new SCoords(new SPoint(leftBot), new SPoint(rightTop));
			MapSection area = new MapSection(new Point(0, 0), canvasSize.GetWholeUnits(Engine.BLOCK_SIZE));

			int maxIterations = 100;
			string connectionId = "dummy";

			SMapWorkRequest mapWorkRequest = new SMapWorkRequest("FEngRunner", coords, canvasSize, area, maxIterations, connectionId)
			{
				JobId = jobId
			};

			return mapWorkRequest;
		}

		static SCoords GetInitialCoords()
		{
			DPoint leftBot = new DPoint(2, -1);
			DPoint rightTop = new DPoint(4, 1);
			SCoords coords = new SCoords(new SPoint(leftBot), new SPoint(rightTop));

			return coords;
		}

	}
}
