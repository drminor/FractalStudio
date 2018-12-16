namespace FractalServer
{
    public class MPointWork
    {
        private static DPoint Z;
        private static int Cntr;
        private static double XSquared;
        private static double YSquared;

        static MPointWork()
        {
            Z = new DPoint(0, 0);
        }

        public static int Iterate(DPoint c, int maxCnt)
        {
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
                    break;
                }
            }

            return Cntr;
        }
    }
}
