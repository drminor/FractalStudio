using FractalServer;

namespace FractalEngine
{
	public class JobForMq : JobBase
	{
		public JobForMq(SMapWorkRequest sMapWorkRequest, string connectionId) : base(sMapWorkRequest, connectionId)
		{
		}

		public void MarkAsCompleted()
		{
			IsCompleted = true;
		}

		public void SetIsLastSubJob(bool val)
		{
			IsLastSubJob = val;
		}
	}
}
