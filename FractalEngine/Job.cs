using FractalServer;
using System;
using System.Threading;

namespace FractalEngine
{
	public class Job : JobBase
	{
		private readonly SamplePoints<double> _samplePoints;

		private int _numberOfSectionRemainingToSend;

		private int _hSectionPtr;
		private int _vSectionPtr;

		public const int SECTION_WIDTH = 100;
		public const int SECTION_HEIGHT = 100;


		public Job(SMapWorkRequest sMapWorkRequest, string connectionId) : base(sMapWorkRequest, connectionId)
		{
			_samplePoints = GetSamplePoints(sMapWorkRequest);
			_hSectionPtr = 0;
			_vSectionPtr = 0;

			IsCompleted = false;
			_numberOfSectionRemainingToSend = _samplePoints.NumberOfHSections * _samplePoints.NumberOfVSections;
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

		private static double[][] BuildValueSections(double start, double end, int extent, int sectionExtent, out int sectionCount, out int lastExtent)
		{
			sectionCount = GetSectionCount(extent, sectionExtent, out lastExtent);

			double mapExtent = end - start;
			double unitExtent = mapExtent / extent;

			int sectionPtr = 0;
			int inSectPtr = 0;
			double[][] result = new double[sectionCount][];

			if (sectionCount == 1)
			{
				result[0] = new double[lastExtent];
			}
			else
			{
				result[0] = new double[sectionExtent];
			}

			for (int ptr = 0; ptr < extent; ptr++)
			{
				result[sectionPtr][inSectPtr++] = start + unitExtent * ptr;
				if(inSectPtr > sectionExtent - 1 && ptr < extent - 1)
				{
					inSectPtr = 0;
					sectionPtr++;

					if (sectionPtr == sectionCount - 1)
					{
						result[sectionPtr] = new double[lastExtent];
					}
					else
					{
						result[sectionPtr] = new double[sectionExtent];
					}
				}
			}

			return result;
		}

		protected static int GetSectionCount(int totalExtent, int sectionExtent, out int lastExtent)
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
			System.Diagnostics.Debug.WriteLine($"Creating SubJob for hSection: {_hSectionPtr}, vSection: {_vSectionPtr}.");

			int w;
			int h;

			if (_hSectionPtr == _samplePoints.NumberOfHSections - 1)
			{
				w = _samplePoints.LastSectionWidth;
			}
			else
			{
				w = SECTION_WIDTH;
			}

			if (_vSectionPtr == _samplePoints.NumberOfVSections - 1)
			{
				h = _samplePoints.LastSectionHeight;
			}
			else
			{
				h = SECTION_HEIGHT;
			}

			int left = _hSectionPtr * SECTION_WIDTH;
			int top = _vSectionPtr * SECTION_HEIGHT;

			MapSection mapSection = new MapSection(new FractalServer.Point(left, top), new CanvasSize(w, h));

			double[] xValues = _samplePoints.XValueSections[_hSectionPtr++];
			double[] yValues = _samplePoints.YValueSections[_vSectionPtr];

			MapSectionWorkRequest mswr = new MapSectionWorkRequest(mapSection, MaxIterations, xValues, yValues);
			System.Diagnostics.Debug.WriteLine($"w: {w} h: {h} xLen: {xValues.Length} yLen: {yValues.Length}.");

			SubJob result = new SubJob(this, mswr, ConnectionId);


			return result;
		}

		/// <summary>
		/// Returns true if there are no remaing sub jobs to be sent.
		/// </summary>
		/// <returns></returns>
		public void DecrementSubJobsRemainingToBeSent()
		{
			int newVal = Interlocked.Decrement(ref _numberOfSectionRemainingToSend);
			if(newVal == 0)
			{
				IsLastSubJob = true;
			}
		}

	}
}
