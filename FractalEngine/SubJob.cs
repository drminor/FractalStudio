using FractalServer;
using System;

namespace FractalEngine
{
	public class SubJob
	{
		public readonly Job ParentJob;
		public readonly MapSectionWorkRequest MapSectionWorkRequest;
		public readonly string ConnectionId;
		//public bool IsFinalSubJob;

		public MapSectionResult result;

		public SubJob(Job parentJob, MapSectionWorkRequest mapSectionWorkRequest, string connectionId/*, bool isFinalSubJob*/)
		{
			ParentJob = parentJob ?? throw new ArgumentNullException(nameof(parentJob));
			MapSectionWorkRequest = mapSectionWorkRequest ?? throw new ArgumentNullException(nameof(mapSectionWorkRequest));
			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
			//IsFinalSubJob = isFinalSubJob;
			result = null;
		}
	}
}
