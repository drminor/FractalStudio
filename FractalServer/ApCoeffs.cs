using FSTypes;
using System;

namespace FractalServer
{
	class ApCoeffs
	{
		private DPoint[] _coefficients;

		public ApCoeffs(DPoint[] vals)
		{
			_coefficients = new DPoint[vals.Length];
			for (int i = 0; i < vals.Length; i++)
			{
				_coefficients[i] = new DPoint(vals[i]);
			}
		}

		public ApCoeffs(ApCoeffs source)
		{
			_coefficients = new DPoint[source.Length];
			for (int i = 0; i < source.Length; i++)
			{
				_coefficients[i] = new DPoint(source[i]);
			}
		}

		public ApCoeffs(int len)
		{
			_coefficients = new DPoint[len];
			for (int i = 0; i < len; i++)
			{
				_coefficients[i] = new DPoint(0, 0);
			}
		}

		public DPoint this[int i]
		{
			get { return _coefficients[i]; }
			set { _coefficients[i] = value; }
		}

		public int Length
		{
			get
			{
				return _coefficients.Length;
			}
		}

		public void CopyFrom(DPoint[] vals)
		{
			for (int i = 0; i < Length; i++)
			{
				_coefficients[i].CopyFrom(vals[i]);
			}
		}

		public void CopyFrom(ApCoeffs coeffs)
		{
			for (int i = 0; i < Length; i++)
			{
				_coefficients[i].CopyFrom(coeffs._coefficients[i]);
			}
		}

		public void Read(DPoint[] vals)
		{
			if (vals.Length != Length)
			{
				throw new ArgumentException($"vals must have exactly {Length} elements.", "vals");
			}

			for (int i = 0; i < Length; i++)
			{
				vals[i].CopyFrom(_coefficients[i]);
			}
		}

	}
}
