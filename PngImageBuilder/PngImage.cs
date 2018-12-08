using System;
using System.IO;
using Hjg.Pngcs;

namespace PngImageBuilder
{
    public class PngImage : IDisposable
    {
        private readonly Stream OutputStream;
        private readonly ImageInfo imi;
        private readonly PngWriter png;
        private int curRow;

        public readonly string Path;
        public readonly ImageLine ImageLine;

        public PngImage(string path, int width, int height)
        {
            Path = path;
            OutputStream = File.Open(Path, FileMode.CreateNew, FileAccess.Write, FileShare.Read);

            imi = new ImageInfo(width, height, 8, false); // 8 bits per channel, no alpha 
            png = new PngWriter(OutputStream, imi, path);
            ImageLine = new ImageLine(imi);
            curRow = 0;
        }

        public void WriteLine(int[] pixelData)
        {
            ImageLine iLine = new ImageLine(imi);
            for(int ptr = 0; ptr < pixelData.Length; ptr++)
            {
                ImageLineHelper.SetPixelFromARGB8(iLine, ptr, pixelData[ptr]);
            }

            png.WriteRow(iLine, curRow++);
        }

        public void WriteLine(ImageLine iline)
        {
            png.WriteRow(iline, curRow++);
        }

        #region IDisposable Support

        private bool disposedValue = false; // To detect redundant calls

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    png.End();
                }

                // Free unmanaged resources (unmanaged objects) here and override a finalizer below.
                // Set large fields to null here.
                disposedValue = true;
            }
        }

        // Override a finalizer only if Dispose(bool disposing) above has code to free unmanaged resources.
        // ~PngImage() {
        //   // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
        //   Dispose(false);
        // }

        // This code added to correctly implement the disposable pattern.
        public void Dispose()
        {
            // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
            Dispose(true);
            // Uncomment the following line if the finalizer is overridden above.
            // GC.SuppressFinalize(this);
        }

        #endregion
    }
}
