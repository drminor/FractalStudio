using FractalEngine;
using FractalStudio.Hubs;
using FSTypes;
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

    //// GET: api/MRender
    //[HttpGet]
    //public IActionResult Get()
    //{
    //  byte[] ones = new byte[] { 65, 65, 65 };

    //  //return new ByteResult(ones);

    //  //return ones;
    //  return new FileContentResult(ones, "application/octet-stream");

    //}

    // GET: api/MRender/5
    [HttpGet("{id}")]
    public IActionResult Get(int id)
    {
      //_engine.CancelJob(id);
      return Ok();
    }

    // POST: api/MRender
    [HttpPost]
    public IActionResult Post([FromBody] SMapWorkRequest sMapWorkRequest)
    {
      if (sMapWorkRequest.ConnectionId.ToLower() == "delete")
      {
        bool deleteRepo = sMapWorkRequest.Name == "delJobAndRepo" ? true : false;
        _engine.CancelJob(sMapWorkRequest.JobId, deleteRepo);
      }
      else if(sMapWorkRequest.ConnectionId.ToLower() == "replay")
      {
        _engine.ReplayJob(sMapWorkRequest.JobId, sMapWorkRequest.MaxIterations);
      }
      else
      {
        IJob job = new JobFactory().CreateJob(sMapWorkRequest);
        int jobId = _engine.SubmitJob(job);
        sMapWorkRequest.JobId = jobId;
      }
      return Ok(sMapWorkRequest);
    }

    // PUT: api/MRender/5
    [HttpPut("{id}")]
    public void Put(int id, [FromBody] string value)
    {
    }

    // DELETE: api/MRender/5
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
      //_engine.CancelJob(id);
      return Ok();
    }

  }
}
