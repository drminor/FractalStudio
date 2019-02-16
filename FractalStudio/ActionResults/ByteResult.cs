using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Net;
using System.Threading.Tasks;

namespace FractalStudio.ActionResults
{
  public class ByteResult : IActionResult
  {
    private const string CONTENT_TYPE = "application/octet-stream";
    private readonly byte[] _data;

    public ByteResult(byte[] data)
    {
      _data = data;
    }

    public Task ExecuteResultAsync(ActionContext context)
    {
      context.HttpContext.Response.StatusCode = (int)HttpStatusCode.OK;
      context.HttpContext.Response.Body = FromByte(_data);
      context.HttpContext.Response.ContentType = CONTENT_TYPE;

      return Task.FromResult(context.HttpContext.Response);

      //Stream exportStream = FromByte(_data);
      //return new FileStreamResult(exportStream, CONTENT_TYPE);
    }

    private Stream FromByte(byte[] x)
    {
      MemoryStream memoryStream = new MemoryStream(x)
      {
        Position = 0
      };

      return memoryStream;
    }
  }
}
