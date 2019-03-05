using System;

namespace FractalServer
{
    public class MPointWork
	{
		private static readonly double Log2 = Math.Log10(2);
		private readonly int _maxIterations;

		private DPoint _z;
        private int _cntr;
        private double _xSquared;
        private double _ySquared;

		public MPointWork(int maxIterations )
		{
			_maxIterations = maxIterations;
			_z = new DPoint(0, 0);
			//Log2 = Math.Log10(2);
		}

		public int Iterate(DPoint c, out double escapeVelocity)
        {
            escapeVelocity = 0.6;

            _z.X = 0;
            _z.Y = 0;

            _xSquared = 0;
            _ySquared = 0;

            for (_cntr = 0; _cntr < this._maxIterations; _cntr++)
            {
                _z.Y = 2 * _z.X * _z.Y + c.Y;
                _z.X = _xSquared - _ySquared + c.X;

                _xSquared = _z.X * _z.X;
                _ySquared = _z.Y * _z.Y;

                if ( (_xSquared + _ySquared) > 4)
                {
                    //escapeVelocity = GetEscapeVelocity(Z, c, XSquared, YSquared);
                    escapeVelocity = 0.4;
                    break;
                }
            }

            return _cntr;
        }

        private double GetEscapeVelocity(DPoint z, DPoint c, double xSquared, double ySquared)
        {
            for (_cntr = 0; _cntr < 2; _cntr++)
            {
                z.Y = 2 * z.X * z.Y + c.Y;
                z.X = xSquared - ySquared + c.X;

                xSquared = _z.X * _z.X;
                ySquared = _z.Y * _z.Y;
            }

            double modulus = Math.Log10(xSquared + ySquared) / 2;
            double nu = Math.Log10(modulus / Log2) / Log2;

            double result = 1 - nu / 4;

            return result;
        }
    }
}
