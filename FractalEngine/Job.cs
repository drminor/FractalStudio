using CountsRepo;
using FractalServer;
using FSTypes;
using MqMessages;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using Coords = FSTypes.Coords;

namespace FractalEngine
{
	public class Job : JobBase, IDisposable
	{
		public const int SECTION_WIDTH = 100;
		public const int SECTION_HEIGHT = 100;

		private readonly SamplePoints<double> _samplePoints;

		private int _hSectionPtr;
		private int _vSectionPtr;
		private int _numberOfSectionRemainingToSend;

		private ValueRecords<RectangleInt, MapSectionWorkResult> _countsRepo;
		private readonly object _repoLock = new object();

		public Job(SMapWorkRequest sMapWorkRequest) : base(sMapWorkRequest)
		{
			_samplePoints = GetSamplePoints(sMapWorkRequest);
			_hSectionPtr = 0;
			_vSectionPtr = 0;

			IsCompleted = false;
			_numberOfSectionRemainingToSend = _samplePoints.NumberOfHSections * _samplePoints.NumberOfVSections;

			string filename = RepoFilename;
			Debug.WriteLine($"Creating new Repo. Name: {filename}, JobId: {JobId}.");
			_countsRepo = new ValueRecords<RectangleInt, MapSectionWorkResult>(filename);
		}

		private const string DiagTimeFormat = "HH:mm:ss ffff";

		public void DeleteCountsRepo()
		{
			Debug.WriteLine($"Starting to delete the old repo: {RepoFilename} at {DateTime.Now.ToString(DiagTimeFormat)}.");
			if (_countsRepo != null)
			{
				_countsRepo.Dispose();
				_countsRepo = null;
			}

			ValueRecords<RectangleInt, MapSectionWorkResult>.DeleteRepo(RepoFilename);
			Debug.WriteLine($"Completed deleting the old repo: {RepoFilename} at {DateTime.Now.ToString(DiagTimeFormat)}.");
		}

		public void WriteWorkResult(MapSection key, MapSectionWorkResult val)
		{
			RectangleInt riKey = key.GetRectangleInt();
			// When writing include the Area's offset.
			riKey.Point.X += SMapWorkRequest.Area.SectionAnchor.X * SECTION_WIDTH;
			riKey.Point.Y += SMapWorkRequest.Area.SectionAnchor.Y * SECTION_HEIGHT;

			try
			{
				lock (_repoLock)
				{
					_countsRepo.Add(riKey, val, saveOnWrite: false);
				}
			}
			catch
			{
				Debug.WriteLine($"Could not write data for x: {riKey.Point.X} and y: {riKey.Point.Y}.");
			}
		}

		public bool CanReplayResults()
		{
			bool result = ValueRecords<RectangleInt, MapSectionWorkResult>.RepoExists(RepoFilename);
			return result;
		}

		public IEnumerable<Tuple<MapSectionResult, bool>> ReplayResults()
		{
			SubJob subJob = GetNextSubJob();

			while (subJob != null)
			{
				MapSectionResult msr = RetrieveWorkResultFromRepo(subJob);
				Tuple<MapSectionResult, bool> item = new Tuple<MapSectionResult, bool>(msr, IsLastSubJob);
				DecrementSubJobsRemainingToBeSent();

				subJob = GetNextSubJob();
				yield return item;
			}
		}

		public MapSectionResult RetrieveWorkResultFromRepo(SubJob subJob)
		{
			MapSection ms = subJob.MapSectionWorkRequest.MapSection;
			MapSectionWorkResult workResult = new MapSectionWorkResult(ms.CanvasSize.Width * ms.CanvasSize.Height, true, false);

			RectangleInt riKey = ms.GetRectangleInt();
			// When writing include the Area's offset.
			riKey.Point.X += SMapWorkRequest.Area.SectionAnchor.X * SECTION_WIDTH;
			riKey.Point.Y += SMapWorkRequest.Area.SectionAnchor.Y * SECTION_HEIGHT;

			lock (_repoLock)
			{
				if (_countsRepo.ReadParts(riKey, workResult))
				{
					MapSectionResult msr = CreateMapSectionResult(JobId, ms, workResult);
					return msr;
				}
				else
				{
					return null;
				}
			}
			//return null;
		}

		public MapSectionResult CreateMapSectionResult(int jobId, MapSection ms, MapSectionWorkResult workResult)
		{
			MapSectionResult result = new MapSectionResult(jobId, ms, workResult.Counts);
			return result;
		}

		private MapSectionWorkResult CreateEmptyResult(RectangleInt area)
		{
			MapSectionWorkResult result = new MapSectionWorkResult(area.Size.W * area.Size.H, false, false);
			return result;
		}

		public SubJob GetNextSubJob()
		{
			if (IsCompleted) return null;

			if (_hSectionPtr > _samplePoints.NumberOfHSections - 1)
			{
				_hSectionPtr = 0;
				_vSectionPtr++;

				if (_vSectionPtr > _samplePoints.NumberOfVSections - 1)
				{
					IsCompleted = true;
					return null;
				}
			}
			//System.Diagnostics.Debug.WriteLine($"Creating SubJob for hSection: {_hSectionPtr}, vSection: {_vSectionPtr}.");

			int left = _hSectionPtr * SECTION_WIDTH;
			int top = _vSectionPtr * SECTION_HEIGHT;

			MapSection mapSection = new MapSection(new Point(left, top), new CanvasSize(SECTION_WIDTH, SECTION_HEIGHT));

			double[] xValues = _samplePoints.XValueSections[_hSectionPtr++];
			double[] yValues = _samplePoints.YValueSections[_vSectionPtr];

			MapSectionWorkRequest mswr = new MapSectionWorkRequest(mapSection, MaxIterations, xValues, yValues);
			//Debug.WriteLine($"w: {w} h: {h} xLen: {xValues.Length} yLen: {yValues.Length}.");

			SubJob result = new SubJob(this, mswr, ConnectionId);

			return result;
		}

		/// <summary>
		/// Sets IsLastSubJob = true, if the number of sections remining to send reaches 0.
		/// </summary>
		public void DecrementSubJobsRemainingToBeSent()
		{
			int newVal = Interlocked.Decrement(ref _numberOfSectionRemainingToSend);
			if (newVal == 0)
			{
				IsLastSubJob = true;
			}
		}

		private SamplePoints<double> GetSamplePoints(SMapWorkRequest sMapWorkRequest)
		{

			if (Coords.TryGetFromSCoords(sMapWorkRequest.SCoords, out Coords coords))
			{
				double[][] xValueSections = BuildValueSections(coords.LeftBot.X, coords.RightTop.X,
					sMapWorkRequest.CanvasSize.Width, SECTION_WIDTH,
					sMapWorkRequest.Area.SectionAnchor.X, sMapWorkRequest.Area.CanvasSize.Width);


				double[][] yValueSections;
				if (!coords.IsUpsideDown)
				{
					yValueSections = BuildValueSections(coords.RightTop.Y, coords.LeftBot.Y,
						sMapWorkRequest.CanvasSize.Height, SECTION_HEIGHT,
						sMapWorkRequest.Area.SectionAnchor.Y, sMapWorkRequest.Area.CanvasSize.Height);
				}
				else
				{
					yValueSections = BuildValueSections(coords.LeftBot.Y, coords.RightTop.Y,
						sMapWorkRequest.CanvasSize.Height, SECTION_HEIGHT,
						sMapWorkRequest.Area.SectionAnchor.Y, sMapWorkRequest.Area.CanvasSize.Height);
				}

				return new SamplePoints<double>(xValueSections, yValueSections);
			}
			else
			{
				throw new ArgumentException("Cannot parse the SCoords into a Coords value.");
			}
		}

		private double[][] BuildValueSections(double start, double end, int extent, int sectionExtent, int areaStart, int areaExtent)
		{
			double mapExtent = end - start;
			double unitExtent = mapExtent / extent;
			int resultExtent = areaExtent * sectionExtent;

			double resultStart = start + unitExtent * (areaStart * sectionExtent);


			int sectionPtr = 0;
			int inSectPtr = 0;
			double[][] result = new double[areaExtent][]; // Number of sections, each with 100 pixels

			result[0] = new double[sectionExtent];

			for (int ptr = 0; ptr < resultExtent; ptr++)
			{
				result[sectionPtr][inSectPtr++] = resultStart + unitExtent * ptr;
				if (inSectPtr > sectionExtent - 1 && ptr < resultExtent - 1)
				{
					inSectPtr = 0;
					sectionPtr++;
					result[sectionPtr] = new double[sectionExtent];
				}
			}

			return result;
		}

		#region IDisposable Support

		private bool disposedValue = false; // To detect redundant calls

		protected virtual void Dispose(bool disposing)
		{
			if (!disposedValue)
			{
				if (disposing)
				{
					// Dispose managed state (managed objects).
					if (_countsRepo != null)
					{
						_countsRepo.Dispose();
					}
				}

				// TODO: free unmanaged resources (unmanaged objects) and override a finalizer below.
				// TODO: set large fields to null.

				disposedValue = true;
			}
		}

		// TODO: override a finalizer only if Dispose(bool disposing) above has code to free unmanaged resources.
		// ~Job() {
		//   // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
		//   Dispose(false);
		// }

		// This code added to correctly implement the disposable pattern.
		public void Dispose()
		{
			// Do not change this code. Put cleanup code in Dispose(bool disposing) above.
			Dispose(true);
			// TODO: uncomment the following line if the finalizer is overridden above.
			// GC.SuppressFinalize(this);
		}

		#endregion
	}
}

