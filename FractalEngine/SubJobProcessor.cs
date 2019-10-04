using FractalServer;
using FSTypes;
using MqMessages;
using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace FractalEngine
{
	internal class SubJobProcessor
	{
		private readonly BlockingCollection<SubJob> _workQueue;
		private readonly BlockingCollection<SubJob> _sendQueue;

		private readonly CancellationTokenSource _cts;

		private Task _task;

		public SubJobProcessor(BlockingCollection<SubJob> workQueue, BlockingCollection<SubJob> sendQueue)
		{
			_workQueue = workQueue;
			_sendQueue = sendQueue;
			_cts = new CancellationTokenSource();
		}

		public void Start()
		{
			_task = Task.Run(() => WorkProcessor(_workQueue, _sendQueue, _cts.Token), _cts.Token);
		}

		public void Stop()
		{
			_cts.Cancel();
		}

		private void WorkProcessor(BlockingCollection<SubJob> workQueue, BlockingCollection<SubJob> sendQueue, CancellationToken ct)
		{
			try
			{
				while (!ct.IsCancellationRequested)
				{
					workQueue.TryTake(out SubJob subJob, -1, ct);
					MapSectionResult msr = ProcessSubJob(subJob);
					if (msr != null)
					{
						subJob.MapSectionResult = msr;
						_sendQueue.Add(subJob);
					}
				}
			}
			catch (OperationCanceledException)
			{
				Debug.WriteLine("Send Queue Consuming Enumerable canceled.");
				throw;
			}
			catch (InvalidOperationException)
			{
				Debug.WriteLine("Send Queue Consuming Enumerable completed.");
				throw;
			}
		}

		private MapSectionResult ProcessSubJob(SubJob subJob)
		{
			if (subJob.ParentJob.CancelRequested)
			{
				Debug.WriteLine("Not Processing Sub Job.");
				return null;
			}

			if (!(subJob.ParentJob is Job localJob))
			{
				throw new InvalidOperationException("When processing a subjob, the parent job must be implemented by the Job class.");
			}


			MapSectionResult result;
			MapSection ms = subJob.MapSectionWorkRequest.MapSection;

			MapSectionWorkResult workResult = RetrieveWorkResultFromRepo(ms, localJob, readZValues: false);

			if (workResult == null)
			{
				result = CalculateMapValues(subJob, localJob, null);
			}
			else
			{
				if(workResult.IterationCount == 0 || workResult.IterationCount == subJob.MapSectionWorkRequest.MaxIterations)
				{
					// The WorkResult read from file has the correct iteration count. (Or we are not tracking the interation count.)
					result = new MapSectionResult(localJob.JobId, ms, workResult.Counts);
				}
				else if (workResult.IterationCount < subJob.MapSectionWorkRequest.MaxIterations)
				{
					// Fetch the entire WorkResult with ZValues
					workResult = RetrieveWorkResultFromRepo(ms, localJob, readZValues: true);

					// Use the current work results to continue calculations to create
					// a result with the target iteration count.
					result = CalculateMapValues(subJob, localJob, workResult);
				}
				else
				{
					throw new InvalidOperationException("Cannot reduce the number of iterations of an existing job.");
				}
			}

			return result;
		}

		private MapSectionResult CalculateMapValues(SubJob subJob, Job localJob, MapSectionWorkResult workResult)
		{
			MapSectionWorkRequest mswr = subJob.MapSectionWorkRequest;
			MapCalculator mapCalculator = new MapCalculator(mswr.MaxIterations);

			bool overwriteResults;
			if (workResult == null)
			{
				workResult = BuildInitialWorkingValues(mswr);
				overwriteResults = false;
			}
			else
			{
				overwriteResults = true;
			}

			workResult = mapCalculator.GetWorkingValues(mswr, workResult);
			localJob.WriteWorkResult(mswr.MapSection, workResult, overwriteResults);

			MapSectionResult msr = new MapSectionResult(localJob.JobId, mswr.MapSection, workResult.Counts);
			return msr;
		}


		private MapSectionWorkResult RetrieveWorkResultFromRepo(MapSection ms, Job localJob, bool readZValues)
		{
			RectangleInt riKey = ms.GetRectangleInt();
			MapSectionWorkResult workResult = GetEmptyResult(riKey, readZValues);

			if (localJob.RetrieveWorkResultFromRepo(riKey, workResult))
			{
				return workResult;
			}
			else
			{
				return null;
			}
		}

		private MapSectionWorkResult _emptyResult = null;
		private MapSectionWorkResult _emptyResultWithZValues = null;

		private MapSectionWorkResult GetEmptyResult(RectangleInt area, bool readZValues)
		{
			if (area.Size.W != 100 || area.Size.H != 100)
			{
				Debug.WriteLine("Wrong Area.");
			}

			if(readZValues)
			{
				if (_emptyResultWithZValues == null)
				{
					_emptyResultWithZValues = new MapSectionWorkResult(area.Size.W * area.Size.H, true, true);
				}
				return _emptyResultWithZValues;
			}
			else
			{
				if (_emptyResult == null)
				{
					_emptyResult = new MapSectionWorkResult(area.Size.W * area.Size.H, true, false);
				}
				return _emptyResult;
			}
		}

		private MapSectionWorkResult BuildInitialWorkingValues(MapSectionWorkRequest mswr)
		{
			int width = mswr.MapSection.CanvasSize.Width;
			int height = mswr.MapSection.CanvasSize.Height;

			int len = width * height;

			int[] counts = new int[len];
			bool[] doneFlags = new bool[len];
			DPoint[] zValues = new DPoint[len];

			for (int ptr = 0; ptr < len; ptr++)
			{
				zValues[ptr] = new DPoint(0, 0);
			}

			MapSectionWorkResult result = new MapSectionWorkResult(counts, mswr.MaxIterations, zValues, doneFlags);
			return result;
		}


	}
}
