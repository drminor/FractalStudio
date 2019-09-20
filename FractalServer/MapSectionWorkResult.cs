using FSTypes;

namespace FractalServer
{
	public class MapSectionWorkResult
	{
		public int[] Counts { get; }
		public DPoint[] ZValues { get; }

		public MapSectionWorkResult(int[] counts, DPoint[] zValues)
		{
			Counts = counts;
			ZValues = zValues;
		}
	}
}
