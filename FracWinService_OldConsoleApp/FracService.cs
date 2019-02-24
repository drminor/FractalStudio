using System;
using System.Collections.Generic;
using System.ServiceProcess;
using System.Text;
using System.Threading;

namespace FracWinService
{
	public class FracService : ServiceBase
	{
		//MPWorkflowQueueController Controller { get; set; }
		IDisposable SignalR { get; set; }

		public void Start()
		{
			//Controller = new MPWorkflowQueueController(App.AdminConfiguration.ConnectionString);

			//var config = QueueMessageManagerConfiguration.Current;
			//Controller.QueueName = config.QueueName;
			//Controller.WaitInterval = config.WaitInterval;
			//Controller.ThreadCount = config.ControllerThreads;

			//SignalR = WebApp.Start<SignalRStartup>(App.AdminConfiguration.MonitorHostUrl);

			// Spin up the queue
			//Controller.StartProcessingAsync();

			//LogManager.Current.LogInfo(String.Format("QueueManager Controller Started with {0} threads.",
			//								Controller.ThreadCount));

			// Allow access to a global instance of this controller and service
			// So we can access it from the stateless SignalR hub
			//Globals.Controller = Controller;
			Globals.WindowsService = this;
		}

		public new void Stop()
		{
			//LogManager.Current.LogInfo("QueueManager Controller Stopped.");

			//Controller.StopProcessing();
			//Controller.Dispose();
			SignalR.Dispose();

			Thread.Sleep(1500);
		}


		/// <summary>
		/// Set things in motion so your service can do its work.
		/// </summary>
		protected override void OnStart(string[] args)
		{
			Start();
		}

		/// <summary>
		/// Stop this service.
		/// </summary>
		protected override void OnStop()
		{
			Stop();
		}

		protected override void Dispose(bool disposing)
		{
			base.Dispose(disposing);

			if (SignalR != null)
			{
				SignalR.Dispose();
				SignalR = null;
			}
		}
	}

	public static class Globals
	{
		//public static MPWorkflowQueueController Controller;
		public static FracService WindowsService;
	}
}
