﻿using Experimental.System.Messaging;
using FractalServer;
using FSTypes;
using MqMessages;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FractalEngine
{
	public class Engine
	{
		public const int BLOCK_SIZE = 100; 

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

				//if (job is Job localJob && localJob.CanReplayResults())
				//{
				//	// This is just temporary for testing.
				//	ReplayResults(localJob);
				//}
				//else
				//{
				//	Debug.WriteLine("Adding job to queue.");
				//	_jobs.Add(jobId, job);
				//	HaveWork.Set();
				//}

				Debug.WriteLine("Adding job to queue.");
				_jobs.Add(jobId, job);
				HaveWork.Set();
			}

			return jobId;
		}

		public bool SubmitSubJob(SubJob subJob)
		{
			IJob parentJob = subJob.ParentJob;

			if(parentJob is Job localJob)
			{
				if(localJob.CanReplayResults())
				{
					MapSectionResult msr = localJob.RetrieveWorkResultFromRepo(subJob);
					if(msr != null)
					{
						// TODO: Nothing is managing the IsLastSubJob here.
						SendReplayResultToClient(msr, parentJob.IsLastSubJob, localJob.ConnectionId);
					}
					else
					{
						ProcessSubJob(subJob);
					}
				}
				return true;
			}
			else
			{
				throw new InvalidOperationException("Only subjobs of local jobs can be submitted.");
			}
		}

		private void ReplayResults(Job localJob)
		{
			Task.Run(() => {
				Thread.Sleep(1000);

				IEnumerable<Tuple<MapSectionResult, bool>> results = localJob.ReplayResults();
				foreach (Tuple<MapSectionResult, bool> resultAndFinalFlag in results)
				{
					SendReplayResultToClient(resultAndFinalFlag.Item1, resultAndFinalFlag.Item2, localJob.ConnectionId);
				}
			});
		}

		private void SendReplayResultToClient(MapSectionResult msr, bool isFinalSection, string connectionId)
		{
			Debug.WriteLine($"The msr size = {msr.MapSection.CanvasSize.Width * msr.MapSection.CanvasSize.Height}, The counts length is {msr.ImageData.Length}.");
			_clientConnector.ReceiveImageData(connectionId, msr, isFinalSection);
		}

		public void CancelJob(int jobId)
		{
			IJob job = RemoveJob(jobId);

			if(job != null)
			{
				job.CancelRequested = true;
				if (_clientConnector != null)
				{
					_clientConnector.ConfirmJobCancel(job.ConnectionId, jobId);
				}

				if (job is JobForMq jobForMq)
				{
					// Stop listening for responses.
					StopListenerTask(jobForMq);

					// Send Cancel message to MQ.
					SendDeleteJobRequestToMq(jobForMq);

					// Remove "in transit" responses.
					RemoveResponses(jobForMq.MqRequestCorrelationId);
				}
				else if(job is Job localJob) 
				{
					//localJob.DeleteCountsRepo();
					localJob.Dispose();
				}
				else
				{
					throw new InvalidOperationException("Job type not recognized.");
				}
			}
		}

		private void StopListenerTask(JobForMq jobForMq)
		{
			if (jobForMq.ListenerTask == null) return;

			Task task = jobForMq.ListenerTask.Item1;
			CancellationTokenSource cts = jobForMq.ListenerTask.Item2;

			// Remove reference from the Job to ensure garbage collection.
			jobForMq.ListenerTask = null;

			cts.Cancel();

			try
			{
				task.Wait(20 * 1000);
				Debug.WriteLine($"The response listener for Job: {jobForMq.JobId} has completed.");
			}
			catch (Exception e)
			{
				Debug.WriteLine($"Received an exception while trying to stop the response listener for Job: {jobForMq.JobId}. Got exception: {e.Message}.");
				throw;
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

		private void CancelAllJobs()
		{
			var jobIds = _jobs.Values.Select(v => v.JobId).ToList();
			foreach (int jobId in jobIds)
			{
				CancelJob(jobId);
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
						IJob[] jobs = _jobs.Values.Where(j => !j.IsCompleted).ToArray();

						if (jobs == null || jobs.Length == 0)
						{
							Debug.WriteLine("There are no un completed jobs, resetting HaveWork.");
							_nextJobPtr = 0;
							HaveWork.Reset();
						}
						else
						{
							if (_nextJobPtr > jobs.Length - 1)
								_nextJobPtr = 0;

							result = jobs[_nextJobPtr++];
							//Debug.WriteLine($"The next job has id = {result.JobId}.");
							break;
						}
					}
				}

			} while (true);

			//Debug.WriteLine("Get Next Job is returning.");
			return result;
		}

		#endregion

		#region Work

		private readonly BlockingCollection<SubJob> WorkQueue = new BlockingCollection<SubJob>(10);
		private readonly BlockingCollection<SubJob> SendQueue = new BlockingCollection<SubJob>(50);

		public void Start(IClientConnector clientConnector)
		{
			_clientConnector = clientConnector;

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
					JobForMq jobForMq = GetJobForMqFromJob(job);
					jobForMq.MqRequestCorrelationId = SendJobToMq(jobForMq);

					CancellationTokenSource listenerCts = new CancellationTokenSource();
					Debug.WriteLine($"Starting a new ImageResultListener for {jobForMq.JobId}.");
					Task listenerTask = Task.Run(async () => await MqImageResultListenerAsync(jobForMq, SendQueue, listenerCts.Token));

					jobForMq.ListenerTask = new Tuple<Task, CancellationTokenSource>(listenerTask, listenerCts);
					jobForMq.MarkAsCompleted();
				}
				else if (job is Job localJob)
				{
					SubJob subJob = localJob.GetNextSubJob();
					if (subJob != null)
					{
						workQueue.Add(subJob, ct);
					}
				}
				else if(job is JobForMq)
				{
					throw new InvalidOperationException("Job does not require quad precision and it is not a local job.");
				}
				else
				{
					throw new ArgumentException("The IJob is neither a Job or a JobForMq.");
				}

			} while (true);
		}

		private JobForMq GetJobForMqFromJob(IJob job)
		{
			if (!(job is JobForMq result))
			{
				result = new JobForMq(job.SMapWorkRequest);
			}

			return result;
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

			if (!(subJob.ParentJob is Job localJob))
			{
				throw new InvalidOperationException("When processing a subjob, the parent job must be implemented by the Job class.");
			}

			MapSectionResult msr = localJob.RetrieveWorkResultFromRepo(subJob);
			if(msr != null)
			{
				subJob.MapSectionResult = msr;
			}
			else
			{
				MapSectionWorkRequest mswr = subJob.MapSectionWorkRequest;
				MapCalculator mapCalculator = new MapCalculator(mswr.MaxIterations);

				MapSectionWorkResult workResult = mapCalculator.GetInitialWorkingValues(mswr);
				workResult = mapCalculator.GetWorkingValues(mswr, workResult);
				localJob.WriteWorkResult(subJob.MapSectionWorkRequest.MapSection, workResult);

				MapSectionResult result = new MapSectionResult(localJob.JobId, mswr.MapSection, workResult.Counts);
				subJob.MapSectionResult = result;
			}

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
							//Debug.WriteLine($"Sending subjob with x: {subJob.result.MapSection.SectionAnchor.X} " +
							//	$"and y: {subJob.result.MapSection.SectionAnchor.Y}. " +
							//	$"It has {subJob.result.ImageData.Length} count values.");

							if (_clientConnector != null)
							{
								_clientConnector.ReceiveImageData(subJob.ConnectionId, subJob.MapSectionResult, isFinalSubJob);
							}

							//if (subJob.ParentJob is Job pJob)
							//{
							//	if (subJob.WorkResult != null)
							//	{
							//		// A Map Section Work Result was created -- write it to the Repo.
							//		pJob.WriteWorkResult(subJob.MapSectionWorkRequest.MapSection, subJob.WorkResult);
							//	}
							//}
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

		// TODO: Need to create a class to hold the listener.
		private async Task MqImageResultListenerAsync(JobForMq jobForMq, BlockingCollection<SubJob> sendQueue, CancellationToken cToken)
		{
			using (MessageQueue inQ = GetJobResponseQueue())
			{
				while (!cToken.IsCancellationRequested && !jobForMq.IsLastSubJob)
				{
					Message m = await MqHelper.ReceiveMessageByCorrelationIdAsync(inQ, jobForMq.MqRequestCorrelationId, WaitDuration);

					if(m == null)
					{
						Debug.WriteLine("No FGenResult message present.");
						continue;
					}

					Debug.WriteLine("Received a message.");
					FJobResult jobResult = (FJobResult)m.Body;

					int lineNumber = jobResult.Area.Point.Y;
					Debug.WriteLine($"The line number is {lineNumber}.");

					if (lineNumber == jobForMq.SMapWorkRequest.CanvasSize.Height - 1)
					{
						jobForMq.SetIsLastSubJob(true);
					}

					SubJob subJob = CreateSubJob(jobResult, jobForMq);

					SendQueue.Add(subJob);
				}

				if(jobForMq.IsLastSubJob)
				{
					Debug.WriteLine($"The result listener for {jobForMq.JobId} is stopping. We have received the last result.");
				}
				else if(cToken.IsCancellationRequested)
				{
					Debug.WriteLine($"The result listener for {jobForMq.JobId} has been cancelled.");
				}
				else
				{
					Debug.WriteLine($"The result listener for {jobForMq.JobId} is stopping for unknown reason.");
				}

				// Release reference to the Job to assist the garbage collector.
				jobForMq = null;
			}
		}

		private MessageQueue GetJobResponseQueue()
		{
			Type[] rTtypes = new Type[] { typeof(FJobResult) };

			MessagePropertyFilter mpf = new MessagePropertyFilter
			{
				Body = true,
				//Id = true,
				CorrelationId = true
			};

			MessageQueue result = MqHelper.GetQ(INPUT_Q_PATH, QueueAccessMode.Receive, rTtypes, mpf);
			return result;
		}

		private void RemoveResponses(string correlationId)
		{
			if(correlationId == null)
			{
				Debug.WriteLine("Attempting to remove responses with a null cor id. Not removing any responses.");
				return;
			}

			using (MessageQueue inQ = GetJobResponseQueue())
			{
				Message m = null;
				do
				{
					m = MqHelper.GetMessageByCorId(inQ, correlationId, TimeSpan.FromMilliseconds(10));
				}
				while (m != null);
			}
		}

		private string SendJobToMq(JobForMq job)
		{
			using (MessageQueue outQ = MqHelper.GetQ(OUTPUT_Q_PATH, QueueAccessMode.Send, null, null))
			{
				FJobRequest fJobRequest = CreateFJobRequest(job.JobId, job.SMapWorkRequest);
				Debug.WriteLine($"Sending request with JobId {fJobRequest.JobId} to output Q.");

				Message m = new Message(fJobRequest);
				outQ.Send(m);

				return m.Id;
			}
		}

		private string SendDeleteJobRequestToMq(JobForMq job)
		{
			using (MessageQueue outQ = MqHelper.GetQ(OUTPUT_Q_PATH, QueueAccessMode.Send, null, null))
			{
				FJobRequest fJobRequest = FJobRequest.CreateDeleteRequest(job.JobId);
				Message m = new Message(fJobRequest);
				outQ.Send(m);

				return m.Id;
			}
		}

		private SubJob CreateSubJob(FJobResult jobResult, IJob parentJob)
		{
			MapSectionWorkResult workResult = CreateWorkResult(jobResult);

			// TODO: Have the parentJob write the workResult to the Repo.

			MapSectionWorkRequest workRequest = CreateMSWR(jobResult, parentJob.SMapWorkRequest.MaxIterations);
			MapSectionResult msr = CreateMapSectionResult(parentJob.JobId, workRequest, workResult);

			SubJob subJob = new SubJob(parentJob, workRequest, parentJob.ConnectionId)
			{
				MapSectionResult = msr
			};

			return subJob;
		}

		private MapSectionWorkRequest CreateMSWR(FJobResult jobResult, int maxIterations)
		{
			MapSection mapSection = new MapSection(jobResult.Area);
			MapSectionWorkRequest result = new MapSectionWorkRequest(mapSection, maxIterations, null, null);
			return result;
		}

		private MapSectionWorkResult CreateWorkResult(FJobResult fJobResult)
		{
			int[] counts = fJobResult.GetValues();
			MapSectionWorkResult result = new MapSectionWorkResult(counts);
			return result;
		}

		// This is only used by MQ Jobs
		private MapSectionResult CreateMapSectionResult(int jobId, MapSectionWorkRequest workRequest, MapSectionWorkResult workResult)
		{
			MapSectionResult result = new MapSectionResult(jobId, workRequest.MapSection, workResult.Counts);
			return result;
		}

		private FJobRequest CreateFJobRequest(int jobId, SMapWorkRequest smwr)
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