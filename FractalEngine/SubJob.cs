using FractalServer;
using FSTypes;
using System;
using System.Diagnostics;

namespace FractalEngine
{
	public class SubJob
	{
		public SubJob(IJob parentJob, MapSectionWorkRequest mapSectionWorkRequest, string connectionId)
		{
			ParentJob = parentJob ?? throw new ArgumentNullException(nameof(parentJob));
			MapSectionWorkRequest = mapSectionWorkRequest ?? throw new ArgumentNullException(nameof(mapSectionWorkRequest));
			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
			//WorkResult = null;
			MapSectionResult = null;
		}

		public readonly IJob ParentJob;
		public readonly MapSectionWorkRequest MapSectionWorkRequest;
		public readonly string ConnectionId;

		//public MapSectionWorkResult WorkResult;

		public MapSectionResult MapSectionResult;

		//private MapSectionResult _mapSectionResult;
		//public MapSectionResult MapSectionResult
		//{
		//	get
		//	{
		//		if(_mapSectionResult != null)
		//		{
		//			return _mapSectionResult;
		//		}
		//		else
		//		{
		//			return BuildMapSectionResult();
		//		}
		//	}
		//	set
		//	{
		//		_mapSectionResult = value;
		//	}
		//}

		//private MapSectionResult BuildMapSectionResult()
		//{
		//	int[] counts;
		//	if (WorkResult == null)
		//	{
		//		throw new InvalidOperationException("Cannot build a MapSectionResult -- the MapSectionWorkResult is null.");
		//	}
		//	else
		//	{
		//		counts = WorkResult.Counts;
		//	}

		//	MapSectionResult result = new MapSectionResult(ParentJob.JobId, MapSectionWorkRequest.MapSection, counts);
		//	return result;
		//}
	}
}
