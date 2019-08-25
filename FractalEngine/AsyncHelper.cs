using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Messaging;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FractalEngine
{
	class AsyncHelper
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
						if (mqe.Message == "Timeout for the requested operation has expired.")
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

		public static async Task WaitWithToken(int millisecondsToWait, CancellationToken ct)
		{
			try
			{
				await Task.Delay(millisecondsToWait, ct);
			}
			catch (TaskCanceledException)
			{

			}
			catch (Exception e)
			{
				Debug.WriteLine($"Received error while from Task.Delay. The error message is {e.Message}.");
			}
		}

	}
}
