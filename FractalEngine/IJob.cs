using FractalServer;

namespace FractalEngine
{
	public interface IJob
	{
		int JobId { get; set; }
		SMapWorkRequest SMapWorkRequest { get; }
		string ConnectionId { get; }
		bool CancelRequested { get; set; }
		bool IsCompleted { get; }
		bool IsLastSubJob { get; }

		bool RequiresQuadPrecision();
	}
}