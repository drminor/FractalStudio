namespace FractalServer
{
    public class DPoint
    {
        public double X;
        public double Y;

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
