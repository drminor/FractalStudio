using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
//using Microsoft.AspNetCore.HttpsPolicy;
//using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Microsoft.AspNetCore.SignalR;


namespace FracWinService
{
	public class SignalRStartup
	{
		public SignalRStartup(IConfiguration configuration)
		{
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services)
		{
			services.AddMvc();
			var sr = services.AddSignalRCore();
			
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
				//app.UseHsts();
			}


			app.UseMvc();
			app.
			//app  .UseSignalR((configure) =>
			//{
			//	var desiredTransports =
			//		HttpTransportType.WebSockets |
			//		HttpTransportType.LongPolling;

			//	configure.MapHub<MyHub>("/myhub", (options) =>
			//	{
			//		options.Transports = desiredTransports;
			//	});
			//});

		}
	}
}
