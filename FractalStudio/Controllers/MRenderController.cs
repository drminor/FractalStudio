using FractalServer;
using Microsoft.AspNetCore.Mvc;


using FractalEngine;
using Microsoft.AspNetCore.SignalR;
using FractalStudio.Hubs;

namespace FractalStudio.Controllers
{

  [Route("api/[controller]")]
  [ApiController]
  public class MRenderController : ControllerBase
  {
    private readonly Engine _engine;
    private readonly IHubContext<EchoHub> _hubContext;

    public MRenderController(Engine engine, IHubContext<EchoHub> hubContext)
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
      //Client client = new Client("Test", connectionId, x => _hubContext.C.lients.Client(connectionId).SendAsync("Send", x.ToString()) );

      //Client client = new Client("Test", connectionId, (connId, x) => {
      //  _hubContext.Clients.All.SendAsync("Send", x.ToString());
      //  });

      FractalEngineClient client = new FractalEngineClient(_hubContext, mapWorkRequest.ConnectionId);
      
      Job job = new Job(mapWorkRequest, client);

      int jobId = _engine.SubmitJob(job);

      mapWorkRequest.Coords.RightTop.Y = _engine.NumberOfJobs;

      return Ok(mapWorkRequest); // new JsonResult(value);
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
    }
  }
}
