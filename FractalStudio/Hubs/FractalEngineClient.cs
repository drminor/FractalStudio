using FractalEngine;
using FractalServer;
using Microsoft.AspNetCore.SignalR;
using System;

namespace FractalStudio.Hubs
{
  public class FractalEngineClient : IClientConnector
  {
    private readonly IHubContext<FractalEngineHub> _hubContext;

    private readonly object Lo = new object();

    public FractalEngineClient(IHubContext<FractalEngineHub> hubContext)
    {
      _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
    }

    public void ConfirmJobCancel(string connectionId, int jobId)
    {
      _hubContext.Clients.Client(connectionId).SendAsync("JobCancelled", jobId);
    }

    public void ReceiveImageData(string connectionId, MapSectionResult mapSectionResult, bool isFinalSection)
    {
      //lock (Lo)
      //{

      //  _hubContext.Clients.Client(connectionId).SendAsync("ImageData", mapSectionResult, isFinalSection).Wait();
      //  System.Threading.Thread.Sleep(200);
      //}

      _hubContext.Clients.Client(connectionId).SendAsync("ImageData", mapSectionResult, isFinalSection).Wait();

    }

  }
}
