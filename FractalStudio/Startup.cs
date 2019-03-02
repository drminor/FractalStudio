using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FractalEngine;
using FractalStudio.Hubs;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FractalStudio
{
  public class Startup
  {
    public Startup(IConfiguration configuration)
    {
      Configuration = configuration;
    }

    public IConfiguration Configuration { get; }

    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {
      var mvc = services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);

      mvc.AddJsonOptions(options =>
      {
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.DefaultContractResolver();
        options.SerializerSettings.Formatting = Newtonsoft.Json.Formatting.Indented;
        options.SerializerSettings.ConstructorHandling = Newtonsoft.Json.ConstructorHandling.AllowNonPublicDefaultConstructor;
      });


      services.AddSignalR().AddMessagePackProtocol();
      //services.AddSignalR();

      services.AddSingleton(new Engine());
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IHostingEnvironment env)
    {
      if (env.IsDevelopment())
      {
        app.UseDeveloperExceptionPage();
      }
      else
      {
        app.UseHsts();
      }

      app.UseDefaultFiles();
      app.UseStaticFiles();
      app.UseHttpsRedirection();
      app.UseMvc();

      // Start our Fractal [generation] engine
      // using a client connector (which wraps an instance of the Echo Hub context.)
      var hub = app.ApplicationServices.GetRequiredService<IHubContext<EchoHub>>();
      IClientConnector clientConnector = new FractalEngineClient(hub);

      var engine = app.ApplicationServices.GetRequiredService<Engine>();
      engine.Start(clientConnector);

      // If you're using the SPA template, this should come before app.UseSpa(...);
      app.UseSignalR(routes =>
      {
        routes.MapHub<EchoHub>("/hubs/echo");
      });

    }
  }
}
