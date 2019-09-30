﻿using FSTypes;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;

namespace CountsRepo
{
    // Record
    class IndexEntry<K> where K: IEqualityComparer<K>
	{
		public IndexEntry(uint offset, uint valueLength, string serializedKey)
		{
			Offset = offset;
			ValueLength = valueLength;
			SerializedKey = serializedKey;
			//KeyLength = serializedKey.Length;

			SerializationHelper.Deserialize(serializedKey, out K temp);
			Key = temp;
		}

		public IndexEntry(uint offset, uint valueLength, K key)
		{
			Offset = offset;
			ValueLength = valueLength;
			Key = key;

			SerializedKey = GetKeyAsString(key);
			//KeyLength = SerializedKey.Length;
		}

		public uint Offset { get; set; }
        public uint ValueLength { get; set; }

		//public int KeyLength { get; }
		public string SerializedKey { get; }
		public K Key { get; }

		private string GetKeyAsString(K key)
		{
			StringBuilder sb = new StringBuilder();
			SerializationHelper.Serialize(key, ref sb);

			return sb.ToString();
		}
	}

    class IndexKeys<K> where K: IEqualityComparer<K>
    {
		private Dictionary<K, IndexEntry<K>> _indexes;

        public readonly string IndexFilePath;
        public bool IsDirty { get; set; }
        
        public IndexKeys(string indexFilePath, bool createIfNotFound = true)
        {
			IndexFilePath = indexFilePath;
			_indexes = new Dictionary<K, IndexEntry<K>>();
			Load(createIfNotFound);
            IsDirty = false;
        }

        // Loads index from index file
        private void Load(bool createIfNotFound)
        {
            if (!File.Exists(IndexFilePath))
            {
				if(!createIfNotFound)
					throw new FileNotFoundException($"The file {IndexFilePath} does not exist.");
            }

            using (var fs = File.Open(IndexFilePath, FileMode.OpenOrCreate, FileAccess.Read))
            {
                using (var br = new BinaryReader(fs))
                {
                    while (br.BaseStream.Position != br.BaseStream.Length)
                    {
						uint offset = br.ReadUInt32();
						uint valLength = br.ReadUInt32();
						string serializedKey = br.ReadString();

						var indexRec = new IndexEntry<K>(offset, valLength, serializedKey);
                        _indexes.Add(indexRec.Key, indexRec);
                    }
                }
            }
        }

		public IReadOnlyCollection<IndexEntry<K>> IndexEntries => _indexes.Values;

        public void Save()
        {
            if (!IsDirty) return;
            using (var fs = File.OpenWrite(IndexFilePath))
            {
                using (var bw = new BinaryWriter(fs))
                {
					foreach(IndexEntry<K> indexRec in _indexes.Values)
                    {
                        bw.Write(indexRec.Offset);
                        bw.Write(indexRec.ValueLength);
						bw.Write(indexRec.SerializedKey);
                    }
                }
            }
        }

		public bool ContainsKey(K key)
		{
			bool result = _indexes.ContainsKey(key);
			return result;
		}

        // returns specified IndexRecord
        public IndexEntry<K> GetIndex(K key)
        {
			if(_indexes.TryGetValue(key, out IndexEntry<K> idxEntry))
			{
				return idxEntry;
			}
			else
			{
				return null;
			}
        }

        public void AddIndex(uint offset, uint length, K key)
        {
			var indexRec = new IndexEntry<K>(offset, length, key);
			_indexes.Add(key, indexRec);
            IsDirty = true;
        }
    }

    public class ValueRecords<K,V> : IDisposable where K: IEqualityComparer<K> where V: IPartsBin
	{
		public const string WORKING_DIR = @"C:\_FractalFiles";
		public const string DATA_FILE_EXT = "frd";
		public const string INDEX_FILE_EXT = "frx";

		private static readonly string TEMP_FILE_NAME = Path.Combine(WORKING_DIR, @"tempdata.frd");
		private static readonly string BAK_FILE_NAME = Path.Combine(WORKING_DIR, @"tempdata.bak");

		private IndexKeys<K> _indices;
        private FileStream _fs;

        public ValueRecords(string filename)
        {
			TextFilename = GetFilePaths(filename, out string indexFilePath);
			_indices = new IndexKeys<K>(indexFilePath);
			_fs = new FileStream(TextFilename, FileMode.OpenOrCreate);
		}

		public readonly string TextFilename;
		public string IndexFilename => _indices.IndexFilePath;

		public IEnumerable<V> GetValues(Func<K, V> emptyValueProvider) 
		{
			IReadOnlyCollection<IndexEntry<K>> keys = _indices.IndexEntries;

			using (var br = new BinaryReader(_fs, Encoding.UTF8, true))
			{
				foreach (IndexEntry<K> key in keys)
				{
					V newV = emptyValueProvider(key.Key);
					_fs.Seek(key.Offset, SeekOrigin.Begin);
					bool success = LoadParts(br, _fs, newV);

					yield return newV;
				}
			}
		}

		// Adds a value by key, optionally saves index
		public void Add(K key, V value, bool saveOnWrite = false)
        {
			if(_indices.ContainsKey(key))
			{
				throw new ArgumentException($"The key: {key} already has been added.");
			}

            _fs.Seek(0, SeekOrigin.End);
            var offset = (uint) _fs.Position;

			using (var bw = new BinaryWriter(_fs, Encoding.UTF8, true))
            {
				uint valueLength = WriteParts(bw, value);
				_indices.AddIndex(offset, valueLength, key);
			}

			if (saveOnWrite)
            {
                _indices.Save();
            }
        }

        // Change Record, update index
        public void Change(K key, V value)
        {
            var record = _indices.GetIndex(key);
            if (record == null)
            {
                return;
            }

			if (value.TotalBytesToWrite > record.ValueLength)
            {
                _fs.Seek(0, SeekOrigin.End);            
                record.Offset = (uint)_fs.Position;
            }       
            else
            {
				// just change length
				_fs.Seek(record.Offset, SeekOrigin.Begin);
            }

			record.ValueLength = value.TotalBytesToWrite;

            using (var bw = new BinaryWriter(_fs, Encoding.UTF8, true))
            {
				WriteParts(bw, value);
            }

            _indices.IsDirty = true; // Makes sure Indices are rewritten
        }

        public void Update()
        {
            _indices.Save();
        }

		//     // creates a temp file then renames the old one
		//     public ValueRecords<K, V> Compress()
		//     {
		//         File.Delete(BAK_FILE_NAME);
		//         File.Delete(TEMP_FILE_NAME);

		//         using (var newfs = File.OpenWrite(TEMP_FILE_NAME))
		//         {
		//             using (var br = new BinaryReader(_fs))
		//             {
		//                 using (var bw = new BinaryWriter(newfs))
		//                 {
		//			foreach (IndexEntry<K> indexRec in _indices.IndexEntries)
		//			{
		//                         _fs.Seek(indexRec.Offset, SeekOrigin.Begin);

		//                         var str = br.ReadString();
		//                         indexRec.Offset = (uint)newfs.Position;
		//                         indexRec.ValueLength = (uint)str.Length;
		//                         bw.Write(str);
		//                     }
		//                 }
		//             }
		//         }

		//         _indices.IsDirty = true;

		//Dispose();

		//         File.Move(TextFilename, BAK_FILE_NAME);
		//         File.Move(TEMP_FILE_NAME, TextFilename);

		//return new ValueRecords<K,V>(IndexFilename, TextFilename);
		//     }

		public bool ReadParts(K key, V value)
		{
			var record = _indices.GetIndex(key);

			if (record == null)
			{
				return false;
			}

			using (var br = new BinaryReader(_fs, Encoding.UTF8, true))
			{
				_fs.Seek(record.Offset, SeekOrigin.Begin);
				bool success = LoadParts(br, _fs, value);

				return success;
			}
		}

		private uint WriteParts(BinaryWriter bw, V value)
		{
			uint totalBytes = 0;

			for(int partCntr = 0; partCntr < value.PartCount; partCntr++)
			{
				PartDetail pDetail = value.PartDetails[partCntr];

				int partLen = pDetail.PartLength;
				byte[] buf = value.GetPart(partCntr);
				bw.Write(buf);
				totalBytes += (uint) partLen;
			}

			return totalBytes;
		}

		private bool LoadParts(BinaryReader br, FileStream fs, V value)
		{
			for (int partCntr = 0; partCntr < value.PartCount; partCntr++)
			{
				PartDetail pDetail = value.PartDetails[partCntr];

				if (pDetail.IncludeOnRead)
				{
					byte[] buf = br.ReadBytes(pDetail.PartLength);
					value.SetPart(partCntr, buf);
				}
				else
				{
					fs.Seek(pDetail.PartLength, SeekOrigin.Current);
				}
			}

			return true;
		}

		public static string GetFilePaths(string fn, out string indexPath)
		{
			string dataPath = Path.ChangeExtension(Path.Combine(WORKING_DIR, fn), DATA_FILE_EXT);
			indexPath = Path.ChangeExtension(Path.Combine(WORKING_DIR, fn), INDEX_FILE_EXT);

			return dataPath;
		}

		public static bool RepoExists(string filename)
		{
			string dataPath = GetFilePaths(filename, out string indexPath);

			bool result = File.Exists(dataPath);
			return result;
		}

		public static bool DeleteRepo(string filename)
		{
			Debug.WriteLine($"Deleting the Repo: {filename}.");

			try
			{
				string dataPath = GetFilePaths(filename, out string indexPath);
				File.Delete(dataPath);
				File.Delete(indexPath);
				return true;
			}
			catch (Exception e)
			{
				Debug.WriteLine($"Received error while deleting the Repo: {filename}. The error is {e.Message}.");
				return false;
			}
		}

		#region IDisposable Support

		private bool disposedValue = false; // To detect redundant calls

		protected virtual void Dispose(bool disposing)
		{
			if (!disposedValue)
			{
				if (disposing)
				{
					// Dispose managed state (managed objects).
					_indices.Save();
					try
					{
						_fs.Flush();
						_fs.Dispose();
					}
					catch
					{

					}
				}

				// TODO: free unmanaged resources (unmanaged objects) and override a finalizer below.
				// TODO: set large fields to null.

				disposedValue = true;
			}
		}

		// TODO: override a finalizer only if Dispose(bool disposing) above has code to free unmanaged resources.
		// ~TextRecords() {
		//   // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
		//   Dispose(false);
		// }

		// This code added to correctly implement the disposable pattern.
		public void Dispose()
		{
			// Do not change this code. Put cleanup code in Dispose(bool disposing) above.
			Dispose(true);
			// TODO: uncomment the following line if the finalizer is overridden above.
			// GC.SuppressFinalize(this);
		}

		#endregion
	}
}
