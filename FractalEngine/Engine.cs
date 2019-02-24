using FractalServer;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FractalEngine
{

	public class Engine
	{
		private int _nextJobId;
		private int _nextJobPtr;

		private readonly Dictionary<int, Job> _jobs;

		private readonly CancellationTokenSource _cts;

		private object _jobLock = new object();

		private readonly ManualResetEvent HaveWork;

		public Engine()
		{
			_nextJobId = 0;
			_nextJobPtr = 0;
			_jobs = new Dictionary<int, Job>();

			_cts = new CancellationTokenSource();

			HaveWork = new ManualResetEvent(false);
			Start(_cts);
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
							_nextJobPtr = 0;
							HaveWork.Reset();
						}
						else
						{
							if (_nextJobPtr > _jobs.Count - 1)
							{
								_nextJobPtr = 0;
							}

							result = _jobs.Values.ToArray()[_nextJobPtr];

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

		public void Start(CancellationTokenSource cts)
		{
			// Start one producer and one consumer.
			Task t1 = Task.Run(() => WorkProcessor(WorkRequests), cts.Token);
			Task t2 = Task.Run(() => QueueWork(WorkRequests, cts.Token), cts.Token);

			//// Wait for the tasks to complete execution
			//Task.WaitAll(t1, t2);

			//cts.Dispose();

			//Task.Run(() =>
			//{
			//	bool allJobsComplete = false;
			//	for (int ptr = 0; ptr < 100000; ptr++)
			//	{
			//		if (_jobs.Count == 0 || allJobsComplete)
			//		{
			//			Thread.Sleep(1000);
			//		}
			//		else
			//		{
			//			Thread.Sleep(5);
			//		}

			//		allJobsComplete = true; // Assume true, until we find one that's not.
			//		lock (_jobLock)
			//		{
			//			foreach (KeyValuePair<int, Job> kvp in _jobs)
			//			{
			//				Job job = kvp.Value;

			//				MapSectionWorkRequest mswr = job.GetNextResult();

			//				if (mswr != null)
			//				{
			//					job.Client.ReceiveImageData(mswr.Canvas.Left);
			//					allJobsComplete = false;
			//				}
			//			}
			//		}

			//	}

			//}, cts.Token);
		}

		private void QueueWork(BlockingCollection<SubJob> bc, CancellationToken cts)
		{
			do
			{
				if (cts.IsCancellationRequested) return;

				Job job = GetNextJob(cts);
				if (cts.IsCancellationRequested) return;

				if(job != null)
				{
					SubJob subJob = job.GetNextResult();
					if(subJob != null)
					{
						bc.Add(subJob, cts);
					}
					else
					{
						// Remove the job.
						CancelJob(job.JobId);
					}
				}
			} while (true);
		}

		private void WorkProcessor(BlockingCollection<SubJob> bc)
		{
			SubJob wr = null;
			while (!bc.IsCompleted)
			{
				try
				{
					wr = bc.Take();
					wr.Client.ReceiveImageData(wr.MapSectionWorkRequest.Canvas.Left);
				}
				catch (OperationCanceledException)
				{
					//Console.WriteLine("Taking canceled.");
					break;
				}
				catch (InvalidOperationException)
				{
					//Console.WriteLine("Adding was completed!");
					break;
				}
				//Console.WriteLine("Take:{0} ", wr);

				// Simulate a slow consumer. This will cause
				// collection to fill up fast and thus Adds wil block.
				Thread.SpinWait(100000);
			}


		}

		#endregion

	}
}
