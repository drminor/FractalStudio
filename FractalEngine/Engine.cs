using Experimental.System.Messaging;
using FractalServer;
using MqMessages;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Messaging;
using System.Threading;
using System.Threading.Tasks;

namespace FractalEngine
{
	public class Engine
	{
		public const string OUTPUT_Q_PATH = @".\private$\FGenJobs";
		public const string INPUT_Q_PATH = @".\private$\FGenResults";
		public static TimeSpan DefaultWaitDuration = TimeSpan.FromSeconds(10);

		private IClientConnector _clientConnector;

		private int _nextJobId;
		private int _nextJobPtr;

		private readonly Dictionary<int, IJob> _jobs;
		private readonly CancellationTokenSource _cts;
		private readonly object _jobLock = new object();
		private readonly ManualResetEvent HaveWork;

		public Engine()
		{
			_clientConnector = null;
			_jobs = new Dictionary<int, IJob>();
			_cts = new CancellationTokenSource();

			HaveWork = new ManualResetEvent(false);
			WaitDuration = DefaultWaitDuration;

			_nextJobId = 0;
			_nextJobPtr = 0;
		}

		public TimeSpan WaitDuration { get; set; }

		public void Quit()
		{
			_cts.Cancel();
			HaveWork.Set();
		}

		#region Job Control

		public int SubmitJob(IJob job)
		{
			int jobId;

			lock (_jobLock)
			{
				jobId = NextJobId;
				job.JobId = jobId;
				_jobs.Add(jobId, job);
				HaveWork.Set();
			}

			return jobId;
		}

		public void CancelJob(int jobId)
		{
			IJob job = this.RemoveJob(jobId);

			if(job != null)
			{
				job.CancelRequested = true;
				if (_clientConnector != null)
				{
					_clientConnector.ConfirmJobCancel(job.ConnectionId, jobId);
				}
			}
		}

		private IJob RemoveJob(int jobId)
		{
			// TODO: consider keeping a list of removed jobs using WeakReferences.
			// The job can be removed from the list of removedjobs once the last subjob is processed.
			lock (_jobLock)
			{
				if (_jobs.TryGetValue(jobId, out IJob job))
				{
					_jobs.Remove(jobId);
					return job;
				}
				else
				{
					return null;
				}
			}
		}

		public int NumberOfJobs
		{
			get
			{
				return _jobs.Count;
			}
		}

		private int NextJobId
		{
			get
			{
				return _nextJobId++;
			}
		}

		private IJob GetNextJob(CancellationToken cts)
		{
			IJob result = null;
			do
			{
				if (cts.IsCancellationRequested)
				{
					break;
				}

				bool wasSignaled = HaveWork.WaitOne(1000);

				if (cts.IsCancellationRequested)
				{
					break;
				}

				if (wasSignaled)
				{
					lock (_jobLock)
					{
						if(_jobs.Count == 0)
						{
							//Debug.WriteLine("There are no jobs, Resetting HaveWork.");
							_nextJobPtr = 0;
							HaveWork.Reset();
						}
						else
						{
							if (_nextJobPtr > _jobs.Count - 1)
							{
								_nextJobPtr = 0;
							}

							result = _jobs.Values.ToArray()[_nextJobPtr++];
							//Debug.WriteLine($"The next job has id = {result.JobId}.");

							break;
						}
					}
				}

			} while (true);

			return result;
		}

		#endregion

		#region Work

		private readonly BlockingCollection<SubJob> WorkQueue = new BlockingCollection<SubJob>(10);
		private readonly BlockingCollection<SubJob> SendQueue = new BlockingCollection<SubJob>(50);

		public void Start(IClientConnector clientConnector)
		{
			this._clientConnector = clientConnector;

			// Start one producer and one consumer.
			Task.Run(async () => await MqImageResultListenerAsync(SendQueue, _cts.Token));
			Task.Run(() => SendProcessor(SendQueue, _cts.Token), _cts.Token);
			Task.Run(() => WorkProcessor(WorkQueue, SendQueue, _cts.Token), _cts.Token);
			Task.Run(() => QueueWork(WorkQueue, _cts.Token), _cts.Token);
		}

		private void QueueWork(BlockingCollection<SubJob> workQueue, CancellationToken ct)
		{
			do
			{
				IJob job = GetNextJob(ct);
				if (ct.IsCancellationRequested) return;

				if(job.RequiresQuadPrecision())
				{
					SendJobToMq(job);
				}
				else
				{
					if (job is Job localJob)
					{
						SubJob subJob = localJob.GetNextSubJob();
						if (subJob != null)
						{
							workQueue.Add(subJob, ct);

							//// FOR TESTING ONLY
							//JobForMq t = new JobForMq(job.SMapWorkRequest, job.ConnectionId);
							//SendJobToMq(t);
						}
						else
						{
							// Remove the job.
							RemoveJob(job.JobId);
						}
					}
					else
					{
						throw new InvalidOperationException("Job does not require quad precision and it is not a local job.");
					}
				}

			} while (true);
		}

		private void WorkProcessor(BlockingCollection<SubJob> workQueue, BlockingCollection<SubJob> sendQueue, CancellationToken ct)
		{
			var parallelOptions = new ParallelOptions
			{
				MaxDegreeOfParallelism = 4,
				CancellationToken = ct
			};

			try
			{
				Parallel.ForEach(workQueue.GetConsumingPartitioner(), parallelOptions, ProcessSubJob);
			}
			catch (OperationCanceledException)
			{
				Debug.WriteLine("Work Queue Consuming Enumerable canceled.");
				throw;
			}
			catch (InvalidOperationException)
			{
				Debug.WriteLine("Work Queue Consuming Enumerable completed.");
				throw;
			}
		}

		private void ProcessSubJob(SubJob subJob)
		{
			if (subJob.ParentJob.CancelRequested)
			{
				Debug.WriteLine("Not Processing Sub Job.");
				return;
			}

			MapSectionWorkRequest mswr = subJob.MapSectionWorkRequest;
			MapCalculator workingData = new MapCalculator();
			int[] imageData = workingData.GetValues(mswr);

			MapSection mapSection = subJob.MapSectionWorkRequest.MapSection;
			MapSectionResult mapSectionResult = new MapSectionResult(subJob.ParentJob.JobId, mapSection, imageData);
			subJob.result = mapSectionResult;

			SendQueue.Add(subJob);
		}

		private void SendProcessor(BlockingCollection<SubJob> sendQueue, CancellationToken ct)
		{
			try
			{
				while(!ct.IsCancellationRequested)
				{
					if(sendQueue.TryTake(out SubJob subJob, -1, ct))
					{
						if (!subJob.ParentJob.CancelRequested)
						{
							if (subJob.ParentJob is Job parentJob)
								parentJob.DecrementSubJobsRemainingToBeSent();

							bool isFinalSubJob = subJob.ParentJob.IsLastSubJob;
							Debug.WriteLine($"Sending subjob with x: {subJob.result.MapSection.SectionAnchor.X} " +
								$"and y: {subJob.result.MapSection.SectionAnchor.Y}. " +
								$"It has {subJob.result.ImageData.Length} count values.");

							_clientConnector.ReceiveImageData(subJob.ConnectionId, subJob.result, isFinalSubJob);
						}
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

		private IJob GetJob(int jobId)
		{
			if (_jobs.TryGetValue(jobId, out IJob job))
			{
				return job;
			}
			else
			{
				return null;
			}
		}

		#endregion

		#region MQ Methods

		private async Task MqImageResultListenerAsync(BlockingCollection<SubJob> sendQueue, CancellationToken cToken)
		{
			Type[] rTtypes = new Type[] { typeof(FJobResult) };

			using (MessageQueue inQ = MqHelper.GetQ(INPUT_Q_PATH, QueueAccessMode.Receive, rTtypes))
			{
				while (!cToken.IsCancellationRequested)
				{
					Message m = await MqHelper.ReceiveMessageAsync(inQ, WaitDuration);

					if(m == null)
					{
						Debug.WriteLine("No FGenResult message present.");
						continue;
					}

					Debug.WriteLine("Received a message.");
					FJobResult jobResult = (FJobResult)m.Body;
					int lineNumber = jobResult.Area.Point.Y;
					Debug.WriteLine($"The line number is {lineNumber}.");

					IJob parentJob = GetJob(jobResult.JobId);
					if (parentJob == null)
						continue;

					if(lineNumber == parentJob.SMapWorkRequest.CanvasSize.Height - 1)
					{
						if(parentJob is JobForMq jobForMq)
						{
							jobForMq.SetIsLastSubJob(true);
						}
						else
						{
							throw new InvalidOperationException("Expecting the IJob to be implemented by an instance of the JobForMq class.");
						}
					}

					MapSectionWorkRequest mswr = GetMSWR(jobResult, parentJob.SMapWorkRequest.MaxIterations);

					SubJob subJob = new SubJob(parentJob, mswr, parentJob.ConnectionId)
					{
						result = GetMSR(jobResult, parentJob.JobId)
					};

					SendQueue.Add(subJob);
				}
			}
		}

		private void SendJobToMq(IJob job)
		{
			if (job.IsCompleted) return;

			using (MessageQueue outQ = MqHelper.GetQ(OUTPUT_Q_PATH, QueueAccessMode.Send, null))
			{
				FJobRequest fJobRequest = GetFJobRequest(job.JobId, job.SMapWorkRequest);
				outQ.Send(fJobRequest);
				if(job is JobForMq jobForMq)
				{
					jobForMq.MarkAsCompleted();
				}
				else
				{
					throw new InvalidOperationException("Expecting the IJob to be implemented by an instance of the JobForMq class.");
				}
			}
		}

		private MapSectionWorkRequest GetMSWR(FJobResult jobResult, int maxIterations)
		{
			MapSection mapSection = new MapSection(jobResult.Area);
			MapSectionWorkRequest result = new MapSectionWorkRequest(mapSection, maxIterations, null, null);
			return result;
		}

		private MapSectionResult GetMSR(FJobResult fJobResult, int JobId)
		{
			int[] counts = fJobResult.GetValues();
			for(int ptr = 0; ptr < counts.Length; ptr++)
			{
				counts[ptr] = counts[ptr] * 10000;
			}

			MapSection ms = new MapSection(fJobResult.Area);
			MapSectionResult result = new MapSectionResult(fJobResult.JobId, ms, counts);
			return result;
		}

		private FJobRequest GetFJobRequest(int jobId, SMapWorkRequest smwr)
		{
			SCoords sCoords = smwr.SCoords;
			MqMessages.Coords coords = new MqMessages.Coords(sCoords.LeftBot.X, sCoords.RightTop.X, sCoords.LeftBot.Y, sCoords.RightTop.Y);

			CanvasSize cs = smwr.CanvasSize;
			SizeInt samplePoints = new SizeInt(cs.Width, cs.Height);

			FJobRequest fJobRequest = new FJobRequest(jobId, coords, samplePoints, smwr.MaxIterations);

			return fJobRequest;
		}

		#endregion
	}
}
