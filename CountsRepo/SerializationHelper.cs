using System;
using System.Text;
using System.Xml;
using System.Xml.Serialization;

namespace CountsRepo
{
	class SerializationHelper
	{
		public static bool Serialize<T>(T value, ref StringBuilder sb)
		{
			if (value == null)
				return false;

			try
			{
				XmlSerializer xmlserializer = new XmlSerializer(typeof(T));
				using (XmlWriter writer = XmlWriter.Create(sb))
				{
					xmlserializer.Serialize(writer, value);
					writer.Close();
				}
				return true;
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex);
				return false;
			}
		}

		public static bool Deserialize<T>(string value, out T obj)
		{

			if (value == null)
			{
				obj = default(T);
				return false;
			}

			try
			{
				XmlSerializer xmlserializer = new XmlSerializer(typeof(T));
				using (XmlReader reader = XmlReader.Create(value))
				{
					obj = (T)xmlserializer.Deserialize(reader);
					reader.Close();
				}
				return true;
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex);
				obj = default(T);
				return false;
			}
		}


	}
}
