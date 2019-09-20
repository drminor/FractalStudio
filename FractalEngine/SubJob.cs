using FractalServer;
using FSTypes;
using System;
using System.Diagnostics;

namespace FractalEngine
{
	public class SubJob
	{
		public readonly IJob ParentJob;
		public readonly MapSectionWorkRequest MapSectionWorkRequest;

		public readonly string ConnectionId;

		public MapSectionWorkResult workResult;

		public SubJob(IJob parentJob, MapSectionWorkRequest mapSectionWorkRequest, string connectionId)
		{
			ParentJob = parentJob ?? throw new ArgumentNullException(nameof(parentJob));
			MapSectionWorkRequest = mapSectionWorkRequest ?? throw new ArgumentNullException(nameof(mapSectionWorkRequest));
			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
			workResult = null;
		}

		public MapSectionResult BuildMapSectionResult()
		{
			int[] counts;
			if (workResult == null)
			{
				//throw new InvalidOperationException("Cannot build a MapSectionResult -- the MapSectionWorkResult is null.");
				Debug.WriteLine("Warning the MapSectionWorkResult is null. Returning empty count values.");
				// TODO: Create a zero-filled array of ints
				counts = new int[0];
			}
			else
			{
				counts = workResult.Counts;
			}

			MapSectionResult tResult = new MapSectionResult(ParentJob.JobId, MapSectionWorkRequest.MapSection, counts);
			return tResult;
		}
	}
}
