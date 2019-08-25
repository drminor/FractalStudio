namespace FractalEngine
{
	public interface IJob
	{
		int JobId { get; set; }
		string ConnectionId { get; }
		bool CancelRequested { get; set; }

		bool RequiresQuadPrecision();
	}
}