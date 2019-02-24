using System.Threading.Tasks;

namespace FractalStudio.Hubs
{
  public interface IFractalEngineHub
  {
    Task Echo(string message);
    Task ImageData(int data);
    Task RequestConnId();
    Task ConnId(string connId);
  }
}
