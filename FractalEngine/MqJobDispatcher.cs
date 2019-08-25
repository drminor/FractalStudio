using MqMessages;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Messaging;
using System.Threading;
using System.Threading.Tasks;

namespace FractalEngine
{
	class MqJobDispatcher
	{
		public const string OUTPUT_Q_PATH = @".\private$\FGenJobs";
		public const string INPUT_Q_PATH = @".\private$\FGenResults";

		
		public static TimeSpan DefaultWaitDuration = TimeSpan.FromSeconds(10);

		private Tuple<JobProcessor, Task<bool>> _currentProcAndTask { get; set; }

		#region Constructors

		public MqJobDispatcher() : this(DefaultWaitDuration) { }

		public MqJobDispatcher(TimeSpan readWaitInterval)
		{
			WaitDuration = readWaitInterval;
			_currentProcAndTask = null;
		}

		#endregion

		#region Public Properties

		public TimeSpan WaitDuration { get; set; }

		#endregion

		#region Public Methods

		public async Task HandleJobs(CancellationToken cToken)
		{
			Type[] rTtypes = new Type[] { typeof(MqMessages.FJobRequest) };

			using (MessageQueue outQ = GetQ(OUTPUT_Q_PATH, QueueAccessMode.Send, null))
			{
				using (MessageQueue inQ = GetQ(INPUT_Q_PATH, QueueAccessMode.Receive, rTtypes))
				{
					while (!cToken.IsCancellationRequested)
					{
						Message m = await AsyncHelper.ReceiveMessageAsync(inQ, WaitDuration);
						if (m != null)
						{
							Debug.WriteLine("Received a message.");
							FJobRequest test = (FJobRequest)m.Body;
							Debug.WriteLine($"The message is {test.Name}; {test.MaxIterations}.");

							_currentProcAndTask = StartNewProcessor(test, _currentProcAndTask, outQ, cToken);
						}
						else
						{
							Debug.WriteLine("No message available.");
						}
					}

					KillCurrentProcessor(_currentProcAndTask);
				}
			}

			Debug.WriteLine("Worker thread ending");
		}

		public async Task SendTestRequestsAsync()
		{
			// Wait for 2 seconds before beginning.
			await Task.Delay(2 * 1000);

			using (MessageQueue outQ = GetQ(INPUT_Q_PATH, QueueAccessMode.Send, null))
			{
				for(int cntr = 0; cntr < 2; cntr++)
				{
					outQ.Send(CreateJobRequest($"Request: {cntr.ToString()}"));
					Debug.WriteLine($"Sent request: {cntr}.");

					// Wait for 20 seconds until sending the next request.
					await Task.Delay(20 * 1000); 
				}
			}

			return;
		}

		#endregion

		#region Private Methods

		private FJobRequest CreateJobRequest(string name)
		{
			FJobRequest result = new FJobRequest(
				name,
				new Coords("-2", "1", "-1", "1"),
				new MqMessages.RectangleInt(new MqMessages.PointInt(0, 0), new MqMessages.SizeInt(100, 100)),
				new MqMessages.SizeInt(100, 100),
				300);

			return result;
		}

		private Tuple<JobProcessor, Task<bool>> StartNewProcessor
			(
			FJobRequest fJobRequest,
			Tuple<JobProcessor, Task<bool>> curProcAndTask,
			MessageQueue outQ,
			CancellationToken ct
			)
		{
			KillCurrentProcessor(curProcAndTask);

			JobProcessor jobProcessor = GetNewProcessor(fJobRequest);
			Task<bool> jpTask = ProcessJob(jobProcessor, outQ, ClearProcAndTask, ct);

			Tuple<JobProcessor, Task<bool>> result = new Tuple<JobProcessor, Task<bool>>
				(
					jobProcessor,
					jpTask
				);

			return result;
		}

		private Task<bool> ProcessJob(JobProcessor processor, MessageQueue outQ, Action<Task<bool>> cleanup, CancellationToken ct)
		{
			Task<bool> resultTask = Task.Run(() =>
			{
				MqMessages.SizeInt size = new MqMessages.SizeInt(processor.FGenJob.Area.W(), 1);

				bool result = true;

				IEnumerable<float[]> lines = processor.ProcessJob();

				int linePtr = 0;
				foreach (float[] counts in lines)
				{
					if (ct.IsCancellationRequested)
					{
						Debug.WriteLine("The entire Handle Jobs task is being cancelled.");
						result = false;
						break;
					}

					MqMessages.RectangleInt area = new MqMessages.RectangleInt(new MqMessages.PointInt(0, linePtr++), size);

					FJobResult fJobResult = new FJobResult(area, counts);
					outQ.Send(fJobResult);
				}

				Debug.WriteLine($"PT Task has completed The result is {result}.");
				return result;

			}, ct);

			resultTask.ContinueWith(cleanup);

			return resultTask;
		}

		private JobProcessor GetNewProcessor(FJobRequest fJobRequest)
		{
			FGenJob fGenJob = CreateJob(fJobRequest);
			return new JobProcessor(fGenJob);
		}

		private void KillCurrentProcessor(Tuple<JobProcessor, Task<bool>> procAndTask)
		{
			if(procAndTask != null)
			{
				Debug.WriteLine("Stopping the ProcAndTask.");

				JobProcessor jobProcessor = procAndTask.Item1;
				Task<bool> task = procAndTask.Item2;

				jobProcessor.Stop();

				try
				{
					task.Wait(20 * 1000);
					Debug.WriteLine($"We have stopped the jp, the task has completed.");
				}
				catch (Exception e)
				{
					Debug.WriteLine($"Got exception: {e.Message}.");
					throw;
				}
			} 
			else
			{
				Debug.WriteLine("ProcAndTask are null: nothing to stop.");
			}
		}

		private void ClearProcAndTask(Task<bool> task)
		{
			_currentProcAndTask = null;
		}

		private MessageQueue GetQ(string path, QueueAccessMode queueAccessMode, Type[] types)
		{
			if (MessageQueue.Exists(path) == false)
			{
				MessageQueue.Create(path);
			}

			MessageQueue mq;

			if (types != null)
			{
				mq = new MessageQueue(path, queueAccessMode)
				{
					Formatter = new XmlMessageFormatter(types)
				};
			}
			else
			{
				mq = new MessageQueue(path, queueAccessMode);
			}

			return mq;
		}

		#endregion
	}
}
