using FractalEngine;
using FractalServer;
using FractalStudio.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace FractalStudio.Controllers
{

  [Route("api/[controller]")]
  [ApiController]
  public class MRenderController : ControllerBase
  {
    private readonly Engine _engine;
    private readonly IHubContext<FractalEngineHub> _hubContext;

    public MRenderController(Engine engine, IHubContext<FractalEngineHub> hubContext)
    {
      _engine = engine;
      _hubContext = hubContext;
    }

    // GET: api/MRender
    [HttpGet]
    public IActionResult Get()
    {
      byte[] ones = new byte[] { 65, 65, 65 };

      //return new ByteResult(ones);

      //return ones;
      return new FileContentResult(ones, "application/octet-stream");

    }

    // GET: api/MRender/5
    [HttpGet("{id}", Name = "Get")]
    public string Get(int id)
    {
      return "value";
    }

    // POST: api/MRender
    [HttpPost]
    public IActionResult Post([FromBody] MapWorkRequest mapWorkRequest)
    {
      SCoords sCoords = new SCoords(mapWorkRequest.Coords);

      SMapWorkRequest sMapWorkRequest = new SMapWorkRequest(sCoords, mapWorkRequest.MaxIterations, mapWorkRequest.CanvasSize, mapWorkRequest.ConnectionId);

      //JobFactory jobFactory = new JobFactory();
      //IJob job = jobFactory.CreateJob(sMapWorkRequest, sMapWorkRequest.ConnectionId);

      IJob job;

      if(sMapWorkRequest.RequiresQuadPrecision())
      {
        job = new JobForMq(sMapWorkRequest, sMapWorkRequest.ConnectionId);
      }
      else
      {
        job = new Job(sMapWorkRequest, sMapWorkRequest.ConnectionId);
      }

      int jobId = _engine.SubmitJob(job);
      mapWorkRequest.JobId = jobId;

      return Ok(mapWorkRequest);
    }

    // PUT: api/MRender/5
    [HttpPut("{id}")]
    public void Put(int id, [FromBody] string value)
    {
    }

    // DELETE: api/ApiWithActions/5
    [HttpDelete("{id}")]
    public void Delete(int id)
    {
      _engine.CancelJob(id);
    }

  }
}
