using FractalServer;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FractalEngine
{
	public class Job
	{
		private int _jobId;
		public readonly MapWorkRequest MapWorkRequest;
		public readonly string ConnectionId;
		public bool CancelRequested;

		private const int SECTION_WIDTH = 100;
		private const int SECTION_HEIGHT = 100;

		private readonly double[][] _xValueSections;
		private readonly double[][] _yValueSections;

		private int _numberOfHSections;
		private int _numberOfVSections;

		private int _numberOfSectionRemainingToSend;

		private int _lastSectionWidth;
		private int _lastSectionHeight;

		private int _hSectionPtr;
		private int _vSectionPtr;

		private bool _done;

		public Job(MapWorkRequest mapWorkRequest, string connectionId)
		{
			MapWorkRequest = mapWorkRequest ?? throw new ArgumentNullException(nameof(mapWorkRequest));
			//
			ConnectionId = mapWorkRequest.ConnectionId ?? throw new ArgumentNullException(nameof(mapWorkRequest.ConnectionId));

			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
			_jobId = -1;

			_xValueSections = BuildValueSections(mapWorkRequest.Coords.LeftBot.X, mapWorkRequest.Coords.RightTop.X,
				mapWorkRequest.CanvasSize.Width, SECTION_WIDTH,
				out int numSectionsH, out int lastExtentH);

			_numberOfHSections = numSectionsH;
			_lastSectionWidth = lastExtentH;

			if (!mapWorkRequest.Coords.IsUpsideDown)
			{
				_yValueSections = BuildValueSections(mapWorkRequest.Coords.RightTop.Y, mapWorkRequest.Coords.LeftBot.Y,
					mapWorkRequest.CanvasSize.Height, SECTION_HEIGHT,
					out int numSectionsV, out int lastExtentV);
				_numberOfVSections = numSectionsV;
				_lastSectionHeight = lastExtentV;
			}
			else
			{
				_yValueSections = BuildValueSections(mapWorkRequest.Coords.LeftBot.Y, mapWorkRequest.Coords.RightTop.Y,
					mapWorkRequest.CanvasSize.Height, SECTION_HEIGHT,
					out int numSectionsV, out int lastExtentV);
				_numberOfVSections = numSectionsV;
				_lastSectionHeight = lastExtentV;
			}

			_hSectionPtr = 0;
			_vSectionPtr = 0;

			_done = false;
			CancelRequested = false;
			_numberOfSectionRemainingToSend = _numberOfHSections * _numberOfVSections;
		}

		private double[][] BuildValueSections(double start, double end, int extent, int sectionExtent, out int sectionCount, out int lastExtent)
		{
			sectionCount = GetNumSection(extent, sectionExtent, out lastExtent);

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

		private int GetNumSection(int totalExtent, int sectionExtent, out int lastExtent)
		{
			lastExtent = sectionExtent;
			double r = totalExtent / (double) sectionExtent;

			int result = (int) Math.Truncate(r);
			if(r != result)
			{
				lastExtent = totalExtent - sectionExtent * result;
				result++;
			}

			return result;
		}

		public int JobId
		{
			get { return _jobId; }
			set
			{
				if (value == -1) throw new ArgumentException("-1 cannot be used as a JobId.");
				if (_jobId != -1) throw new InvalidOperationException("The JobId cannot be set once it has already been set.");

				_jobId = value;
			}
		}

		public SubJob GetNextSubJob()
		{

			if (_done) return null;

			if (_hSectionPtr > _numberOfHSections - 1)
			{
				_hSectionPtr = 0;
				_vSectionPtr++;

				if (_vSectionPtr > _numberOfVSections - 1)
				{
					_done = true;
					return null;
				}
			}
			System.Diagnostics.Debug.WriteLine($"Creating SubJob for hSection: {_hSectionPtr}, vSection: {_vSectionPtr}.");

			int w;
			int h;

			if (_hSectionPtr == _numberOfHSections - 1)
			{
				w = _lastSectionWidth;
			}
			else
			{
				w = SECTION_WIDTH;
			}

			if (_vSectionPtr == _numberOfVSections - 1)
			{
				h = _lastSectionHeight;
			}
			else
			{
				h = SECTION_HEIGHT;
			}

			int left = _hSectionPtr * SECTION_WIDTH;
			int top = _vSectionPtr * SECTION_HEIGHT;

			//bool isFinalSubJob = (_hSectionPtr == _numberOfHSections - 1) && (_vSectionPtr == _numberOfVSections - 1);

			MapSection mapSection = new MapSection(new FractalServer.Point(left, top), new CanvasSize(w, h));

			//Rectangle canvas = new Rectangle(left, top, w, h);

			double[] xValues = _xValueSections[_hSectionPtr++];
			double[] yValues = _yValueSections[_vSectionPtr];

			MapSectionWorkRequest mswr = new MapSectionWorkRequest(mapSection, MapWorkRequest.MaxIterations, xValues, yValues);

			System.Diagnostics.Debug.WriteLine($"w: {w} h: {h} xLen: {xValues.Length} yLen: {yValues.Length}.");
			//if (isFinalSubJob)
			//{
			//	System.Diagnostics.Debug.WriteLine("This is the final sub job.");
			//}

			SubJob result = new SubJob(this, mswr, ConnectionId/*, isFinalSubJob*/);

			return result;
		}

		/// <summary>
		/// Returns true if there are no remaing sub jobs to be sent.
		/// </summary>
		/// <returns></returns>
		public bool DecrementSubJobsRemainingToBeSent()
		{
			int newVal = Interlocked.Decrement(ref _numberOfSectionRemainingToSend);
			return newVal == 0;
		}

	}
}
