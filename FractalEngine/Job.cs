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

		public Job(SMapWorkRequest sMapWorkRequest) : base(sMapWorkRequest)
		{
			_samplePoints = GetSamplePoints(sMapWorkRequest);
			_hSectionPtr = 0;
			_vSectionPtr = 0;

			IsCompleted = false;
			_numberOfSectionRemainingToSend = _samplePoints.NumberOfHSections * _samplePoints.NumberOfVSections;
			_countsRepo = null;
		}

		private ValueRecords<RectangleInt, MapSectionWorkResult> CountsRepo
		{
			get
			{
				if(_countsRepo == null)
				{
					string filename = RepoFilename;
					_countsRepo = new ValueRecords<RectangleInt, MapSectionWorkResult>(filename);
				}
				return _countsRepo;
			}
		}

		private const string DiagTimeFormat = "HH:mm:ss ffff";

		public void DeleteCountsRepo()
		{
			Debug.WriteLine($"Starting to delete the old repo: {RepoFilename} at {DateTime.Now.ToString(DiagTimeFormat)}.");
			if(_countsRepo != null)
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
			CountsRepo.Add(riKey, val, saveOnWrite: true);
		}

		public bool CanReplayResults()
		{
			bool result = ValueRecords<RectangleInt, MapSectionWorkResult>.RepoExists(RepoFilename);
			return result;
		}

		public IEnumerable<Tuple<MapSectionResult, bool>> ReplayResults()
		{
			SubJob subJob = GetNextSubJob();

			while(subJob != null)
			{
				Tuple<MapSectionResult, bool> item = RetrieveWorkResultFromRepo(subJob);
				DecrementSubJobsRemainingToBeSent();

				subJob = GetNextSubJob();
				yield return item;
			}
		}

		public Tuple<MapSectionResult, bool> RetrieveWorkResultFromRepo(SubJob subJob)
		{
			MapSection ms = subJob.MapSectionWorkRequest.MapSection;
			MapSectionWorkResult val = new MapSectionWorkResult(ms.CanvasSize.Width * ms.CanvasSize.Height, false, false);
			if(CountsRepo.ReadParts(ms.GetRectangleInt(), val))
			{
				subJob.workResult = val;
				MapSectionResult msr = subJob.BuildMapSectionResult();
				Tuple<MapSectionResult, bool> item = new Tuple<MapSectionResult, bool>(msr, IsLastSubJob);
				return item;
			}
			else
			{
				return null;
			}
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

			int w;
			int h;

			if (_hSectionPtr == _samplePoints.NumberOfHSections - 1)
			{
				//w = _samplePoints.LastSectionWidth;
				w = SECTION_WIDTH;
			}
			else
			{
				w = SECTION_WIDTH;
			}

			if (_vSectionPtr == _samplePoints.NumberOfVSections - 1)
			{
				//h = _samplePoints.LastSectionHeight;
				h = SECTION_HEIGHT;
			}
			else
			{
				h = SECTION_HEIGHT;
			}

			int left = _hSectionPtr * SECTION_WIDTH;
			int top = _vSectionPtr * SECTION_HEIGHT;

			MapSection mapSection = new MapSection(new Point(left, top), new CanvasSize(w, h));

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
			if(newVal == 0)
			{
				IsLastSubJob = true;
			}
		}

		private SamplePoints<double> GetSamplePoints(SMapWorkRequest sMapWorkRequest)
		{
			int SECTION_WIDTH = 100;
			int SECTION_HEIGHT = 100;

			if (Coords.TryGetFromSCoords(sMapWorkRequest.SCoords, out Coords coords))
			{
				double[][] xValueSections = BuildValueSections(coords.LeftBot.X, coords.RightTop.X,
					sMapWorkRequest.CanvasSize.Width, SECTION_WIDTH,
					out int numSectionsH, out int lastExtentH);

				//_numberOfHSections = numSectionsH;
				//_lastSectionWidth = lastExtentH;

				double[][] yValueSections;
				if (!coords.IsUpsideDown)
				{
					yValueSections = BuildValueSections(coords.RightTop.Y, coords.LeftBot.Y,
						sMapWorkRequest.CanvasSize.Height, SECTION_HEIGHT,
						out int numSectionsV, out int lastExtentV);
					//_numberOfVSections = numSectionsV;
					//_lastSectionHeight = lastExtentV;
				}
				else
				{
					yValueSections = BuildValueSections(coords.LeftBot.Y, coords.RightTop.Y,
						sMapWorkRequest.CanvasSize.Height, SECTION_HEIGHT,
						out int numSectionsV, out int lastExtentV);
					//_numberOfVSections = numSectionsV;
					//_lastSectionHeight = lastExtentV;
				}

				return new SamplePoints<double>(xValueSections, yValueSections);
			}
			else
			{
				throw new ArgumentException("Cannot parse the SCoords into a Coords value.");
			}
		}

		private double[][] BuildValueSections(double start, double end, int extent, int sectionExtent, out int sectionCount, out int lastExtent)
		{
			sectionCount = GetSectionCount(extent, sectionExtent, out lastExtent);

			double mapExtent = end - start;
			double unitExtent = mapExtent / extent;

			int sectionPtr = 0;
			int inSectPtr = 0;
			double[][] result = new double[sectionCount][];

			//if (sectionCount == 1)
			//{
			//	result[0] = new double[lastExtent];
			//}
			//else
			//{
			//	result[0] = new double[sectionExtent];
			//}
			result[0] = new double[sectionExtent];


			for (int ptr = 0; ptr < extent; ptr++)
			{
				result[sectionPtr][inSectPtr++] = start + unitExtent * ptr;
				if (inSectPtr > sectionExtent - 1 && ptr < extent - 1)
				{
					inSectPtr = 0;
					sectionPtr++;

					//if (sectionPtr == sectionCount - 1)
					//{
					//	result[sectionPtr] = new double[lastExtent];
					//}
					//else
					//{
					//	result[sectionPtr] = new double[sectionExtent];
					//}
					result[sectionPtr] = new double[sectionExtent];
				}
			}

			return result;
		}

		protected int GetSectionCount(int totalExtent, int sectionExtent, out int lastExtent)
		{
			lastExtent = sectionExtent;
			double r = totalExtent / (double)sectionExtent;

			int result = (int)Math.Truncate(r);
			if (r != result)
			{
				lastExtent = totalExtent - sectionExtent * result;
				result++;
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
					if(_countsRepo != null)
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
