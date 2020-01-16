using System;


namespace FractalServer
{
	public class RingBuf<T> where T: class
	{
		private readonly int _size;
		private readonly T[] _buf;

		private int _writePtr;
		public int Count { get; private set; }

		private readonly Func<T,T,T> _setterOrCopier;

		public RingBuf(int size, Func<T, T, T> setterOrCopier)
		{
			_size = size;
			_setterOrCopier = setterOrCopier;
			_buf = new T[size];

			_writePtr = 0;
			Count = 0;
		}
		 
		public void Write(T val)
		{
			if (Count < _size)
			{
				_buf[_writePtr] = _setterOrCopier(val, null);
				Count++;
			}
			else
			{
				_buf[_writePtr] = _setterOrCopier(val, _buf[_writePtr]);
			}

			_writePtr++;
			if (_writePtr > _size - 1)
				_writePtr = 0;

		}

		public T Read(int index)
		{
			if (index < 0)
				throw new ArgumentOutOfRangeException("index", "index must be 0 or greater.");

			if(!(index < Count))
				throw new ArgumentOutOfRangeException("index", "index must be less than count.");

			int pos = -1 + _writePtr - index;
			if (pos < 0)
				pos += _size;

			return _buf[pos];
		}
	}
}
