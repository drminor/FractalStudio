using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FractalStudio.Hubs
{
  public class EchoHub : Hub
  {
    //you're going to invoke this method from the client app
    public void Echo(string message)
    {
      //you're going to configure your client app to listen for this
      Clients.All.SendAsync("Send", message);
    }

    public void RequestConnId()
    {
      Clients.Caller.SendAsync("ConnId", Context.ConnectionId);
    }

    ///// <summary>
    ///// Context instance to access client connections to broadcast to
    ///// </summary>
    //public static IHubContext<EchoHub> HubContext
    //{
    //  get
    //  {
    //    if (_context == null)
    //      _context = GlobalHost.ConnectionManager.GetHubContext<EchoHub>();

    //    return _context;
    //  }
    //}
    //static IHubContext<EchoHub> _context = null;

  }
}
