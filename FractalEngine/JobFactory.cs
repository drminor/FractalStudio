using FractalServer;

namespace FractalEngine
{
	public class JobFactory
	{
		public IJob CreateJob(SMapWorkRequest sMapWorkRequest)
		{
			IJob result;

			if (sMapWorkRequest.RequiresQuadPrecision())
			{
				result = new JobForMq(sMapWorkRequest);
			}
			else
			{
				result = new Job(sMapWorkRequest);
			}

			return result;
		}
	}
}
