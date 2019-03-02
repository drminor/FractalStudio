using FractalServer;
using System;

namespace FractalEngine
{
	public class SubJob
	{
		public readonly MapSectionWorkRequest MapSectionWorkRequest;
		public readonly string ConnectionId;

		public SubJob(MapSectionWorkRequest mapSectionWorkRequest, string connectionId)
		{
			MapSectionWorkRequest = mapSectionWorkRequest ?? throw new ArgumentNullException(nameof(mapSectionWorkRequest));
			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
		}
	}
}
