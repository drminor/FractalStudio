using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.SignalR;

namespace FractalStudio.Hubs
{
  public class FractalEngineHub : Hub<IFractalEngineHub>
  {
    //you're going to invoke this method from the client app
    public async Task SendEcho(string message)
    {
      await Clients.All.Echo(message);
    }

    public async Task SendConnId()
    {
      string connectionId = Context.ConnectionId;
      await Clients.Caller.ConnId(connectionId);
    }

    public async Task SendImageData(string connId, int data)
    {
      await Clients.Client(connId).ImageData(data);
    }

  }
}
