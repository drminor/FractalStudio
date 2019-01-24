using System;

namespace FractalServer
{
    public class MPointWork
    {
        private static DPoint Z;
        private static int Cntr;
        private static double XSquared;
        private static double YSquared;
        private static readonly double Log2;

        static MPointWork()
        {
            Z = new DPoint(0, 0);
            Log2 = Math.Log10(2);
        }

        public static int Iterate(DPoint c, int maxCnt, out double escapeVelocity)
        {
            escapeVelocity = 0.6;

            Z.X = 0;
            Z.Y = 0;

            XSquared = 0;
            YSquared = 0;

            for (Cntr = 0; Cntr < maxCnt; Cntr++)
            {
                Z.Y = 2 * Z.X * Z.Y + c.Y;
                Z.X = XSquared - YSquared + c.X;

                XSquared = Z.X * Z.X;
                YSquared = Z.Y * Z.Y;

                if ( (XSquared + YSquared) > 4)
                {
                    //escapeVelocity = GetEscapeVelocity(Z, c, XSquared, YSquared);
                    escapeVelocity = 0.4;
                    break;
                }
            }

            return Cntr;
        }

        private static double GetEscapeVelocity(DPoint z, DPoint c, double xSquared, double ySquared)
        {
            for (Cntr = 0; Cntr < 2; Cntr++)
            {
                z.Y = 2 * z.X * z.Y + c.Y;
                z.X = xSquared - ySquared + c.X;

                xSquared = Z.X * Z.X;
                ySquared = Z.Y * Z.Y;
            }

            double modulus = Math.Log10(xSquared + ySquared) / 2;
            double nu = Math.Log10(modulus / Log2) / Log2;

            double result = 1 - nu;

            return result;
        }
    }
}
