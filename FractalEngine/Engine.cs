﻿using FractalServer;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
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
							System.Diagnostics.Debug.WriteLine("There are no jobs, Resetting HaveWork.");
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
							System.Diagnostics.Debug.WriteLine($"The next job has id = {result.JobId}.");

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
					// TODO: Send Job via MQ
				}
				else
				{
					if (job is Job localJob)
					{
						SubJob subJob = localJob.GetNextSubJob();
						if (subJob != null)
						{
							workQueue.Add(subJob, ct);
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
				System.Diagnostics.Debug.WriteLine("Work Queue Consuming Enumerable canceled.");
				throw;
			}
			catch (InvalidOperationException)
			{
				System.Diagnostics.Debug.WriteLine("Work Queue Consuming Enumerable completed.");
				throw;
			}
		}

		private void ProcessSubJob(SubJob subJob)
		{
			if (subJob.ParentJob.CancelRequested)
			{
				System.Diagnostics.Debug.WriteLine("Not Processing Sub Job.");
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
						if (!(subJob.ParentJob is Job parentJob))
							throw new InvalidOperationException("The send queue only supports sub jobs of IJobs that are implemented with the Job class.");

						if (!parentJob.CancelRequested)
						{
							bool isFinalSubJob = parentJob.DecrementSubJobsRemainingToBeSent(); ;
							System.Diagnostics.Debug.WriteLine($"Sending subjob with x: {subJob.result.MapSection.SectionAnchor.X} and y: {subJob.result.MapSection.SectionAnchor.Y}.");
							_clientConnector.ReceiveImageData(subJob.ConnectionId, subJob.result, isFinalSubJob);
						}
					}
				}
			}
			catch (OperationCanceledException)
			{
				System.Diagnostics.Debug.WriteLine("Send Queue Consuming Enumerable canceled.");
				throw;
			}
			catch (InvalidOperationException)
			{
				System.Diagnostics.Debug.WriteLine("Send Queue Consuming Enumerable completed.");
				throw;
			}
		}

		#endregion

		#region MQ Methods




		#endregion
	}
}
