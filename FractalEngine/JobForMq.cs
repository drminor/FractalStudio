using FractalServer;

namespace FractalEngine
{
	public class JobForMq : JobBase
	{
		public JobForMq(SMapWorkRequest sMapWorkRequest, string connectionId) : base(sMapWorkRequest, connectionId)
		{
		}
	}
}
