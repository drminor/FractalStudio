using FSTypes;
using System;
using System.Diagnostics;

namespace FractalServer
{
    public class MPointWork
	{
		public const int THRESHOLD = 256;
		private static readonly double Log2 = Math.Log10(2);
		private readonly int _maxIterations;

		private int _cntr2;
		private DPoint _z2;
        private double _xSquared;
        private double _ySquared;
		private double _zx;
		private double _zy;
		private double _cx;
		private double _cy;

		public MPointWork(int maxIterations )
		{
			_maxIterations = maxIterations;
			_z2 = new DPoint(0, 0);
		}

		public double Iterate(DPoint c, DPoint z, ref int cntr, out bool done)
        {
			done = false;
            double escapeVelocity = 0.0;

			_cx = c.X;
			_cy = c.Y;
			_zx = z.X;
			_zy = z.Y;

            _xSquared = _zx * _zx;
            _ySquared = _zy * _zy;

            for (; cntr < _maxIterations; cntr++)
            {
				_zy = 2 * _zx * _zy + _cy;
				_zx = _xSquared - _ySquared + _cx;

                _xSquared = _zx * _zx;
                _ySquared = _zy * _zy;

                if ( (_xSquared + _ySquared) > 4)
                {
					done = true;
					z.X = _zx;
					z.Y = _zy;
					escapeVelocity = GetEscapeVelocity(z, c, _xSquared, _ySquared);
					//escapeVelocity = GetEscapeVelocity(_xSquared + _ySquared);
                    break;
                }
            }

			z.X = _zx;
			z.Y = _zy;
			return escapeVelocity;
        }

		private double GetEscapeVelocity(DPoint z, DPoint c, double xSquared, double ySquared)
		{
			_z2.X = z.X;
			_z2.Y = z.Y;

			for (_cntr2 = 0; _cntr2 < 25; _cntr2++)
			{
				_z2.Y = 2 * _z2.X * _z2.Y + c.Y;
				_z2.X = xSquared - ySquared + c.X;

				xSquared = _z2.X * _z2.X;
				ySquared = _z2.Y * _z2.Y;

				if ((xSquared + ySquared) > THRESHOLD)
				{
					return GetEscapeVelocity(xSquared + ySquared);
				}
			}

			return 0;
		}

		private double GetEscapeVelocity(double sumOfSquares)
		{
			double modulus = Math.Log10(sumOfSquares) / 2;
			double nu = Math.Log10(modulus / Log2) / Log2;
			nu /= 4;

			if (nu > 1)
			{
				Debug.WriteLine($"The value of nu is {nu}, using 1.0");
				nu = 1;
			}

			double result = 1 - nu;
			return result;
		}

		// Mandelbrot calculations can be done using three squaring operations rather than two squares and a multiply.
		// https://randomascii.wordpress.com/2011/08/13/faster-fractals-through-algebra/
	}
}

