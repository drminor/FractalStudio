using FractalEngine;
using FractalServer;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace FractalStudio.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class TransformController : ControllerBase
  {
    // GET: api/Transform
    [HttpGet]
    public IEnumerable<string> Get()
    {
      return new string[] { "value1", "value2" };
    }

    // GET: api/Transform/5
    [HttpGet("{id}", Name = "Get")]
    public string Get(int id)
    {
      return "value";
    }

    // POST: api/Transform
    [HttpPost]
    public IActionResult Post([FromBody] SCoordsWorkRequest request)
    {
      CoordsMath coordsMath = new CoordsMath();
      SCoords result = coordsMath.DoOp(request);

      // Update the original request with the result coords.
      request.SCoords = result;

      // Return the updated request.
      return Ok(request);
    }

    // PUT: api/Transform/5
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
