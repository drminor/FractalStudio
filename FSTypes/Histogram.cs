using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace FSTypes
{
	public class Histogram
	{
		[JsonProperty("jobId")]
		public readonly int JobId;

		[JsonProperty("values")]
		public readonly int[] Values;

		[JsonProperty("occurances")]
		public readonly int[] Occurances;

		public Histogram(int jobId, IDictionary<int, int> hDictionary)
		{
			JobId = jobId;
			if (hDictionary != null)
			{
				Values = hDictionary.Keys.ToArray();
				Occurances = hDictionary.Values.ToArray();
			}
			else
			{
				Values = new int[0];
				Occurances = new int[0];
			}
		}

		[JsonConstructor]
		public Histogram(int jobId, int[] values, int[] occurances)
		{
			JobId = jobId;
			Values = values;
			Occurances = occurances;
		}
	}

}
