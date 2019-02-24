using FractalServer;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FractalEngine
{
	public class Job
	{
		private int _jobId;
		public readonly MapWorkRequest MapWorkRequest;
		public readonly IClient Client;

		private int _nextResultCntr;

		public Job(MapWorkRequest mapWorkRequest, IClient client)
		{
			MapWorkRequest = mapWorkRequest ?? throw new ArgumentNullException(nameof(mapWorkRequest));
			Client = client ?? throw new ArgumentNullException(nameof(client));
			_jobId = -1;

			_nextResultCntr = 0;
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

		public SubJob GetNextResult()
		{
			SubJob result;

			if (100 == _nextResultCntr)
			{
				result = null;
			}
			else
			{
				MapInfo mapInfo = new MapInfo(MapWorkRequest.Coords, MapWorkRequest.MaxIterations);
				Rectangle canvas = new Rectangle(_nextResultCntr, 0, MapWorkRequest.CanvasSize.Width, MapWorkRequest.CanvasSize.Height);

				MapSectionWorkRequest mswr = new MapSectionWorkRequest(mapInfo, canvas);

				result = new SubJob(mswr, Client);
				_nextResultCntr++;
			}
			return result;
		}

	}
}
