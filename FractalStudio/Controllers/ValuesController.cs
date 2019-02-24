using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FractalEngine;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace FractalStudio.Controllers
{

  public class Cat
  {
    public Cat(string name)
    {
      Name = name;
    }

    [JsonProperty("name")]
    public string Name { get; set; }
  }


  [Route("api/[controller]")]
  [ApiController]
  public class ValuesController : ControllerBase
  {

    private readonly Engine Engine;

    public ValuesController(Engine engine)
    {
      Engine = engine;
    }


    // GET api/values
    [HttpGet]
    public ActionResult<IEnumerable<string>> Get()
    {
      return new string[] { "value1", "value2" };
    }

    // GET api/values/5
    [HttpGet("{name}")]
    public ActionResult<Cat> Get(string name)
    {
      //Job dummy = new Job(null, null);
      //Engine.SubmitJob(dummy);

      ////return $"There are now {Engine.NumberOfJobs} jobs.";
      //string n = $"There are now {Engine.NumberOfJobs} jobs.";
      return new Cat(name);
    }

    // POST api/values
    [HttpPost]
    public void Post([FromBody] string value)
    {
    }

    // PUT api/values/5
    [HttpPut("{id}")]
    public void Put(int id, [FromBody] string value)
    {
    }

    // DELETE api/values/5
    [HttpDelete("{id}")]
    public void Delete(int id)
    {
    }
  }
}
