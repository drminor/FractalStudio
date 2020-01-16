using System;
using System.Diagnostics;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace Apfp.Test
{
	[TestClass]
	public class UnitTest1
	{
		[TestMethod]
		public void TestDComponents()
		{
			DComponents t = new DComponents(8);
			string st1 = t.ToBase2String(true);
			string st2 = t.ToBase2String(false);
		}

		[TestMethod]
		public void TestSplitDouble()
		{
			double x = double.Parse("12.012345678901234");
			DComponents dComponents = new DComponents(x);

			double splitMult = Math.Pow(2, 25) + 1.0;

			double temp = x * splitMult;

			double hi = temp - (temp - x);
			double lo = x - hi;

			string s1 = dComponents.ToBase2String(true);
			string s2 = new DComponents(hi).ToBase2String(true);
			string s3 = new DComponents(lo).ToBase2String(true);
		}

		[TestMethod]
		public void TestCreateFp()
		{
			double One256th = 0.00390625;
			double One1024th = Math.Pow(2, -10);

			double t = 12;
			t += One256th;
			t += One1024th;

			Fp a = new Fp(t);

			a.ReportDigitsBin();

			double tc = a.GetDouble();
			DComponents dtc = new DComponents(tc);

			Debug.WriteLine($"The recombined value is {dtc.ToBase2String(false)}, (Decimal: {tc}).");
		}

		[TestMethod]
		public void TestMultiply()
		{
			double One16th = Math.Pow(2, -4);
			double One256th = Math.Pow(2, -8);
			double One1024th = Math.Pow(2, -10);

			double t = 4;
			t += 3 * One16th;
			t += 2 * One256th;
			t += One1024th;

			Fp a = new Fp(t);
			a.ReportDigitsBin();

			double t2 = 2;
			t2 += 2 * One16th;
			t2 += One256th;
			t2 += One1024th;

			Fp b = new Fp(t2);
			b.ReportDigitsBin();

			Fp p = Fp.Mul(a, b);
		}

		[TestMethod]
		public void TestMultiplyR()
		{
			double t = 4.34432;
			Fp a = new Fp(t);
			a.ReportDigitsBin();

			double t2 = 2.89967;
			Fp b = new Fp(t2);
			b.ReportDigitsBin();

			Fp p = Fp.Mul(a, b);
			p.ReportDigitsBin();

			double t3 = t * t2;
			Fp c = new Fp(t3);
			c.ReportDigitsBin();

		}

		[TestMethod]
		public void TestMultiplyER()
		{
			double t = 1.000123456;
			Fp a = new Fp(t);
			a.ReportDigitsBin();

			double t2 = 1.00278654;
			Fp b = new Fp(t2);
			b.ReportDigitsBin();

			for(int i = 0; i < 100; i++)
			{
				Fp p = Fp.Mul(a, b);
				a = new Fp(p);
				a.ReportDigitsBin();

				t = t * t2;
			}


			double t3 = t * t2;
			Fp c = new Fp(t3);
			c.ReportDigitsBin();

		}

		[TestMethod]
		public void TestAdd()
		{
			double One16th = Math.Pow(2, -4);
			double One256th = Math.Pow(2, -8);
			double One1024th = Math.Pow(2, -10);

			double t = 4;
			t += 3 * One16th;
			t += 2 * One256th;
			t += One1024th;

			Fp a = new Fp(t);
			a.ReportDigitsBin();

			double t2 = 2;
			t2 += 2 * One16th;
			t2 += One256th;
			t2 += One1024th;

			Fp b = new Fp(t2);
			b.ReportDigitsBin();

			Fp p = Fp.Add(a, b);

			p.ReportDigitsBin();
		}

	}
}
