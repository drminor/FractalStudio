﻿using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FractalEngine
{
	public static class BlockingCollectionExtensions
	{
		public static Partitioner<T> GetConsumingPartitioner<T>(this BlockingCollection<T> collection)
		{
			return new BlockingCollectionPartitioner<T>(collection);
		}

		private class BlockingCollectionPartitioner<T> : Partitioner<T>
		{
			private BlockingCollection<T> _collection;

			public BlockingCollectionPartitioner(BlockingCollection<T> collection)
			{
				_collection = collection ?? throw new ArgumentNullException(nameof(collection));
			}

			public override bool SupportsDynamicPartitions
			{
				get { return true; }
			}

			public override IList<IEnumerator<T>> GetPartitions(int partitionCount)
			{
				if (partitionCount < 1)
					throw new ArgumentOutOfRangeException("partitionCount");

				var dynamicPartitioner = GetDynamicPartitions();

				return Enumerable.Range(0, partitionCount).Select(_ =>
					dynamicPartitioner.GetEnumerator()).ToArray();
			}

			public override IEnumerable<T> GetDynamicPartitions()
			{
				return _collection.GetConsumingEnumerable();
			}
		}
	}
}
