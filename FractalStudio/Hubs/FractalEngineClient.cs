using FractalEngine;
using FractalServer;
using Microsoft.AspNetCore.SignalR;
using System;

namespace FractalStudio.Hubs
{
  public class FractalEngineClient : IClientConnector
  {
    private readonly IHubContext<EchoHub> _hubContext;

    public FractalEngineClient(IHubContext<EchoHub> hubContext)
    {
      _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
    }

    public int ReceiveImageData(string connectionId, MapSection mapSection, double[] imageData)
    {
      _hubContext.Clients.Client(connectionId).SendAsync("ImageData", mapSection, imageData);
      return 0;
    }

  }
}
