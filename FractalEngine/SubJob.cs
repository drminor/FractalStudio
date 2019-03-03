using FractalServer;
using System;

namespace FractalEngine
{
	public class SubJob
	{
		public readonly MapSectionWorkRequest MapSectionWorkRequest;
		public readonly string ConnectionId;
		public readonly bool IsFinalSubJob;

		public SubJob(MapSectionWorkRequest mapSectionWorkRequest, string connectionId, bool isFinalSubJob)
		{
			MapSectionWorkRequest = mapSectionWorkRequest ?? throw new ArgumentNullException(nameof(mapSectionWorkRequest));
			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
			IsFinalSubJob = isFinalSubJob;
		}
	}
}
