using Microsoft.AspNetCore.Hosting;
using System;
using System.Collections.Generic;
using System.Text;


using Microsoft.AspNetCore.Hosting.WindowsServices;

namespace FracWinService
{
	public class MyWebHostService : WebHostService
	{
		public MyWebHostService(IWebHost host) : base(host)
		{
		}

		protected override void OnStarting(string[] args)
		{
			System.Diagnostics.Debugger.Launch();
			base.OnStarting(args);
		}

		protected override void OnStarted()
		{
			base.OnStarted();
		}

		protected override void OnStopping()
		{
			base.OnStopping();
		}
	}
}
