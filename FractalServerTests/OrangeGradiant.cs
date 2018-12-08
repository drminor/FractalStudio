using Hjg.Pngcs;
using Hjg.Pngcs.Chunks;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace FractalServerTests
{
    [TestClass]
    public class OrangeGradiant
    {
        [TestMethod]
        public void CreateImg()
        {
            string path = @"C:\OrangeGrad.png";
            int width = 200;
            int height = 200;

            Create(path, width, height);
        }

        private void Create(string filename, int cols, int rows)
        {
            ImageInfo imi = new ImageInfo(cols, rows, 8, false); // 8 bits per channel, no alpha 

            // open image for writing 
            PngWriter png = FileHelper.CreatePngWriter(filename, imi, true);

            // add some optional metadata (chunks)
            png.GetMetadata().SetDpi(100.0);
            png.GetMetadata().SetTimeNow(0); // 0 seconds fron now = now
            png.GetMetadata().SetText(PngChunkTextVar.KEY_Title, "Just a text image");

            PngChunk chunk = png.GetMetadata().SetText("my key", "my text .. bla bla");

            chunk.Priority = true; // this chunk will be written as soon as possible
            ImageLine iline = new ImageLine(imi);

            for (int col = 0; col < imi.Cols; col++)
            { // this line will be written to all rows  
                int r = 255;
                int g = 127;
                int b = 255 * col / imi.Cols;
                ImageLineHelper.SetPixel(iline, col, r, g, b); // orange-ish gradient
            }

            for (int row = 0; row < png.ImgInfo.Rows; row++)
            {
                png.WriteRow(iline, row);
            }

            png.End();
        }

        //public static PngChunkTextVar Chunk { get; set; }
    }
}
