using FSTypes;
using System.Diagnostics;

namespace FractalServer
{
	class ApCell
	{
		public const double SMALL_VALUE = 0.0000000001;

		private const int CNT_MULTIPLIER = 10000;


		public ApDetail[] Details { get; set; }

		public DPoint RefZ { get; private set; }
		public DPoint RefC { get; private set; }

		private double xSq;
		private double ySq;

		private ApCoeffs _coeffs;

		private readonly RingBuf<ApCoeffs> _coeffHistory;
		private readonly RingBuf<DPoint> _zHistory;


		public ApCell(DPoint c, ApDetail[] details)
		{
			RefC = c;
			Details = details;

			RefZ = new DPoint(0, 0);
			xSq = 0;
			ySq = 0;

			_coeffs = new ApCoeffs(3);

			_coeffHistory = new RingBuf<ApCoeffs>(10, CopyOrSet);
			_zHistory = new RingBuf<DPoint>(10, CopyOrSet2);
		}

		public int[] Iterate(int targetIterations)
		{
			int[] result = new int[9];

			int cnt = 0;
			int centerCnt = 0;
			bool isEscaped = false;
			bool centerIsEscaped = false;

			while (!isEscaped && cnt < targetIterations)
			{
				// Compute next E for each neighbor using current value of Z
				UpdateCoefficients(RefZ, _coeffs);

				for (int i = 0; i < 8; i++)
				{
					if (!Details[i].HasEscaped)
					{
						Details[i].ComputeNextE(RefZ);
					}

					if (!Details[i].HasEscaped2)
					{
						Details[i].ComputeNextE2(_coeffs);

						//DPoint diff = Details[i].E - Details[i].E2;
						//if (diff.SizeSquared > SMALL_VALUE)
						//{
						//	Debug.WriteLine($"E is different for detail {i}. The refPt cnt is {centerCnt}.");
						//}
					}
				}

				RefZ.Y = 2 * RefZ.X * RefZ.Y + RefC.Y;
				RefZ.X = xSq - ySq + RefC.X;

				xSq = RefZ.X * RefZ.X;
				ySq = RefZ.Y * RefZ.Y;

				if (xSq + ySq > 4)
				{
					centerIsEscaped = true;
				}
				else
				{
					centerCnt++;
				}

				bool detailsHasEscaped = true;
				bool detailsHasEscaped2 = true;

				for (int i = 0; i < 8; i++)
				{
					if (!Details[i].HasEscaped)
					{
						detailsHasEscaped &= Details[i].ComputeNextZ(RefZ);
					}

					if (!Details[i].HasEscaped2)
					{
						detailsHasEscaped2 &= Details[i].ComputeNextZ2(RefZ);
					}

					if(Details[i].HasEscaped != Details[i].HasEscaped2)
					{
						Debug.WriteLine("Escape Mismatch.");
					}
				}

				cnt++;
				isEscaped = centerIsEscaped && detailsHasEscaped && detailsHasEscaped2;
			}

			result[0] = Details[0].Cnt;
			result[1] = Details[1].Cnt;
			result[2] = Details[2].Cnt;

			result[3] = Details[3].Cnt;
			result[4] = centerCnt;
			result[5] = Details[4].Cnt;

			result[6] = Details[5].Cnt;
			result[7] = Details[6].Cnt;
			result[8] = Details[7].Cnt;

			return result;
		}

		public int[] Iterate1(int targetIterations)
		{
			int[] result = new int[9];

			int cnt = 0;
			int centerCnt = 0;
			bool isEscaped = false;
			bool centerIsEscaped = false;

			while (!isEscaped && cnt < targetIterations)
			{
				// Compute next E for each neighbor using current value of Z
				UpdateCoefficients(RefZ, _coeffs);

				for (int i = 0; i < 8; i++)
				{
					if (!Details[i].HasEscaped)
					{
						Details[i].ComputeNextE(RefZ);
					}
				}

				RefZ.Y = 2 * RefZ.X * RefZ.Y + RefC.Y;
				RefZ.X = xSq - ySq + RefC.X;

				xSq = RefZ.X * RefZ.X;
				ySq = RefZ.Y * RefZ.Y;

				if (xSq + ySq > 4)
				{
					centerIsEscaped = true;
				}
				else
				{
					centerCnt++;
				}

				bool detailsHasEscaped = true;
				for (int i = 0; i < 8; i++)
				{
					if (!Details[i].HasEscaped)
					{
						detailsHasEscaped &= Details[i].ComputeNextZ(RefZ);
					}
				}
				cnt++;
				isEscaped = centerIsEscaped && detailsHasEscaped;
			}

			result[0] = Details[0].Cnt;
			result[1] = Details[1].Cnt;
			result[2] = Details[2].Cnt;

			result[3] = Details[3].Cnt;
			result[4] = centerCnt;
			result[5] = Details[4].Cnt;

			result[6] = Details[5].Cnt;
			result[7] = Details[6].Cnt;
			result[8] = Details[7].Cnt;

			return result;
		}

		public int[] Iterate2(int targetIterations)
		{
			int[] result = new int[9];

			int cnt = 0;
			int centerCnt = 0;
			bool isEscaped = false;
			bool centerIsEscaped = false;

			while (!isEscaped && cnt < targetIterations)
			{
				// Compute next E for each neighbor using current value of Z
				UpdateCoefficients(RefZ, _coeffs);

				for (int i = 0; i < 8; i++)
				{
					if (!Details[i].HasEscaped2)
					{
						Details[i].ComputeNextE2(_coeffs);
					}
				}

				RefZ.Y = 2 * RefZ.X * RefZ.Y + RefC.Y;
				RefZ.X = xSq - ySq + RefC.X;

				xSq = RefZ.X * RefZ.X;
				ySq = RefZ.Y * RefZ.Y;

				if (xSq + ySq > 4)
				{
					centerIsEscaped = true;
				}
				else
				{
					centerCnt++;
				}

				bool detailsHasEscaped2 = true;
				for (int i = 0; i < 8; i++)
				{
					if (!Details[i].HasEscaped2)
					{
						detailsHasEscaped2 &= Details[i].ComputeNextZ2(RefZ);
					}
				}

				cnt++;
				isEscaped = centerIsEscaped && detailsHasEscaped2;
			}

			result[0] = Details[0].Cnt2;
			result[1] = Details[1].Cnt2;
			result[2] = Details[2].Cnt2;

			result[3] = Details[3].Cnt2;
			result[4] = centerCnt;
			result[5] = Details[4].Cnt2;

			result[6] = Details[5].Cnt2;
			result[7] = Details[6].Cnt2;
			result[8] = Details[7].Cnt2;

			return result;
		}

		public int[] Iterate3(int targetIterations)
		{
			int[] result = new int[9];

			int centerCnt = IterateCentral(targetIterations);

			RefZ = _zHistory.Read(_zHistory.Count - 1);
			xSq = RefZ.X * RefZ.X;
			ySq = RefZ.Y * RefZ.Y;
			_coeffs = _coeffHistory.Read(_coeffHistory.Count - 1);

			int cnt = centerCnt - (_coeffHistory.Count - 1);

			for (int i = 0; i < 8; i++)
			{
				Details[i].Cnt2 = cnt;
			}

			bool isEscaped = false;

			while (!isEscaped && cnt < targetIterations)
			{
				// Compute next E for each neighbor using current value of Z
				UpdateCoefficients(RefZ, _coeffs);

				for (int i = 0; i < 8; i++)
				{
					if (!Details[i].HasEscaped2)
					{
						Details[i].ComputeNextE2(_coeffs);
					}
				}

				RefZ.Y = 2 * RefZ.X * RefZ.Y + RefC.Y;
				RefZ.X = xSq - ySq + RefC.X;

				xSq = RefZ.X * RefZ.X;
				ySq = RefZ.Y * RefZ.Y;

				isEscaped = true;
				for (int i = 0; i < 8; i++)
				{
					if (!Details[i].HasEscaped2)
					{
						isEscaped &= Details[i].ComputeNextZ2(RefZ);
					}
				}

				cnt++;
			}

			result[0] = Details[0].Cnt2 * CNT_MULTIPLIER;
			result[1] = Details[1].Cnt2 * CNT_MULTIPLIER; ;
			result[2] = Details[2].Cnt2 * CNT_MULTIPLIER; ;

			result[3] = Details[3].Cnt2 * CNT_MULTIPLIER; ;
			result[4] = centerCnt * CNT_MULTIPLIER;
			result[5] = Details[4].Cnt2 * CNT_MULTIPLIER; ;

			result[6] = Details[5].Cnt2 * CNT_MULTIPLIER; ;
			result[7] = Details[6].Cnt2 * CNT_MULTIPLIER; ;
			result[8] = Details[7].Cnt2 * CNT_MULTIPLIER; ;

			return result;
		}

		private int IterateCentral(int targetIterations)
		{
			int centerCnt = 0;
			while (centerCnt < targetIterations)
			{
				_zHistory.Write(RefZ);
				_coeffHistory.Write(_coeffs);

				UpdateCoefficients(RefZ, _coeffs);

				RefZ.Y = 2 * RefZ.X * RefZ.Y + RefC.Y;
				RefZ.X = xSq - ySq + RefC.X;

				xSq = RefZ.X * RefZ.X;
				ySq = RefZ.Y * RefZ.Y;

				if (xSq + ySq > 4)
				{
					break;
				}

				centerCnt++;
			}

			return centerCnt;
		}

		private void UpdateCoefficients(DPoint z, ApCoeffs coeffs)
		{
			DPoint twoZ = new DPoint(z).Scale(2); // z * 2;

			DPoint ta = twoZ * coeffs[0]; // 2z * a + 1;
			ta.X += 1;

			DPoint tb = twoZ * coeffs[1] + coeffs[0] * coeffs[0]; // 2z * b + a^2

			DPoint tc = twoZ * coeffs[2] + new DPoint(coeffs[0]).Scale(2) * coeffs[1]; // twoZ * C + 2ab

			coeffs[0].CopyFrom(ta);
			coeffs[1].CopyFrom(tb);
			coeffs[2].CopyFrom(tc);
		}

		private ApCoeffs CopyOrSet(ApCoeffs source, ApCoeffs dest)
		{
			if (dest == null)
			{
				ApCoeffs temp = new ApCoeffs(source);
				return temp;
			}
			else
			{
				dest.CopyFrom(source);
				return dest;
			}
		}

		private DPoint CopyOrSet2(DPoint source, DPoint dest)
		{
			if (dest == null)
			{
				DPoint temp = new DPoint(source);
				return temp;
			}
			else
			{
				dest.CopyFrom(source);
				return dest;
			}
		}

	}
}
