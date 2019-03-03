using FractalEngine;
using FractalServer;
using Microsoft.AspNetCore.SignalR;
using System;

namespace FractalStudio.Hubs
{
  public class FractalEngineClient : IClientConnector
  {
    private readonly IHubContext<FractalEngineHub> _hubContext;

    public FractalEngineClient(IHubContext<FractalEngineHub> hubContext)
    {
      _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
    }

    public void ConfirmJobCancel(string connectionId, int jobId)
    {
      _hubContext.Clients.Client(connectionId).SendAsync("JobCancelled", jobId);
    }

    public int ReceiveImageData(string connectionId, MapSectionResult mapSectionResult, bool isFinalSection)
    {
      _hubContext.Clients.Client(connectionId).SendAsync("ImageData", mapSectionResult, isFinalSection);
      return 0;
    }

  }
}
