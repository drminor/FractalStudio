using Experimental.System.Messaging;
using FSTypes;
using MqMessages;
using System;
using System.Diagnostics;

namespace FractalEngine
{
	public class CoordsMath
	{
		public const string OUTPUT_Q_PATH = @".\private$\FGenJobs";
		public const string INPUT_COORDS_Q_PATH = @".\private$\FCoordResults";
		public static TimeSpan DefaultWaitDuration = TimeSpan.FromSeconds(10);

		private int _nextJobId;

		public CoordsMath()
		{
			WaitDuration = DefaultWaitDuration;
			_nextJobId = -1;
		}

		public TimeSpan WaitDuration { get; set; }

		public SCoords DoOp(SCoordsWorkRequest sCoordsWorkRequest)
		{
			FJobRequest fJobRequest = CreateFJobRequest(sCoordsWorkRequest, ++_nextJobId);
			string requestMsgId = SendJobToMq(fJobRequest);

			SCoords result = GetResponseFromMq(requestMsgId);
			return result;
		}

		private SCoords GetResponseFromMq(string requestMsgId)
		{
			using (MessageQueue inQ = GetJobResponseQueue())
			{
				Message m = MqHelper.GetMessageByCorId(inQ, requestMsgId, WaitDuration);

				if (m == null)
				{
					Debug.WriteLine("The FCoordsResult did not arrive.");
					return null;
				}

				Debug.WriteLine("Received a message.");
				FCoordsResult jobResult = (FCoordsResult)m.Body;

				MqMessages.Coords coords = jobResult.Coords;
				
				SPoint leftBot = new SPoint(coords.StartX, coords.StartY);
				SPoint rightTop = new SPoint(coords.EndX, coords.EndY);
				SCoords result = new SCoords(leftBot, rightTop);

				return result;
			}
		}

		private MessageQueue GetJobResponseQueue()
		{
			Type[] rTtypes = new Type[] { typeof(FCoordsResult) };

			MessagePropertyFilter mpf = new MessagePropertyFilter
			{
				Body = true,
				//Id = true,
				CorrelationId = true
			};

			MessageQueue result = MqHelper.GetQ(INPUT_COORDS_Q_PATH, QueueAccessMode.Receive, rTtypes, mpf);
			return result;
		}


		private string SendJobToMq(FJobRequest fJobRequest)
		{
			using (MessageQueue outQ = MqHelper.GetQ(OUTPUT_Q_PATH, QueueAccessMode.Send, null, null))
			{
				Debug.WriteLine($"Sending request with JobId {fJobRequest.JobId} to output Q.");

				Message m = new Message(fJobRequest);
				outQ.Send(m);

				return m.Id;
			}
		}

		private FJobRequest CreateFJobRequest(SCoordsWorkRequest sCoordsWorkRequest, int jobId)
		{
			SCoords sCoords = sCoordsWorkRequest.SCoords;
			MqMessages.Coords coords = new MqMessages.Coords(sCoords.LeftBot.X, sCoords.RightTop.X, sCoords.LeftBot.Y, sCoords.RightTop.Y);

			CanvasSize cs = sCoordsWorkRequest.CanvasSize;
			SizeInt samplePoints = new SizeInt(cs.Width, cs.Height);

			MapSection ms = sCoordsWorkRequest.MapSection;

			RectangleInt area = new RectangleInt(new PointInt(ms.SectionAnchor.X, ms.SectionAnchor.Y), new SizeInt(ms.CanvasSize.Width, ms.CanvasSize.Height));

			string name = "CoordsRequest";
			FJobRequest fJobRequest = new FJobRequest(jobId, name, FJobRequestType.TransformCoords, coords, area, samplePoints, 0, sCoordsWorkRequest.TransformType);

			return fJobRequest;
		}

	}
}
