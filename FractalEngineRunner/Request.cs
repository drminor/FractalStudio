using MqMessages;

namespace FractalEngineRunner
{
	class Request
	{
		public readonly int JobId;
		public readonly FJobRequestType RequestType;
		public readonly TransformType? TransformType;
		public readonly int Amount;

		public Request(int jobId, FJobRequestType requestType, TransformType? transformType, int amount)
		{
			JobId = jobId;
			RequestType = requestType;
			TransformType = transformType;
			Amount = amount;
		}

	}
}
