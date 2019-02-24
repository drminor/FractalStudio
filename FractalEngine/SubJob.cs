using FractalServer;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FractalEngine
{
	public class SubJob
	{
		private int _jobId;
		public readonly MapSectionWorkRequest MapSectionWorkRequest;
		public readonly IClient Client;

		public SubJob(MapSectionWorkRequest mapSectionWorkRequest, IClient client)
		{
			MapSectionWorkRequest = mapSectionWorkRequest ?? throw new ArgumentNullException(nameof(mapSectionWorkRequest));
			Client = client ?? throw new ArgumentNullException(nameof(client));
			_jobId = -1;
		}

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
	}
}
