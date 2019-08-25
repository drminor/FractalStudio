using FractalServer;
using System;

namespace FractalEngine
{
	public class JobBase : IJob
	{
		private int _jobId;
		public readonly SMapWorkRequest SMapWorkRequest;

		#region Constructor

		public JobBase(SMapWorkRequest sMapWorkRequest, string connectionId)
		{
			SMapWorkRequest = sMapWorkRequest ?? throw new ArgumentNullException(nameof(sMapWorkRequest));

			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
			_jobId = -1;

			CancelRequested = false;
		}

		#endregion

		#region Public Properties

		public string ConnectionId { get; private set; }

		public int MaxIterations => SMapWorkRequest.MaxIterations;

		public bool CancelRequested { get; set; }

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

		public bool RequiresQuadPrecision() => SMapWorkRequest.RequiresDoublePrecision();

		#endregion
	}
}
