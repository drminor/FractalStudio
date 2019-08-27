using FractalServer;
using System;

namespace FractalEngine
{
	public class JobBase : IJob
	{
		private int _jobId;

		#region Constructor

		public JobBase(SMapWorkRequest sMapWorkRequest, string connectionId)
		{
			SMapWorkRequest = sMapWorkRequest ?? throw new ArgumentNullException(nameof(sMapWorkRequest));

			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
			_jobId = -1;

			CancelRequested = false;
			IsLastSubJob = false;
		}

		#endregion

		#region Public Properties

		public SMapWorkRequest SMapWorkRequest { get; private set; }

		public string ConnectionId { get; private set; }

		public int MaxIterations => SMapWorkRequest.MaxIterations;

		public bool CancelRequested { get; set; }
		public bool IsCompleted { get; protected set; }
		public bool IsLastSubJob { get; protected set; }

		public int JobId
		{
			get { return _jobId; }
			set
			{
				if (value == -1) throw new ArgumentException("-1 cannot be used as a JobId.");
				if (_jobId != -1) throw new InvalidOperationException("The JobId cannot be set once it has already been set.");

				_jobId = value;
			}
		}

		public bool RequiresQuadPrecision() => SMapWorkRequest.RequiresQuadPrecision();

		#endregion
	}
}
