using FractalEngine;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FractalStudio.Hubs
{
  public class FractalEngineClient : IClient
  {

    //private readonly string _userName;
    //private readonly Action<string, int> _callBack;

    private readonly IHubContext<EchoHub> _hubContext;
    private readonly string _connectionId;

    //public FractalEngineClient(string userName, string connectionId, Action<string, int> callBack)
    public FractalEngineClient(IHubContext<EchoHub> hubContext, string connectionId)
    {
      //_userName = userName ?? throw new ArgumentNullException(nameof(userName));
      //_connectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
      //_callBack = callBack;

      _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
      _connectionId = connectionId;
    }

    public int ReceiveImageData(int data)
    {
      //_callBack?.Invoke(_connectionId, data);

      _hubContext.Clients.Client(_connectionId).SendAsync("ImageData", data);
      return 0;
    }
  }
}
