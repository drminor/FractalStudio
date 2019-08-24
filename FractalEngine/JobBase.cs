using FractalServer;
using System;
using System.Threading;

namespace FractalEngine
{
	public class JobBase<T> : IJob where T: struct
	{
		#region Private Members

		//public readonly SMapWorkRequest SMapWorkRequest;

		public readonly int MaxIterations;

		private readonly SamplePoints<T> _samplePoints;
		//private readonly T[][] _xValueSections;
		//private readonly T[][] _yValueSections;

		//private int _numberOfHSections;
		//private int _numberOfVSections;

		//private int _lastSectionWidth;
		//private int _lastSectionHeight;

		private int _numberOfSectionRemainingToSend;

		private int _hSectionPtr;
		private int _vSectionPtr;

		public const int SECTION_WIDTH = 100;
		public const int SECTION_HEIGHT = 100;

		private int _jobId;
		private bool _done;

		#endregion

		#region Public Properties

		public bool CancelRequested { get; set; }

		public string ConnectionId { get; private set; }

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

		#endregion

		#region Constructor

		//public JobBase(T[][] xValueSections, T[][] yValueSections, string connectionId)
		//{
		//	//SMapWorkRequest = sMapWorkRequest ?? throw new ArgumentNullException(nameof(sMapWorkRequest));
		//	//
		//	//ConnectionId = sMapWorkRequest.ConnectionId ?? throw new ArgumentNullException(nameof(sMapWorkRequest.ConnectionId));

		//	this._xValueSections = xValueSections;
		//	this._yValueSections = yValueSections;

		//	this._numberOfHSections = _xValueSections.GetUpperBound(0) + 1;
		//	this._numberOfVSections = _yValueSections.GetUpperBound(0) + 1;

		//	this._lastSectionWidth = _xValueSections[this._numberOfHSections - 1].Length;
		//	this._lastSectionHeight = _yValueSections[this._numberOfVSections - 1].Length;

		//	ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
		//	_jobId = -1;

		//	//_xValueSections = BuildValueSections(sMapWorkRequest.SCoords.LeftBot.X, sMapWorkRequest.SCoords.RightTop.X,
		//	//	sMapWorkRequest.CanvasSize.Width, SECTION_WIDTH,
		//	//	out int numSectionsH, out int lastExtentH);

		//	//_numberOfHSections = numSectionsH;
		//	//_lastSectionWidth = lastExtentH;

		//	//if (!sMapWorkRequest.SCoords.IsUpsideDown)
		//	//{
		//	//	_yValueSections = BuildValueSections(sMapWorkRequest.SCoords.RightTop.Y, sMapWorkRequest.SCoords.LeftBot.Y,
		//	//		sMapWorkRequest.CanvasSize.Height, SECTION_HEIGHT,
		//	//		out int numSectionsV, out int lastExtentV);
		//	//	_numberOfVSections = numSectionsV;
		//	//	_lastSectionHeight = lastExtentV;
		//	//}
		//	//else
		//	//{
		//	//	_yValueSections = BuildValueSections(sMapWorkRequest.SCoords.LeftBot.Y, sMapWorkRequest.SCoords.RightTop.Y,
		//	//		sMapWorkRequest.CanvasSize.Height, SECTION_HEIGHT,
		//	//		out int numSectionsV, out int lastExtentV);
		//	//	_numberOfVSections = numSectionsV;
		//	//	_lastSectionHeight = lastExtentV;
		//	//}

		//	_hSectionPtr = 0;
		//	_vSectionPtr = 0;

		//	_done = false;
		//	CancelRequested = false;
		//	_numberOfSectionRemainingToSend = _numberOfHSections * _numberOfVSections;
		//}

		public JobBase(SamplePoints<T> samplePoints, int maxIterations, string connectionId)
		{
			//SMapWorkRequest = sMapWorkRequest ?? throw new ArgumentNullException(nameof(sMapWorkRequest));

			_samplePoints = samplePoints;
			//this._xValueSections = samplePoints.XValueSections;
			//this._yValueSections = samplePoints.YValueSections;

			//this._numberOfHSections = _xValueSections.GetUpperBound(0) + 1;
			//this._numberOfVSections = _yValueSections.GetUpperBound(0) + 1;

			//this._lastSectionWidth = _xValueSections[this._numberOfHSections - 1].Length;
			//this._lastSectionHeight = _yValueSections[this._numberOfVSections - 1].Length;

			MaxIterations = maxIterations;
			ConnectionId = connectionId ?? throw new ArgumentNullException(nameof(connectionId));
			_jobId = -1;

			_hSectionPtr = 0;
			_vSectionPtr = 0;

			_done = false;
			CancelRequested = false;
			_numberOfSectionRemainingToSend = _samplePoints.NumberOfHSections * _samplePoints.NumberOfVSections;
		}

		#endregion

		#region Public Methods

		public SubJob GetNextSubJob()
		{

			if (_done) return null;

			if (_hSectionPtr > _samplePoints.NumberOfHSections - 1)
			{
				_hSectionPtr = 0;
				_vSectionPtr++;

				if (_vSectionPtr > _samplePoints.NumberOfVSections - 1)
				{
					_done = true;
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

			T[] xValues = _samplePoints.XValueSections[_hSectionPtr++];
			T[] yValues = _samplePoints.YValueSections[_vSectionPtr];

			MapSectionWorkRequest<T> mswr = new MapSectionWorkRequest<T>(mapSection, MaxIterations, xValues, yValues);
			System.Diagnostics.Debug.WriteLine($"w: {w} h: {h} xLen: {xValues.Length} yLen: {yValues.Length}.");

			SubJob result;
			//if (typeof(T) == typeof(double))
			//{
			//	result = new SubJob(this, mswr as MapSectionWorkRequest<double>, ConnectionId);
			//}
			//else
			//{
			//	result = new SubJob(this, mswr as MapSectionWorkRequest<Qd>, ConnectionId);
			//}

			result = new SubJob(this, mswr as MapSectionWorkRequest<double>, ConnectionId);


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

		#endregion
	}
}
