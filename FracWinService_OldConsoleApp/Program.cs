﻿using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FracWinService
{
	class Program
	{


		public static void Main(string[] args)
		{
			var isService = !(Debugger.IsAttached || args.Contains("--console"));

			if (isService)
			{
				var pathToExe = Process.GetCurrentProcess().MainModule.FileName;
				var pathToContentRoot = Path.GetDirectoryName(pathToExe);
				Directory.SetCurrentDirectory(pathToContentRoot);
			}

			var builder = CreateWebHostBuilder(
				args.Where(arg => arg != "--console").ToArray());

			var host = builder.Build();

			if (isService)
			{
				// To run the app without the CustomWebHostService change the
				// next line to host.RunAsService();
				host.RunAsCustomService();
			}
			else
			{
				host.Run();
			}
		}

		public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
			WebHost.CreateDefaultBuilder(args)
				//.ConfigureLogging((hostingContext, logging) =>
				//{
				//	logging.AddEventLog();
				//})
				.ConfigureAppConfiguration((context, config) =>
				{
				// Configure the app here.
			})
				.UseStartup<SignalRStartup>();

		//private static async Task Main(string[] args)
		//{

		//	var wBuilder = new WebHostBuilder();

		//	wBuilder.ConfigureServices((hostContext, services) =>
		//	{
		//		var sigR = services.AddSignalRCore();

		//	});

		//	var builder = new HostBuilder()
		//		.ConfigureServices((hostContext, services) =>
		//		{
		//			services.AddHostedService<FileWriterService>();
		//		});

		//	bool isService = !(Debugger.IsAttached || args.Contains("--console"));

		//	if (isService)
		//	{
		//		CancellationToken ct = new CancellationToken();
		//		await builder.RunAsServiceAsync(ct);
		//	}
		//	else
		//	{
		//		await builder.RunConsoleAsync();
		//	}
		//}
	}
}