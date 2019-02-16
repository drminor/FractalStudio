using FractalServer;
using Microsoft.AspNetCore.Mvc;
using FractalStudio.ActionResults;

using Microsoft.AspNetCore.Mvc.Formatters;


namespace FractalStudio.Controllers
{

  [Route("api/[controller]")]
  [ApiController]
  public class MRenderController : ControllerBase
  {

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
    public IActionResult Post([FromBody] Coords value)
    {
      //this.DPoint = value.LeftBot;
      //value.LeftBot.X = 10.3;

      value.RightTop.Y = 10.4;
      //value.Y = 10.3;

      return Ok(value); // new JsonResult(value);
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
