using FractalServer;
using System;

namespace FractalEngine
{
	public class SubJob
	{
		public readonly IJob ParentJob;
		public readonly MapSectionWorkRequest MapSectionWorkRequest;
		//public readonly MapSectionWorkRequest<Qd> MapSectionWorkRequestQd;

		public readonly string ConnectionId;

		public MapSectionResult result;

		//public readonly bool IsQd;

		public SubJob(IJob parentJob, MapSectionWorkRequest mapSectionWorkRequest, string connectionId)
		{
			ParentJob = parentJob ?? throw new ArgumentNullException(nameof(parentJob));
			MapSectionWorkRequest = mapSectionWorkRequest ?? throw new ArgumentNullException(nameof(mapSectionWorkRequest));
			//MapSectionWorkRequestQd = null;
			//IsQd = false;
			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
			result = null;
		}

		//public SubJob(IJob parentJob, MapSectionWorkRequest<Qd> mapSectionWorkRequestQd, string connectionId)
		//{
		//	ParentJob = parentJob ?? throw new ArgumentNullException(nameof(parentJob));
		//	MapSectionWorkRequest = null;
		//	MapSectionWorkRequestQd = mapSectionWorkRequestQd ?? throw new ArgumentNullException(nameof(mapSectionWorkRequestQd));
		//	IsQd = true;
		//	ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
		//	result = null;
		//}
	}
}
