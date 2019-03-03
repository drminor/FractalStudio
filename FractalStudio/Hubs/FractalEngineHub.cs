using Microsoft.AspNetCore.SignalR;

namespace FractalStudio.Hubs
{
  /// <summary>
  /// Defines methods available to our JavaScript clients.
  /// See the FractalEngineClient class for methods to send data to the client, unsolicited.
  /// </summary>
  public class FractalEngineHub : Hub
  {
    #region Methods called by our clients

    /// <summary>
    /// Sends the "Send" message to all clients with the specified message.
    /// </summary>
    /// <param name="message"></param>
    public void Echo(string message)
    {
      Clients.All.SendAsync("Send", message);
    }

    /// <summary>
    /// Send the "ConnId" message to the caller with the ConnectionId in use by the caller.
    /// </summary>
    public void RequestConnId()
    {
      Clients.Caller.SendAsync("ConnId", Context.ConnectionId);
    }

    #endregion
  }
}
