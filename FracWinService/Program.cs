using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.WindowsServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FracWinService
{
	public class Program
	{
		//public static void Main(string[] args)
		//{
		//	CreateWebHostBuilder(args).Build().Run();
		//}

		//public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
		//	WebHost.CreateDefaultBuilder(args)
		//		.UseStartup<Startup>();

		public static void Main(string[] args)
		{
			string pathToContentRoot;

			bool isService = !(Debugger.IsAttached || args.Contains("--console"));
			if (isService)
			{
				string pathToExe = Process.GetCurrentProcess().MainModule.FileName;
				pathToContentRoot = Path.GetDirectoryName(pathToExe);
			}
			else
			{
				pathToContentRoot = Directory.GetCurrentDirectory();
			}

			string[] webHostArgs = args.Where(arg => arg != "--console").ToArray();
			IWebHost host = WebHost.CreateDefaultBuilder(webHostArgs)
				.UseContentRoot(pathToContentRoot)
				.UseStartup<Startup>()
				.Build();

			if (isService)
			{
				host.RunAsService();
			}
			else
			{
				host.Run();
			}

		}
	}
}
