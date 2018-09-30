var MAX_CANVAS_WIDTH = 5000;
var MAX_CANVAS_HEIGHT = 5000;

var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
}());

var MapInfo = /** @class */ (function () {
    function MapInfo(bottomLeft, topRight, maxInterations) {
        this.bottomLeft = bottomLeft;
        this.topRight = topRight;
        this.maxInterations = maxInterations;
    }
    return MapInfo;
}());


var CanvasSize = /** @class */ (function () {
    function CanvasSize(width, height) {
        this.width = width;
        this.height = height;
        if (!this.isReasonableExtent(this.width, MAX_CANVAS_WIDTH)) {
            alert('Width is invalid');
        }
        if (!this.isReasonableExtent(this.height, MAX_CANVAS_HEIGHT)) {
            alert('Height is invalid');
        }
    }
    CanvasSize.prototype.isReasonableExtent = function (nVal, max) {
        return isFinite(nVal) && nVal > 0 && nVal <= max && Math.floor(nVal) === nVal;
    };
    return CanvasSize;
}());


var MapWorkingData = /** @class */ (function () {
    //public alive: boolean = true;
    function MapWorkingData(canvasSize, mapInfo) {
        this.canvasSize = canvasSize;
        this.mapInfo = mapInfo;
        this.elementCount = this.getNumberOfElementsForCanvas(this.canvasSize);
        this.wAData = new Float64Array(this.elementCount); // All elements now have a value of zero.
        this.wBData = new Float64Array(this.elementCount); // All elements now have a value of zero.
        this.cnts = new Uint16Array(this.elementCount);
        this.flags = new Uint8Array(this.elementCount);
        // X coordinates get larger as one moves from the left of the map to  the right.
        this.xVals = this.buildVals(this.canvasSize.width, this.mapInfo.bottomLeft.x, this.mapInfo.topRight.x);
        // Y coordinates get larger as one moves from the bottom of the map to the top.
        this.yVals = this.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
        // Assume that this map will contain at least on point in the set, until proven otherwise.
        //this.alive = true;
    }
    // Calculate the number of elements in our single dimension data array needed to cover the
    // two-dimensional map.
    MapWorkingData.prototype.getNumberOfElementsForCanvas = function (cs) {
        return cs.width * cs.height;
    };
    // Build the array of 'c' values for one dimension of the map.
    MapWorkingData.prototype.buildVals = function (canvasExtent, start, end) {
        var result = new Array(canvasExtent);
        var mapExtent = end - start;
        var unitExtent = mapExtent / canvasExtent;
        var i;
        for (i = 0; i < canvasExtent; i++) {
            result[i] = start + i * unitExtent;
        }
        return result;
    };
    //public getLinearIndex(x:number, y:number): number {
    //  return x + y * this.canvasSize.width;
    //}
    // Returns the index to use when accessing wAData, wBData, cnts or flags.
    MapWorkingData.prototype.getLinearIndex = function (c) {
        return c.x + c.y * this.canvasSize.width;
    };
    // Calculates z squared + c
    MapWorkingData.prototype.getNextVal = function (z, c) {
        var result = new Point(z.x * z.x - z.y * z.y + c.x, 2 * z.x * z.y + c.y);
        return result;
    };
    // Returns the square of the magnitude of a complex number where a is the real component and b is the complex component.
    MapWorkingData.prototype.getAbsSizeSquared = function (z) {
        var result = z.x * z.x + z.y * z.y;
        return result;
    };
    // Takes the current value of z for a given coordinate,
    // calculates the next value
    // and updates the current value with this next value.
    // If the 'done' flag is set, no update is made.
    //
    // If the magnitude of the new value is greater than 2 (the square of the magnitude > 4) then it sets the 'done' flag
    // Returns the (new) value of the 'done' flag for this coordinate.
    MapWorkingData.prototype.iterateElement = function (mapCoordinate, iterCount) {
        var ptr = this.getLinearIndex(mapCoordinate);
        if (this.flags[ptr] === 1) {
            // This point has been flagged, don't iterate.
            return true;
        }
        var z = new Point(this.wAData[ptr], this.wBData[ptr]);
        var c = new Point(this.xVals[mapCoordinate.x], this.yVals[mapCoordinate.y]);
        var cntr;
        for (cntr = 0; cntr < iterCount; cntr++) {
            z = this.getNextVal(z, c);
            if (this.getAbsSizeSquared(z) > 4) {
                // This point is done.
                this.flags[ptr] = 1;
                break;
            }
        }
        // Store the new value back to our Working Data.
        this.wAData[ptr] = z.x;
        this.wBData[ptr] = z.y;
        // Increment the number of times this point has been iterated.
        this.cnts[ptr] = this.cnts[ptr] + cntr;
        return this.flags[ptr] === 1;
        //const aSize = this.getAbsSizeSquared(z);
        //// Increment the number of times this point has been iterated.
        //this.cnts[ptr] = this.cnts[ptr] + iterCount;
        //if (aSize > 4) {
        //  // This point is done.
        //  this.flags[ptr] = 1;
        //  return true;
        //}
        //else {
        //  // This point is still 'alive'.
        //  return false;
        //}
    };
    // Updates each element for a given line by performing a single interation.
    // Returns true if at least one point is not done.
    MapWorkingData.prototype.doInterationsForLine = function (iterCount, y) {
        var stillAlive = false; // Assume all done until one is found that is not done.
        var x;
        for (x = 0; x < this.canvasSize.width; x++) {
            var pointIsDone = this.iterateElement(new Point(x, y), iterCount);
            if (!pointIsDone)
                stillAlive = true;
        }
        return stillAlive;
    };
    // Updates each element by performing a single interation.
    // Returns true if at least one point is not done.
    MapWorkingData.prototype.doInterationsForAll = function (iterCount) {
        var stillAlive = false; // Assume all done until one is found that is not done.
        var x;
        var y;
        for (y = 0; y < this.canvasSize.height; y++) {
            for (x = 0; x < this.canvasSize.width; x++) {
                var pointIsDone = this.iterateElement(new Point(x, y), iterCount);
                if (!pointIsDone)
                    stillAlive = true;
            }
        }
        return stillAlive;
    };
    //public doInterationsForAll_OLD(iterCount: number): boolean {
    //  var i: number;
    //  let stillAlive: boolean = true;
    //  for (i = 0; i < iterCount && stillAlive; i++) {
    //    stillAlive = this.iterateAllElements(iterCount);
    //  }
    //  // Store the value of whether we still alive in our public member for easy access.
    //  this.alive = stillAlive;
    //  return stillAlive;
    //}
    //public doInterationsForLine(iterCount: number, y: number): boolean {
    //  return true;
    //}
    MapWorkingData.prototype.getImageData = function () {
        var imageData = new ImageData(this.canvasSize.width, this.canvasSize.height);
        this.updateImageData(imageData);
        return imageData;
    };
    MapWorkingData.prototype.getImageDataForLine = function (y) {
        var imageData = new ImageData(this.canvasSize.width, 1);
        this.updateImageData(imageData);
        return imageData;
    };
    MapWorkingData.prototype.updateImageData = function (imageData) {
        var data = imageData.data;
        if (data.length !== 4 * this.elementCount) {
            console.log("The imagedata data does not have the correct number of elements.");
            return;
        }
        var i = 0;
        for (; i < this.elementCount; i++) {
            var inTheSet = this.flags[i] === 0;
            this.setPixelValueBinary(inTheSet, i * 4, data);
        }
    };
    MapWorkingData.prototype.updateImageDataForLine = function (imageData, y) {
        var data = imageData.data;
        if (data.length !== 4 * this.canvasSize.width) {
            console.log("The imagedata data does not have the correct number of elements.");
            return;
        }
        var start = this.getLinearIndex(new Point(0, y));
        var end = start + this.canvasSize.width;
        var i;
        for (i = start; i < end; i++) {
            var inTheSet = this.flags[i] === 0;
            this.setPixelValueBinary(inTheSet, i * 4, data);
        }
    };
    MapWorkingData.prototype.setPixelValueBinary = function (on, ptr, imageData) {
        if (on) {
            // Points within the set are drawn in black.
            imageData[ptr] = 0;
            imageData[ptr + 1] = 0;
            imageData[ptr + 2] = 0;
            imageData[ptr + 3] = 255;
        }
        else {
            // Points outside the set are drawn in white.
            imageData[ptr] = 255;
            imageData[ptr + 1] = 255;
            imageData[ptr + 2] = 255;
            imageData[ptr + 3] = 255;
        }
    };
    // Returns a 'regular' linear array of booleans from the flags TypedArray.
    MapWorkingData.getFlagData = function (mapWorkingData) {
        var result = new Array(mapWorkingData.elementCount);
        var i;
        for (i = 0; i < result.length; i++) {
            result[i] = mapWorkingData.flags[i] !== 0;
        }
        return result;
    };
    return MapWorkingData;
}());

//
// Worker Logic
//

var mapWorkingData = null;
var workResult = { mt: '' };

// Handles messages sent from the window that started this web worker.
onmessage = function (e) {

  console.log('Worker received message: ' + e.data + '.');

  if (e.data === 'Start') {

    var cs = new CanvasSize(690, 460);
    var bl = new Point(-2, -1);
    var tr = new Point(1, 1);
    var maxI = 1000;
    var mi = new MapInfo(bl, tr, maxI);

    mapWorkingData = new MapWorkingData(cs, mi);

    console.log('Worker created MapWorkingData with element count = ' + mapWorkingData.elementCount);

    workerResult = { mt: 'Start Response' };
    console.log('Posting ' + workerResult.mt + ' back to main script');
    self.postMessage(workerResult);
  }

  if (e.data === 'Iterate') {
    mapWorkingData.doInterationsForAll(1);
    var imageData = mapWorkingData.getImageData();
    workerResult = {
      mt: 'UpdatedMapData',
      lineNumber: -1,
      img: imageData.data
    };
    console.log('Posting ' + workerResult.mt + ' back to main script');

    self.postMessage(workerResult, [imageData.data.buffer]);
  }

  if (e.data === 'GetMapUpdate') {

    //mapWorkingData.doInterationsForAll(1);
    workerResult = { mt: 'GetMapUpdate Response' };
    console.log('Posting ' + workerResult.mt + ' back to main script');
    self.postMessage(workerResult);
  }


};
//# sourceMappingURL=m-map-common.js.map
