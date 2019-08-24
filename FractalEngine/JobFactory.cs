using FractalServer;
using System;

namespace FractalEngine
{
	public class JobFactory
	{
		const double tiny = 1e-10;

		public IJob CreateJob(SMapWorkRequest sMapWorkRequest, string connectionId)
		{
			QdCoords qdCoords = new QdCoords(sMapWorkRequest.SCoords);

			double lbx = qdCoords.LeftBot.X.Hi;
			double rtx = qdCoords.RightTop.X.Hi;

			if(Math.Abs(rtx - lbx) < tiny)
			{
				return new JobQd(sMapWorkRequest, connectionId);
			}

			double lby = qdCoords.LeftBot.Y.Hi;
			double rty = qdCoords.RightTop.Y.Hi;

			if (Math.Abs(rty - lby) < tiny)
			{
				return new JobQd(sMapWorkRequest, connectionId);
			}

			return new Job(sMapWorkRequest, connectionId);
		}
	}
}
