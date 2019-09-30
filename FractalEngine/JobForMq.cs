﻿using FSTypes;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FractalEngine
{
	public class JobForMq : JobBase
	{
		public JobForMq(SMapWorkRequest sMapWorkRequest) : base(sMapWorkRequest)
		{
		}

		public string MqRequestCorrelationId { get; set; }

		public Tuple<Task, CancellationTokenSource> ListenerTask { get; set; }

		public void MarkAsCompleted()
		{
			IsCompleted = true;
		}

		public void SetIsLastSubJob(bool val)
		{
			IsLastSubJob = val;
		}
	}
}