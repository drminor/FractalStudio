using FractalServer;

namespace FractalEngine
{
	public interface IClientConnector
	{
		int ReceiveImageData(string connectionId, MapSection mapSection, double[] data);
	}
}