using Experimental.System.Messaging;
using FSTypes;
using MqMessages;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Coords = MqMessages.Coords;

namespace FractalEngine
{
	public class Engine
	{
		public const int BLOCK_SIZE = 100; 

		public const string OUTPUT_Q_PATH = @".\private$\FGenJobs";
		public const string INPUT_Q_PATH = @".\private$\FGenResults";
		public static TimeSpan DefaultWaitDuration = TimeSpan.FromSeconds(30);

		private IClientConnector _clientConnector;

		private int _nextJobId;
		private int _nextJobPtr;

		private readonly Dictionary<int, IJob> _jobs;
		private readonly CancellationTokenSource _cts;
		private readonly object _jobLock = new object();
		private readonly ManualResetEvent _haveWork;

		private readonly BlockingCollection<SubJob> _workQueue = new BlockingCollection<SubJob>(10);
		private readonly BlockingCollection<SubJob> _sendQueue = new BlockingCollection<SubJob>(50);

		private SubJobProcessor[] _subJobProcessors = null;

		public Engine()
		{
			_clientConnector = null;
			_jobs = new Dictionary<int, IJob>();
			_cts = new CancellationTokenSource();

			_haveWork = new ManualResetEvent(false);
			WaitDuration = DefaultWaitDuration;

			_nextJobId = 0;
			_nextJobPtr = 0;
		}

		public TimeSpan WaitDuration { get; set; }

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
				_haveWork.Set();
			}

			return jobId;
		}

		public Histogram GetHistogram(int jobId)
		{
			Histogram result = null;

			IJob job = GetJob(jobId);
			if(job != null)
			{
				if(job is Job localJob)
				{
					Dictionary<int, int> hDictionary = localJob.GetHistogram();
					result = new Histogram(jobId, hDictionary);
				}
				else if(job is JobForMq mqJob)
				{
					result = new MqHistogram().GetHistogram(jobId);
				}
				else
				{
					throw new InvalidOperationException("The job is neither a local or mq job.");
				}
			}

			return result;
		}

		public void ReplayJob(int jobId)
		{
			IJob job = GetJob(jobId);
			if (job != null)
			{
				if (job is Job localJob)
				{
					// TODO: Reset IsComplete
					//_haveWork.Set();
				}
				else if (job is JobForMq mqJob)
				{
					mqJob.ResetSubJobsRemainingToBeSent();
					SendReplayJobRequestToMq(mqJob);
				}
				else
				{
					throw new InvalidOperationException("The job is neither a local or mq job.");
				}
			}
		}

		//public void SubmitSubJob(SubJob subJob)
		//{
		//	IJob parentJob = subJob.ParentJob;

		//	if(parentJob is Job localJob)
		//	{
		//		MapSectionResult msr = localJob.RetrieveWorkResultFromRepo(subJob);
		//		if (msr != null)
		//		{
		//			// TODO: Nothing is managing the IsLastSubJob here.
		//			SendReplayResultToClient(msr, parentJob.IsLastSubJob, localJob.ConnectionId);
		//		}
		//		else
		//		{
		//			ProcessSubJob(subJob);
		//		}
		//	}
		//	else
		//	{
		//		throw new InvalidOperationException("Only subjobs of local jobs can be submitted.");
		//	}
		//}

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

		public void CancelJob(int jobId, bool deleteRepo)
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
					// Send Cancel message to MQ.
					SendDeleteJobRequestToMq(jobForMq, deleteRepo);

					jobForMq.MqImageResultListener.Stop();
				}
				else if(job is Job localJob) 
				{
					if(deleteRepo)
						localJob.DeleteCountsRepo();
					else
						localJob.Dispose();
				}
				else
				{
					throw new InvalidOperationException("Job type not recognized.");
				}
			}
		}

		private IJob RemoveJob(int jobId)
		{
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
				CancelJob(jobId, deleteRepo: false);
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

				bool wasSignaled = _haveWork.WaitOne(1000);

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
							_haveWork.Reset();
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

		public void Start(IClientConnector clientConnector)
		{
			_clientConnector = clientConnector;

			Task.Run(() => SendProcessor(_sendQueue, _cts.Token), _cts.Token);

			_subJobProcessors = new SubJobProcessor[4];
			for(int wpCntr = 0; wpCntr < 4; wpCntr++)
			{
				_subJobProcessors[wpCntr] = new SubJobProcessor(_workQueue, _sendQueue);
				_subJobProcessors[wpCntr].Start();
			}

			Task.Run(() => QueueWork(_workQueue, _cts.Token), _cts.Token);
		}

		public void Stop()
		{
			_cts.Cancel();
			_haveWork.Set();

			foreach (SubJobProcessor subJobProcessor in _subJobProcessors)
			{
				subJobProcessor.Stop();
			}
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

					//Task listenerTask = Task.Run(async () => await MqImageResultListenerAsync(jobForMq, _sendQueue, listenerCts.Token));
					//jobForMq.ListenerTask = new Tuple<Task, CancellationTokenSource>(listenerTask, listenerCts);

					MqImageResultListener resultListener = new MqImageResultListener(jobForMq, INPUT_Q_PATH, _sendQueue, WaitDuration);
					resultListener.Start();
					jobForMq.MqImageResultListener = resultListener;

					jobForMq.MarkAsCompleted();
				}
				else if (job is Job localJob)
				{
					SubJob subJob = localJob.GetNextSubJob();
					if (subJob != null)
					{
						//Debug.WriteLine($"Adding subJob for JobId:{subJob.ParentJob.JobId}, the pos is {subJob.MapSectionWorkRequest.MapSection.SectionAnchor.X},{subJob.MapSectionWorkRequest.MapSection.SectionAnchor.Y}.");
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
			if (job is JobForMq result)
			{
				return result;
			}
			else
			{
				//result = new JobForMq(job.SMapWorkRequest);
				//return result;
				throw new InvalidOperationException($"The job must be an instance of the JobForMq class. The job name is {job.SMapWorkRequest.Name}.");
			}
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
							//if (subJob.ParentJob is Job parentJob)
							//	parentJob.DecrementSubJobsRemainingToBeSent();

							subJob.ParentJob.DecrementSubJobsRemainingToBeSent();
							bool isFinalSubJob = subJob.ParentJob.IsLastSubJob;

							if (_clientConnector != null)
							{
								Debug.WriteLine($"Sending subjob with x: {subJob.MapSectionResult.MapSection.SectionAnchor.X} " +
									$"and y: {subJob.MapSectionResult.MapSection.SectionAnchor.Y}. " +
									$"with connId = {subJob.ConnectionId}. IsLastResult = {isFinalSubJob}.");
									//$"It has {subJob.result.ImageData.Length} count values.");
								_clientConnector.ReceiveImageData(subJob.ConnectionId, subJob.MapSectionResult, isFinalSubJob);
							}
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

		private string SendDeleteJobRequestToMq(JobForMq job, bool deleteRepo)
		{
			using (MessageQueue outQ = MqHelper.GetQ(OUTPUT_Q_PATH, QueueAccessMode.Send, null, null))
			{
				FJobRequest fJobRequest = FJobRequest.CreateDeleteRequest(job.JobId, deleteRepo);
				Message m = new Message(fJobRequest);
				outQ.Send(m);

				return m.Id;
			}
		}

		private string SendReplayJobRequestToMq(JobForMq job)
		{
			using (MessageQueue outQ = MqHelper.GetQ(OUTPUT_Q_PATH, QueueAccessMode.Send, null, null))
			{
				FJobRequest fJobRequest = FJobRequest.CreateReplayRequest(job.JobId);
				Message m = new Message(fJobRequest);
				outQ.Send(m);

				return m.Id;
			}
		}

		private FJobRequest CreateFJobRequest(int jobId, SMapWorkRequest smwr)
		{
			Coords coords = smwr.SCoords.GetCoords();
			RectangleInt area = smwr.Area.GetRectangleInt();
			SizeInt samplePoints = smwr.CanvasSize.GetSizeInt();

			FJobRequest fJobRequest = new FJobRequest(jobId, smwr.Name, FJobRequestType.Generate, coords, area, samplePoints, (uint) smwr.MaxIterations);

			return fJobRequest;
		}

		#endregion
	}
}
