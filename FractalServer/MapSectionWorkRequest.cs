using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FractalServer
{
	public class MapSectionWorkRequest
	{
		public readonly MapInfo MapInfo;
		public readonly Rectangle Canvas;

		public MapSectionWorkRequest(MapInfo mapInfo, Rectangle canvas)
		{
			MapInfo = mapInfo ?? throw new ArgumentNullException(nameof(mapInfo));
			Canvas = canvas;
		}
	}
}
