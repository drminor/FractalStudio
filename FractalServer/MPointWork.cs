using FSTypes;
using System;
using System.Diagnostics;

namespace FractalServer
{
    public class MPointWork
	{
		private static readonly double Log2 = Math.Log10(2);
		private readonly int _maxIterations;

		//private DPoint _z;
        //private int _cntr;
		private int _cntr2;
        private double _xSquared;
        private double _ySquared;

		public MPointWork(int maxIterations )
		{
			_maxIterations = maxIterations;
			//_z = new DPoint(0, 0);
		}

		public double Iterate(DPoint c, ref DPoint z, ref int cntr)
        {
            double escapeVelocity = 0.0;

            //_z.X = 0;
            //_z.Y = 0;

            _xSquared = 0;
            _ySquared = 0;

            for (; cntr < _maxIterations; cntr++)
            {
                z.Y = 2 * z.X * z.Y + c.Y;
                z.X = _xSquared - _ySquared + c.X;

                _xSquared = z.X * z.X;
                _ySquared = z.Y * z.Y;

                if ( (_xSquared + _ySquared) > 4)
                {
                    escapeVelocity = GetEscapeVelocity(z, c, _xSquared, _ySquared);
                    //escapeVelocity = 0.4;
                    break;
                }
            }

            return escapeVelocity;
        }

		private double GetEscapeVelocity(DPoint z, DPoint c, double xSquared, double ySquared)
		{
			for (_cntr2 = 0; _cntr2 < 2; _cntr2++)
			{
				z.Y = 2 * z.X * z.Y + c.Y;
				z.X = xSquared - ySquared + c.X;

				xSquared = z.X * z.X;
				ySquared = z.Y * z.Y;
			}

			double modulus = Math.Log10(xSquared + ySquared) / 2;
			double nu = Math.Log10(modulus / Log2) / Log2;
			nu /= 4;

			if (nu > 1)
			{
				Debug.WriteLine($"The value of nu is {nu}, using 1.0");
				nu = 1;
			}

            double result = 1 - nu / 4;
            return result;
        }
    }
}
