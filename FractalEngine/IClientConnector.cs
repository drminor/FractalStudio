using FSTypes;

namespace FractalEngine
{
	public interface IClientConnector
	{
		void ReceiveImageData(string connectionId, MapSectionResult mapSectionResult, bool isFinalSection);

		void ConfirmJobCancel(string connectionId, int jobId);
	}
}