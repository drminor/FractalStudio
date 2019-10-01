using FractalEngine;
using FSTypes;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace FractalStudio.Controllers
{

  [Route("api/[controller]")]
  [ApiController]
  public class HistogramController : ControllerBase
  {
    private readonly Engine _engine;

    public HistogramController(Engine engine)
    {
      _engine = engine;
    }

    // GET: api/Historgram/5
    [HttpGet("{id}")]
    public IActionResult Get(int id)
    {
      return Ok();
    }

    // POST: api/Historgram
    [HttpPost]
    public IActionResult Post([FromBody] Histogram historgram)
    {
      int jobId = historgram.JobId;
      IDictionary<int, int> hDictionary = _engine.GetHistogram(jobId);
      Histogram result = new Histogram(jobId, hDictionary);
      return Ok(result);
    }

    // PUT: api/Historgram/5
    [HttpPut("{id}")]
    public void Put(int id, [FromBody] string value)
    {
    }

    // DELETE: api/Historgram/5
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
      return Ok();
    }
  }

}
