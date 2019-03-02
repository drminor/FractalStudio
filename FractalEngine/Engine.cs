﻿using FractalServer;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FractalEngine
{
	public class Engine
	{
		private IClientConnector _clientConnector;

		private int _nextJobId;
		private int _nextJobPtr;

		private readonly Dictionary<int, Job> _jobs;

		private readonly CancellationTokenSource _cts;

		private object _jobLock = new object();

		private readonly ManualResetEvent HaveWork;

		public Engine()
		{
			_clientConnector = null;

			_nextJobId = 0;
			_nextJobPtr = 0;
			_jobs = new Dictionary<int, Job>();

			_cts = new CancellationTokenSource();

			HaveWork = new ManualResetEvent(false);
		}

		public void Quit()
		{
			_cts.Cancel();
			HaveWork.Set();
		}

		#region Job Control

		public int SubmitJob(Job job)
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
			lock (_jobLock)
			{
				_jobs.Remove(jobId);
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

		private Job GetNextJob(CancellationToken cts)
		{
			Job result = null;
			do
			{
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

							//result = _jobs[_nextJobPtr++];
							break;
						}
					}
				}

			} while (true);

			return result;
		}

		#endregion

		#region Work

		private readonly BlockingCollection<SubJob> WorkRequests = new BlockingCollection<SubJob>(10);

		public void Start(IClientConnector clientConnector)
		{
			this._clientConnector = clientConnector;

			// Start one producer and one consumer.
			Task t1 = Task.Run(() => WorkProcessor(WorkRequests, _cts.Token), _cts.Token);
			Task t2 = Task.Run(() => QueueWork(WorkRequests, _cts.Token), _cts.Token);
		}

		private void QueueWork(BlockingCollection<SubJob> bc, CancellationToken ct)
		{
			do
			{
				if (ct.IsCancellationRequested) return;

				Job job = GetNextJob(ct);
				if (ct.IsCancellationRequested) return;

				SubJob subJob = job.GetNextSubJob();
				if(subJob != null)
				{
					bc.Add(subJob, ct);
				}
				else
				{
					// Remove the job.
					CancelJob(job.JobId);
				}

			} while (true);
		}

		private void WorkProcessor(BlockingCollection<SubJob> bc, CancellationToken ct)
		{
			var parallelOptions = new ParallelOptions
			{
				MaxDegreeOfParallelism = 4,
				CancellationToken = ct
			};

			try
			{
				Parallel.ForEach(bc.GetConsumingPartitioner(), parallelOptions, ProcessSubJob);
			}
			catch (OperationCanceledException)
			{
				System.Diagnostics.Debug.WriteLine("Work Request Consuming Enumerable canceled.");
				throw;
			}
			catch (InvalidOperationException)
			{
				System.Diagnostics.Debug.WriteLine("Work Request Consuming Enumerable completed.");
				throw;
			}

			//SubJob wr = null;
			//while (!bc.IsCompleted)
			//{
			//	try
			//	{
			//		wr = bc.Take(ct);
			//		_clientConnector.ReceiveImageData(wr.ConnectionId, wr.MapSectionWorkRequest.Canvas.Left);
			//	}
			//	catch (OperationCanceledException)
			//	{
			//		//Console.WriteLine("Taking canceled.");
			//		break;
			//	}
			//	catch (InvalidOperationException)
			//	{
			//		//Console.WriteLine("Adding was completed!");
			//		break;
			//	}
			//	//Console.WriteLine("Take:{0} ", wr);

			//	// Simulate a slow consumer. This will cause
			//	// collection to fill up fast and thus Adds wil block.
			//	Thread.SpinWait(100000);
			//}
		}

		private void ProcessSubJob(SubJob subJob)
		{
			MapSectionWorkRequest mswr = subJob.MapSectionWorkRequest;
			Size canvasSize = new Size(mswr.MapSection.CanvasSize.Width, mswr.MapSection.CanvasSize.Height);

			MapWorkingData2 workingData = new MapWorkingData2(canvasSize, mswr.MaxIterations, mswr.XValues, mswr.YValues);

			double[] imageData = workingData.GetValues();
			_clientConnector.ReceiveImageData(subJob.ConnectionId, mswr.MapSection, imageData);

			// Simulate a slow consumer. This will cause
			// collection to fill up fast and thus Adds wil block.
			//Thread.SpinWait(100000);
		}

		#endregion

	}
}
