using FSTypes;
using System;

namespace FractalEngine
{
	public class SubJob
	{
		public readonly IJob ParentJob;
		public readonly MapSectionWorkRequest MapSectionWorkRequest;

		public readonly string ConnectionId;

		public MapSectionResult result;

		public SubJob(IJob parentJob, MapSectionWorkRequest mapSectionWorkRequest, string connectionId)
		{
			ParentJob = parentJob ?? throw new ArgumentNullException(nameof(parentJob));
			MapSectionWorkRequest = mapSectionWorkRequest ?? throw new ArgumentNullException(nameof(mapSectionWorkRequest));
			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
			result = null;
		}

	}
}
