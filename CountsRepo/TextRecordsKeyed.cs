using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization;
using System.Text;

namespace CountsRepo
{
    // Record
    class IndexEntry<K> where K: ISerializable, IEqualityComparer<K>
	{
		public IndexEntry(uint offset, uint valueLength, string serializedKey)
		{
			Offset = offset;
			ValueLength = valueLength;
			SerializedKey = serializedKey;
			KeyLength = serializedKey.Length;

			SerializationHelper.Deserialize(serializedKey, out K temp);
			Key = temp;
		}

		public IndexEntry(uint offset, uint valueLength, K key)
		{
			Offset = offset;
			ValueLength = valueLength;
			Key = key;

			SerializedKey = GetKeyAsString(key);
			KeyLength = SerializedKey.Length;
		}

		public uint Offset { get; set; }
        public uint ValueLength { get; set; }

		public int KeyLength { get; }
		public string SerializedKey { get; }
		public K Key { get; }

		private string GetKeyAsString(K key)
		{
			StringBuilder sb = new StringBuilder();
			SerializationHelper.Serialize(key, ref sb);

			return sb.ToString();
		}
	}

    class IndexKeys<K> where K: ISerializable, IEqualityComparer<K>
    {
		private Dictionary<K, IndexEntry<K>> _indexes;

        public readonly string IndexFilename;
        public bool IsDirty { get; set; }
        
        public IndexKeys(string indexfilename)
        {
			IndexFilename = indexfilename;
			_indexes = new Dictionary<K, IndexEntry<K>>();
			Load();
            IsDirty = false;
        }

        // Loads index from index file
        private void Load()
        {
            if (!File.Exists(IndexFilename))
            {
				throw new FileNotFoundException($"The file {IndexFilename} does not exist.");
            }

            using (var fs=File.OpenRead(IndexFilename))
            {
                using (var br = new BinaryReader(fs))
                {
                    while (br.BaseStream.Position != br.BaseStream.Length)
                    {
						uint offset = br.ReadUInt32();
						uint valLength = br.ReadUInt32();
						int keyLength = br.ReadInt32();

						char[] keyCharArray = br.ReadChars(keyLength);
						string serializedKey = new string(keyCharArray);
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
            using (var fs = File.OpenWrite(IndexFilename))
            {
                using (var bw = new BinaryWriter(fs))
                {
					foreach(IndexEntry<K> indexRec in _indexes.Values)
                    {
                        bw.Write(indexRec.Offset);
                        bw.Write(indexRec.ValueLength);
						bw.Write(indexRec.KeyLength);

						char[] keyCharArray = indexRec.SerializedKey.ToCharArray();
						bw.Write(keyCharArray);
                    }
                }
            }
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

    public class ValueRecords<K,V> : IDisposable where K: ISerializable, IEqualityComparer<K> where V: ISerializable
    {
		public const string WORKING_DIR = @"c:\dice";
		private static readonly string TEMP_FILE_NAME = Path.Combine(WORKING_DIR, @"tempdata.dat");
		private static readonly string BAK_FILE_NAME = Path.Combine(WORKING_DIR, @"tempdata.bak");

		private IndexKeys<K> _indices;
        private FileStream _fs;

		private StringBuilder _sbBuffer;

        public ValueRecords(string indexFilename, string textFilename)
        {
			_indices = new IndexKeys<K>(indexFilename);
			_fs = new FileStream(textFilename, FileMode.OpenOrCreate);
			TextFilename = textFilename;

			_sbBuffer = new StringBuilder();
		}

		public readonly string TextFilename;
		public string IndexFilename => _indices.IndexFilename;

		// Adds a value by key, optionally saves index
		public void Add(K key, V value, bool saveIndex = false)
        {
            _fs.Seek(0, SeekOrigin.End);
            var offset = (uint) _fs.Position;

			SerializationHelper.Serialize(value, ref _sbBuffer);
			string serializedValue = _sbBuffer.ToString();

			using (var bw = new BinaryWriter(_fs, Encoding.UTF8, true))
            {

                bw.Write(serializedValue);
            }

            _indices.AddIndex(offset, (uint)serializedValue.Length, key);

            if (saveIndex)
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

			SerializationHelper.Serialize(value, ref _sbBuffer);
			string serializedValue = _sbBuffer.ToString();


			if (serializedValue.Length > record.ValueLength)
            {
                _fs.Seek(0, SeekOrigin.End);            
                record.Offset = (uint)_fs.Position;
            }       
            else
            {
				// just change length
				_fs.Seek(record.Offset, SeekOrigin.Begin);
            }

            record.ValueLength = (uint)serializedValue.Length;

            using (var bw = new BinaryWriter(_fs, Encoding.UTF8, true))
            {
                bw.Write(serializedValue);
            }

            _indices.IsDirty = true; // Makes sure Indices are rewritten
        }

        public void Update()
        {
            _indices.Save();
        }

        public V GetValue(K key)
        {
            var record = _indices.GetIndex(key);

            if (record == null)
            {
				return default(V);
            }

            using (var br = new BinaryReader(_fs, Encoding.UTF8,true))
            {
                _fs.Seek(record.Offset, SeekOrigin.Begin);
				string serializedValue = br.ReadString();

				SerializationHelper.Deserialize(serializedValue, out V obj);

				return obj;
            }
        }

        // creates a temp file then renames the old one
        public ValueRecords<K, V> Compress()
        {
            File.Delete(BAK_FILE_NAME);
            File.Delete(TEMP_FILE_NAME);
   
            using (var newfs = File.OpenWrite(TEMP_FILE_NAME))
            {
                using (var br = new BinaryReader(_fs))
                {
                    using (var bw = new BinaryWriter(newfs))
                    {
						foreach (IndexEntry<K> indexRec in _indices.IndexEntries)
						{
                            _fs.Seek(indexRec.Offset, SeekOrigin.Begin);

                            var str = br.ReadString();
                            indexRec.Offset = (uint)newfs.Position;
                            indexRec.ValueLength = (uint)str.Length;
                            bw.Write(str);
                        }
                    }
                }
            }

            _indices.IsDirty = true;

			Dispose();

            File.Move(TextFilename, BAK_FILE_NAME);
            File.Move(TEMP_FILE_NAME, TextFilename);

			return new ValueRecords<K,V>(IndexFilename, TextFilename);
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
