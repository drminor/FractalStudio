
namespace FractalServer
{
	public class MapCalculatorQd
    {
		public int[] GetValues(MapSectionWorkRequest<Qd> mswr)
		{
			int[] result = QdWrapper.CallCalcMap(mswr.MaxIterations, mswr.XValues, mswr.YValues);

			return result;
		}

    }
}
