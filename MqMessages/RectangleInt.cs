﻿using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace MqMessages
{
	[Serializable]
	public class RectangleInt : IEqualityComparer<RectangleInt>, IEquatable<RectangleInt>
	{
		public RectangleInt() : this(new PointInt(), new SizeInt()) { }

		public RectangleInt(PointInt point, SizeInt size)
		{
			Point = point;
			Size = size;
		}

		public PointInt Point { get; set; }
		public SizeInt Size { get; set; }

		public bool Equals(RectangleInt x, RectangleInt y)
		{
			if(x == null)
			{
				return y == null;
			}
			else
			{
				return x.Equals(y);
			}
		}

		public override bool Equals(object obj)
		{
			return Equals(obj as RectangleInt);
		}

		public bool Equals(RectangleInt other)
		{
			return other != null &&
				   Point == other.Point &&
				   Size == other.Size;
		}

		public override int GetHashCode()
		{
			var hashCode = 1392910933;
			hashCode = hashCode * -1521134295 + EqualityComparer<PointInt>.Default.GetHashCode(Point);
			hashCode = hashCode * -1521134295 + EqualityComparer<SizeInt>.Default.GetHashCode(Size);
			return hashCode;
		}

		public int GetHashCode(RectangleInt obj)
		{
			return obj.GetHashCode();
		}

		public static bool operator ==(RectangleInt int1, RectangleInt int2)
		{
			return EqualityComparer<RectangleInt>.Default.Equals(int1, int2);
		}

		public static bool operator !=(RectangleInt int1, RectangleInt int2)
		{
			return !(int1 == int2);
		}


		#region ISerializable Implementation
		//public RectangleInt(SerializationInfo info, StreamingContext context)
		//{
		//	Point = info.g
		//}

		//public void GetObjectData(SerializationInfo info, StreamingContext context)
		//{
		//	info.AddValue("Point", Point);
		//	info.AddValue("Size", Size);
		//}
		#endregion
	}
}
