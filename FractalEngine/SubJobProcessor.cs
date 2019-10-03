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

			MapSectionResult msr = RetrieveWorkResultFromRepo(subJob, localJob);
			if (msr == null)
			{
				MapSectionWorkRequest mswr = subJob.MapSectionWorkRequest;
				MapCalculator mapCalculator = new MapCalculator(mswr.MaxIterations);

				MapSectionWorkResult workResult = GetInitialWorkingValues(mswr);
				workResult = mapCalculator.GetWorkingValues(mswr, workResult);
				localJob.WriteWorkResult(subJob.MapSectionWorkRequest.MapSection, workResult);

				msr = new MapSectionResult(localJob.JobId, mswr.MapSection, workResult.Counts);
			}

			return msr;
		}

		private MapSectionResult RetrieveWorkResultFromRepo(SubJob subJob, Job localJob)
		{
			MapSectionWorkResult workResult = GetEmptyResult(subJob.MapSectionWorkRequest.MapSection.GetRectangleInt());

			if (localJob.RetrieveWorkResultFromRepo(subJob, workResult))
			{
				MapSectionResult result = new MapSectionResult(localJob.JobId, subJob.MapSectionWorkRequest.MapSection, workResult.Counts);
				return result;
			}
			else
			{
				return null;
			}
		}

		private MapSectionWorkResult _emptyResult = null;
		private MapSectionWorkResult GetEmptyResult(RectangleInt area)
		{
			if (area.Size.W != 100 || area.Size.H != 100)
			{
				Debug.WriteLine("Wrong Area.");
			}
			if (_emptyResult == null)
			{
				_emptyResult = new MapSectionWorkResult(area.Size.W * area.Size.H, true, false);
			}
			//_emptyResult = new MapSectionWorkResult(area.Size.W * area.Size.H, true, false);

			return _emptyResult;
		}

		private MapSectionWorkResult _initialValues = null;

		private MapSectionWorkResult GetInitialWorkingValues(MapSectionWorkRequest mswr)
		{
			//if(_initialValues == null)
			//{
			//	_initialValues = BuildInitialWorkingValues(mswr);
			//}
			//else
			//{
			//	ClearInitialValues(_initialValues);
			//}
			_initialValues = BuildInitialWorkingValues(mswr);

			return _initialValues;
		}

		private void ClearInitialValues(MapSectionWorkResult workResult)
		{
			for (int ptr = 0; ptr < workResult.ZValues.Length; ptr++)
			{
				workResult.ZValues[ptr] = new DPoint(0, 0);
				workResult.Counts[ptr] = 0;
				workResult.DoneFlags[ptr] = false;
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
