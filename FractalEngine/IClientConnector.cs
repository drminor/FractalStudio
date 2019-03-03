using FractalServer;

namespace FractalEngine
{
	public interface IClientConnector
	{
		int ReceiveImageData(string connectionId, MapSectionResult mapSectionResult, bool isFinalSection);

		void ConfirmJobCancel(string connectionId, int jobId);
	}
}