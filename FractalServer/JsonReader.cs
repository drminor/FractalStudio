
using Newtonsoft.Json;
using System.IO;

namespace FractalServer
{
    public class JsonReader
    {
        public MapInfoWithColorMap Read(string path)
        {
            JsonSerializerSettings settings = BuildSerSettings();

            string fContents = File.ReadAllText(path);

            MapInfoWithColorMapForExport miwcmfe =
                JsonConvert.DeserializeObject<MapInfoWithColorMapForExport>(fContents, settings);

            ColorMap cm = ColorMap.GetFromColorMapForExport(miwcmfe.ColorMapForExport);
            MapInfoWithColorMap result = new MapInfoWithColorMap(miwcmfe.MapInfo, cm);
            return result;
        }

        private JsonSerializerSettings BuildSerSettings()
        {
            JsonSerializerSettings result = new JsonSerializerSettings
            {
                ConstructorHandling = ConstructorHandling.AllowNonPublicDefaultConstructor
            };

            return result;
        }

    }
}
