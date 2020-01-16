using FSTypes;

namespace FractalServer
{
	class ApDetail
	{
		public readonly DPoint D;

		public DPoint Z { get; private set; }
		public DPoint E { get; private set; }

		public int Cnt { get; private set; }
		public bool HasEscaped { get; private set; }

		public DPoint Z2 { get; private set; }
		public DPoint E2 { get; private set; }

		public int Cnt2 { get; set; }
		public bool HasEscaped2 { get; private set; }

		public ApDetail(DPoint d)
		{
			D = d;

			Z = new DPoint(0, 0);
			E = new DPoint(0, 0);

			Cnt = 0;
			HasEscaped = false;

			Z2 = new DPoint(0, 0);
			E2 = new DPoint(0, 0);

			Cnt2 = 0;
			HasEscaped2 = false;
		}

		public void ComputeNextE(DPoint curZ)
		{
			DPoint t = new DPoint(curZ).Scale(2);
			E = t * E + E * E + D;
		}

		public void ComputeNextE2(ApCoeffs coeffs)
		{
			E2 = coeffs[0] * D; // A * D

			DPoint t = D * D; // D^2
			E2 += coeffs[1] * t;  //B * D^2;

			E2 += coeffs[2] * t * D; // C * D^3;
		}

		public bool ComputeNextZ(DPoint nextZ)
		{
			Z.X = nextZ.X + E.X;
			Z.Y = nextZ.Y + E.Y;

			if(Z.X * Z.X + Z.Y * Z.Y > 4)
			{
				HasEscaped = true;
			}
			else
			{
				Cnt++;
			}

			return HasEscaped;
		}

		public bool ComputeNextZ2(DPoint nextZ)
		{
			Z2.X = nextZ.X + E2.X;
			Z2.Y = nextZ.Y + E2.Y;

			if (Z2.X * Z2.X + Z2.Y * Z2.Y > 4)
			{
				HasEscaped2 = true;
			}
			else
			{
				Cnt2++;
			}

			return HasEscaped2;
		}
	}
}
