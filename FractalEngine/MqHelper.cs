using Experimental.System.Messaging;
using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace FractalEngine
{
	class MqHelper
	{
		public static Task<Message> ReceiveMessageAsync(MessageQueue mq, TimeSpan timeout, object state = null)
		{
			// this will be our sentry that will know when our async operation is completed
			var tcs = new TaskCompletionSource<Message>();

			try
			{
				mq.BeginReceive(timeout, state, (iar) =>
				{
					try
					{
						var result = mq.EndReceive(iar);
						tcs.TrySetResult(result);
					}
					catch (MessageQueueException mqe)
					{
						if(mqe.MessageQueueErrorCode == MessageQueueErrorCode.IOTimeout)
						{
							tcs.TrySetResult(null);
						}
						else
						{
							throw;
						}
					}
					catch (OperationCanceledException)
					{
						// if the inner operation was canceled, this task is cancelled too
						tcs.TrySetCanceled();
					}
					catch (Exception ex)
					{
						// general exception has been set
						bool flag = tcs.TrySetException(ex);
						if (flag && ex as ThreadAbortException != null)
						{
							System.Diagnostics.Debug.WriteLine("Check this. Handling exception from End Receive.");
							//tcs.Task.m_contingentProperties.m_exceptionsHolder.MarkAsHandled(false);
						}
					}
				});
			}
			catch
			{
				tcs.TrySetResult(null);

				// propagate exceptions to the outside
				throw;
			}

			return tcs.Task;
		}

		public static MessageQueue GetQ(string path, QueueAccessMode queueAccessMode, Type[] types)
		{
			if (MessageQueue.Exists(path) == false)
			{
				Debug.WriteLine($"Creating message queue: {path}.");
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

	}
}
