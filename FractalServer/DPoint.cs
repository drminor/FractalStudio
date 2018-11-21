using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FractalServer
{
    public class DPoint
    {
        public readonly double X;
        public readonly double Y;

        public DPoint(double x, double y)
        {
            X = x;
            Y = y;
        }

        public double SizeSquared
        {
            get
            {
                return X * X + Y * Y;
            }
        }
    }
}
