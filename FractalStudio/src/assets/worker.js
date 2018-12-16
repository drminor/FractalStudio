var __extends = this && this.__extends || (function () {
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf ||
      { __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; } ||
      function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
})();
var MAX_CANVAS_WIDTH = 50000;
var MAX_CANVAS_HEIGHT = 50000;
var HistArrayPair = /** @class */ (function () {
  function HistArrayPair(vals, occurances) {
    this.vals = vals;
    this.occurances = occurances;
  }
  return HistArrayPair;
}());
var HistEntry = /** @class */ (function () {
  function HistEntry(val, occurances) {
    this.val = val;
    this.occurances = occurances;
  }
  HistEntry.prototype.toString = function () {
    return this.val.toString() + ': ' + this.occurances.toString();
  };
  return HistEntry;
}());
var Histogram = /** @class */ (function () {
  function Histogram() {
    this.entriesMap = new Map();
  }
  Histogram.prototype.getHistEntriesAsString = function () {
    var result = '';
    var hEntries = this.histEntries;
    var ptr;
    for (ptr = 0; ptr < hEntries.length; ptr++) {
      var he = hEntries[ptr];
      result = result + he.toString() + '\n';
    }
    return result;
  };
  Object.defineProperty(Histogram.prototype, "histEntries", {
    get: function () {
      var result = [];
      var lst = Array.from(this.entriesMap.entries());
      var ptr;
      for (ptr = 0; ptr < lst.length; ptr++) {
        result.push(new HistEntry(lst[ptr]["0"], lst[ptr]["1"]));
      }
      return result;
    },
    enumerable: true,
    configurable: true
  });
  Histogram.prototype.getHistArrayPair = function () {
    //var vals = new Uint16Array(this.entriesMap.size);
    //var occs = new Uint16Array(this.entriesMap.size);
    //var vlst = Array.from(this.entriesMap.keys());
    //var olst = Array.from(this.entriesMap.values());
    //var ptr;
    //for (ptr = 0; ptr < vlst.length; ptr++) {
    //  vals[ptr] = vlst[ptr];
    //  occs[ptr] = olst[ptr];
    //}

    var vals = new Uint16Array(Array.from(this.entriesMap.keys()));
    var occs = new Uint16Array(Array.from(this.entriesMap.values()));


    var result = new HistArrayPair(vals, occs);
    return result;
  };
  Histogram.prototype.addVal = function (val) {
    var exEntry = this.entriesMap.get(val);
    if (exEntry === undefined) {
      this.entriesMap.set(val, 1);
    }
    else {
      this.entriesMap.set(val, exEntry + 1);
    }
  };
  Histogram.prototype.addVals = function (vals) {
    if (!vals || vals.length === 0)
      return;
    var lastVal = vals[0];
    var lastOcc = this.entriesMap.get(lastVal);
    lastOcc = lastOcc === undefined ? 1 : lastOcc + 1;
    var ptr;
    for (ptr = 1; ptr < vals.length; ptr++) {
      var val = vals[ptr];
      if (val === lastVal) {
        lastOcc++;
      }
      else {
        this.entriesMap.set(lastVal, lastOcc);
        lastOcc = this.entriesMap.get(val);
        lastOcc = lastOcc === undefined ? 1 : lastOcc + 1;
        lastVal = val;
      }
    }
    if (!(lastVal === undefined)) {
      this.entriesMap.set(lastVal, lastOcc);
    }
  };
  Histogram.fromHistArrayPair = function (arrayPair) {
    var result = new Histogram();
    var ptr;
    for (ptr = 0; ptr < arrayPair.vals.length; ptr++) {
      result.entriesMap.set(arrayPair.vals[ptr], arrayPair.occurances[ptr]);
    }
    return result;
  };
  Histogram.prototype.addFromArrayPair = function (arrayPair) {
    var ptr;
    for (ptr = 0; ptr < arrayPair.vals.length; ptr++) {
      var val = arrayPair.vals[ptr];
      var occ = this.entriesMap.get(val);
      if (occ === undefined) {
        this.entriesMap.set(val, arrayPair.occurances[ptr]);
      }
      else {
        this.entriesMap.set(val, occ + arrayPair.occurances[ptr]);
      }
    }
  };
  return Histogram;
}());
var MapInfoWithColorMap = /** @class */ (function () {
  function MapInfoWithColorMap(mapInfo, colorMapUi) {
    this.mapInfo = mapInfo;
    this.colorMapUi = colorMapUi;
  }
  MapInfoWithColorMap.fromForExport = function (miwcm) {
    // Create a new MapInfo from the loaded data.
    var mapInfo = MapInfo.fromIMapInfo(miwcm.mapInfo);
    // Create a new ColorMapUI from the loaded data.
    var colorMap = ColorMapUI.FromColorMapForExport(miwcm.colorMap);
    var result = new MapInfoWithColorMap(mapInfo, colorMap);
    return result;
  };
  return MapInfoWithColorMap;
}());
var MapInfoWithColorMapForExport = /** @class */ (function () {
  function MapInfoWithColorMapForExport(mapInfo, colorMap) {
    this.mapInfo = mapInfo;
    this.colorMap = colorMap;
  }
  return MapInfoWithColorMapForExport;
}());
var Point = /** @class */ (function () {
  function Point(x, y) {
    this.x = x;
    this.y = y;
  }
  Point.fromStringVals = function (strX, strY) {
    var xNum = parseFloat(strX);
    var yNum = parseFloat(strY);
    var result = new Point(xNum, yNum);
    return result;
  };
  return Point;
}());
var Box = /** @class */ (function () {
  function Box(botLeft, topRight) {
    this.botLeft = botLeft;
    this.topRight = topRight;
  }
  Box.fromPointExtent = function (point, width, height) {
    var result = new Box(point, new Point(point.x + width, point.y + height));
    return result;
  };
  Object.defineProperty(Box.prototype, "width", {
    get: function () {
      return this.end.x - this.start.x;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Box.prototype, "height", {
    get: function () {
      return this.end.y - this.start.y;
    },
    enumerable: true,
    configurable: true
  });
  // Return a box of the same size and position
  // but make sure that the width and height are both positive.
  Box.prototype.getNormalizedBox = function () {
    var box = this;
    var sx;
    var sy;
    var ex;
    var ey;
    if (box.botLeft.x < box.topRight.x) {
      if (box.botLeft.y < box.topRight.y) {
        // Already in normal form.
        sx = box.botLeft.x;
        ex = box.topRight.x;
        sy = box.botLeft.y;
        ey = box.topRight.y;
      }
      else {
        // Width is already positive, reverse the y values.
        sx = box.botLeft.x;
        ex = box.topRight.x;
        sy = box.topRight.y;
        ey = box.botLeft.y;
      }
    }
    else {
      if (box.botLeft.y < box.topRight.y) {
        // Height is already positive, reverse the x values.
        sx = box.topRight.x;
        ex = box.botLeft.x;
        sy = box.botLeft.y;
        ey = box.topRight.y;
      }
      else {
        // Reverse both x and y values.
        sx = box.topRight.x;
        ex = box.botLeft.x;
        sy = box.topRight.y;
        ey = box.botLeft.y;
      }
    }
    var result = new Box(new Point(this.round(sx), this.round(sy)), new Point(this.round(ex), this.round(ey)));
    return result;
  };
  Box.prototype.round = function (x) {
    var result = parseInt((x + 0.5).toString(), 10);
    return result;
  };
  Box.prototype.toString = function () {
    return 'sx:' + this.botLeft.x + ' ex:' + this.topRight.x + ' sy:' + this.botLeft.y + ' ey:' + this.topRight.y + '.';
  };
  return Box;
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
var MapInfo = /** @class */ (function () {
  function MapInfo(coords, maxIterations, iterationsPerStep) {
    this.coords = coords;
    this.maxIterations = maxIterations;
    this.iterationsPerStep = iterationsPerStep;
  }
  MapInfo.fromPoints = function (bottomLeft, topRight, maxIterations, iterationsPerStep) {
    var coords = new Box(bottomLeft, topRight);
    var result = new MapInfo(coords, maxIterations, iterationsPerStep);
    return result;
  };
  MapInfo.fromIMapInfo = function (mi) {
    var result = new MapInfo(mi.coords, mi.maxIterations, mi.iterationsPerStep);
    return result;
  };
  Object.defineProperty(MapInfo.prototype, "bottomLeft", {
    get: function () {
      return this.coords.botLeft;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(MapInfo.prototype, "topRight", {
    get: function () {
      return this.coords.topRight;
    },
    enumerable: true,
    configurable: true
  });
  MapInfo.prototype.toString = function () {
    return 'sx:' + this.coords.botLeft.x + ' ex:' + this.coords.topRight.x + ' sy:' + this.coords.botLeft.y + ' ey:' + this.coords.topRight.y + ' mi:' + this.maxIterations + ' ips:' + this.iterationsPerStep + '.';
  };
  return MapInfo;
}());
var MapWorkingData = /** @class */ (function () {
  //public pixelData: Uint8ClampedArray;
  function MapWorkingData(canvasSize, mapInfo, colorMap, sectionAnchor, forSubDivision) {
    this.canvasSize = canvasSize;
    this.mapInfo = mapInfo;
    this.colorMap = colorMap;
    this.sectionAnchor = sectionAnchor;
    this.elementCount = this.getNumberOfElementsForCanvas(this.canvasSize);
    this.wAData = new Float64Array(this.elementCount); // All elements now have a value of zero.
    this.wBData = new Float64Array(this.elementCount); // All elements now have a value of zero.
    this.cnts = new Uint16Array(this.elementCount);
    this.flags = new Uint8Array(this.elementCount);
    // X coordinates get larger as one moves from the left of the map to  the right.
    this.xVals = MapWorkingData.buildVals(this.canvasSize.width, this.mapInfo.bottomLeft.x, this.mapInfo.topRight.x);
    // Y coordinates get larger as one moves from the bottom of the map to the top.
    // But ImageData "blocks" are drawn from top to bottom.
    if (forSubDivision) {
      this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
    }
    else {
      // if we only have a single section, then we must reverse the y values.
      this.yVals = MapWorkingData.buildValsRev(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
    }
    this.curIterations = 0;
  }
  // Calculate the number of elements in our single dimension data array needed to cover the
  // two-dimensional map.
  MapWorkingData.prototype.getNumberOfElementsForCanvas = function (cs) {
    return cs.width * cs.height;
  };
  // Build the array of 'c' values for one dimension of the map.
  MapWorkingData.buildVals = function (canvasExtent, start, end) {
    var result = new Array(canvasExtent);
    var mapExtent = end - start;
    var unitExtent = mapExtent / canvasExtent;
    var i;
    for (i = 0; i < canvasExtent; i++) {
      result[i] = start + i * unitExtent;
    }
    return result;
  };
  // Build the array of 'c' values for one dimension of the map.
  MapWorkingData.buildValsRev = function (canvasExtent, start, end) {
    var result = new Array(canvasExtent);
    var mapExtent = end - start;
    var unitExtent = mapExtent / canvasExtent;
    var i;
    var ptr = 0;
    for (i = canvasExtent - 1; i > -1; i--) {
      result[ptr++] = start + i * unitExtent;
    }
    return result;
  };
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

    var zxSquared = z.x * z.x;
    var zySquared = z.y * z.y;

    for (cntr = 0; cntr < iterCount; cntr++) {

      z.y = 2 * z.x * z.y + c.y;
      z.x = zxSquared - zySquared + c.x;

      //z = this.getNextVal(z, c);

      zxSquared = z.x * z.x;
      zySquared = z.y * z.y;

      if (zxSquared + zySquared > 4) {
        // This point is done.
        this.flags[ptr] = 1;
        break;
      }


      //z = this.getNextVal(z, c);
      //if (this.getAbsSizeSquared(z) > 4) {
      //  // This point is done.
      //  this.flags[ptr] = 1;
      //  break;
      //}
    }


    // Store the new value back to our Working Data.
    this.wAData[ptr] = z.x;
    this.wBData[ptr] = z.y;
    // Increment the number of times this point has been iterated.
    this.cnts[ptr] = this.cnts[ptr] + cntr;
    return this.flags[ptr] === 1;
  };
  // Updates each element for a given line by performing a single interation.
  // Returns true if at least one point is not done.
  MapWorkingData.prototype.doIterationsForLine = function (iterCount, y) {
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
  MapWorkingData.prototype.doIterationsForAll = function (iterCount) {
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
  // Divides the specified MapWorking data into the specified vertical sections, each having the width of the original Map.
  MapWorkingData.getWorkingDataSections = function (canvasSize, mapInfo, colorMap, numberOfSections) {
    var result = Array(numberOfSections);
    // Calculate the heigth of each section, rounded down to the nearest whole number.
    var sectionHeight = canvasSize.height / numberOfSections;
    var sectionHeightWN = parseInt(sectionHeight.toString(), 10);
    // Calculate the height of the last section.
    var lastSectionHeight = canvasSize.height - sectionHeightWN * (numberOfSections - 1);
    var left = mapInfo.bottomLeft.x;
    var right = mapInfo.topRight.x;
    var bottomPtr = 0;
    var topPtr = sectionHeightWN;
    var yVals;
    yVals = MapWorkingData.buildValsRev(canvasSize.height, mapInfo.bottomLeft.y, mapInfo.topRight.y);
    var ptr = 0;
    // Build all but the last section.
    for (; ptr < numberOfSections - 1; ptr++) {
      var secCanvasSize_1 = new CanvasSize(canvasSize.width, sectionHeightWN);
      var secBottom_1 = yVals[bottomPtr];
      var secTop_1 = yVals[topPtr];
      var secBotLeft_1 = new Point(left, secBottom_1);
      var secTopRight_1 = new Point(right, secTop_1);
      var coords_1 = new Box(secBotLeft_1, secTopRight_1);
      var secMapInfo_1 = new MapInfo(coords_1, mapInfo.maxIterations, mapInfo.iterationsPerStep);
      var yOffset_1 = ptr * sectionHeightWN;
      var secAnchor_1 = new Point(0, yOffset_1);
      result[ptr] = new MapWorkingData(secCanvasSize_1, secMapInfo_1, colorMap, secAnchor_1, true);
      // The next bottomPtr should point to one immediately following the last top.
      bottomPtr = topPtr + 1;
      topPtr += sectionHeightWN;
    }
    // Build the last section.
    var secCanvasSize = new CanvasSize(canvasSize.width, lastSectionHeight);
    var secBottom = yVals[bottomPtr];
    var secBotLeft = new Point(left, secBottom);
    topPtr = yVals.length - 1;
    var secTop = yVals[topPtr];
    var secTopRight = new Point(right, secTop);
    var coords = new Box(secBotLeft, secTopRight);
    var secMapInfo = new MapInfo(coords, mapInfo.maxIterations, mapInfo.iterationsPerStep);
    var yOffset = ptr * sectionHeightWN;
    var secAnchor = new Point(0, yOffset);
    result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, colorMap, secAnchor, true);
    return result;
  };
  MapWorkingData.prototype.getPixelData = function () {
    var pixelData = new Uint8ClampedArray(this.elementCount * 4);
    this.updateImageData(pixelData);
    return pixelData;
  };
  MapWorkingData.prototype.updateImageData = function (imgData) {
    if (imgData.length !== this.elementCount * 4) {
      console.log("The imgData data does not have the correct number of elements.");
      return;
    }
    // Address the image data buffer as Int32's
    var pixelData = new Uint32Array(imgData.buffer);
    //let colorMap: ColorMap = this.colorMap;
    var i = 0;
    for (; i < this.elementCount; i++) {
      var cnt = this.cnts[i];
      pixelData[i] = this.colorMap.getColor(cnt);
    }
  };
  MapWorkingData.prototype.getImageDataForLine = function (y) {
    var imageData = new ImageData(this.canvasSize.width, 1);
    this.updateImageDataForLine(imageData, y);
    return imageData;
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
  MapWorkingData.prototype.getFlagData = function (mapWorkingData) {
    var result = new Array(mapWorkingData.elementCount);
    var i;
    for (i = 0; i < result.length; i++) {
      result[i] = mapWorkingData.flags[i] !== 0;
    }
    return result;
  };
  MapWorkingData.prototype.getHistogram = function () {
    var result = new Histogram();
    result.addVals(this.cnts);
    return result;
  };
  return MapWorkingData;
}()); // End Class MapWorkingData

var ColorMapEntry = /** @class */ (function () {
  function ColorMapEntry(cutOff, colorNum) {
    this.cutOff = cutOff;
    this.colorNum = colorNum;
  }
  return ColorMapEntry;
}());
var ColorMapEntryForExport = /** @class */ (function () {
  function ColorMapEntryForExport(cutOff, cssColor) {
    this.cutOff = cutOff;
    this.cssColor = cssColor;
  }
  return ColorMapEntryForExport;
}());
var ColorMapUIEntry = /** @class */ (function () {
  function ColorMapUIEntry(cutOff, colorVals) {
    this.cutOff = cutOff;
    this.colorVals = colorVals;
    this.alpha = 255;
    if (colorVals.length === 3) {
      this.r = colorVals[0];
      this.g = colorVals[1];
      this.b = colorVals[2];
      this.alpha = 255;
    }
    else if (colorVals.length === 4) {
      this.r = colorVals[0];
      this.g = colorVals[1];
      this.b = colorVals[2];
      this.alpha = colorVals[3];
    }
    else {
      throw new RangeError('colorVals must have exactly 3 or 4 elements.');
    }
    this.colorNum = ColorNumbers.getColor(this.r, this.g, this.b, this.alpha);
  }
  Object.defineProperty(ColorMapUIEntry.prototype, "rgbHex", {
    get: function () {
      var result = '#' + ('0' + this.r.toString(16)).slice(-2) + ('0' + this.g.toString(16)).slice(-2) + ('0' + this.b.toString(16)).slice(-2);
      //return "#FFFF00";
      return result;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(ColorMapUIEntry.prototype, "rgbaString", {
    get: function () {
      var result = 'rgba(' + this.r.toString(10) + ',' + this.g.toString(10) + ',' + this.b.toString(10) + ',1)';
      //return 'rgba(200,20,40,1)';
      return result;
    },
    enumerable: true,
    configurable: true
  });
  ColorMapUIEntry.fromColorMapEntry = function (cme) {
    var result;
    if (typeof cme === typeof ColorMapUIEntry) {
      result = cme;
    }
    else {
      result = ColorMapUIEntry.fromOffsetAndColorNum(cme.cutOff, cme.colorNum);
    }
    return result;
  };
  ColorMapUIEntry.fromOffsetAndColorNum = function (cutOff, cNum) {
    var colorComps = ColorNumbers.getColorComponents(cNum);
    var result = new ColorMapUIEntry(cutOff, colorComps);
    return result;
  };
  ColorMapUIEntry.fromOffsetAndCssColor = function (cutOff, cssColor) {
    var colorComps = ColorNumbers.getColorComponentsFromCssColor(cssColor);
    var result = new ColorMapUIEntry(cutOff, colorComps);
    return result;
  };
  ColorMapUIEntry.fromOffsetAndRgba = function (cutOff, rgbaColor) {
    var colorComps = ColorNumbers.getColorComponentsFromRgba(rgbaColor);
    var result = new ColorMapUIEntry(cutOff, colorComps);
    return result;
  };
  return ColorMapUIEntry;
}());
var ColorMap = /** @class */ (function () {
  function ColorMap(ranges, highColor) {
    this.ranges = ranges;
    this.highColor = highColor;
  }
  ColorMap.FromTypedArrays = function (cutOffs, colorNums, highColor) {
    var workRanges = new Array(cutOffs.length);
    var i = 0;
    for (; i < cutOffs.length; i++) {
      workRanges[i] = new ColorMapEntry(cutOffs[i], colorNums[i]);
    }
    var result = new ColorMap(workRanges, highColor);
    return result;
  };
  ColorMap.prototype.insertColorMapEntry = function (entry, index) {
    if (index <= 0) {
      this.ranges.unshift(entry);
    }
    else if (index > this.ranges.length - 1) {
      this.ranges.push(entry);
    }
    else {
      this.ranges.splice(index, 0, entry);
    }
  };
  ColorMap.prototype.getColor = function (countValue) {
    if (countValue > 0) {
      var r = 0;
      //console.log('Got a count value > 0');
    }
    var result;
    var index = this.searchInsert(countValue);
    if (index === this.ranges.length) {
      result = this.highColor;
    }
    else {
      if (index > 1) {
        var rr = 0;
        //console.log('Get a index into the cm > 0.');
      }
      result = this.ranges[index].colorNum;
    }
    return result;
  };
  ColorMap.prototype.searchInsert = function (countVal) {
    var start = 0;
    var end = this.ranges.length - 1;
    var index = Math.floor((end - start) / 2) + start;
    if (countVal > this.ranges[this.ranges.length - 1].cutOff) {
      // The target is beyond the end of this array.
      index = this.ranges.length;
    }
    else {
      // Start in middle, divide and conquer.
      while (start < end) {
        // Get value at current index.
        var value = this.ranges[index].cutOff;
        if (value === countVal) {
          // Found our target.
          //result = index;
          break;
        }
        else if (countVal < value) {
          // Target is lower in array, move the index halfway down.
          end = index;
        }
        else {
          // Target is higher in array, move the index halfway up.
          start = index + 1;
        }
        // Get next mid-point.
        index = Math.floor((end - start) / 2) + start;
      }
    }
    return index;
  };
  ColorMap.prototype.getCutOffs = function () {
    var result = new Uint16Array(this.ranges.length);
    var i = 0;
    for (; i < this.ranges.length; i++) {
      result[i] = this.ranges[i].cutOff;
    }
    return result;
  };
  ColorMap.prototype.getColorNums = function () {
    var result = new Uint32Array(this.ranges.length);
    var i = 0;
    for (; i < this.ranges.length; i++) {
      result[i] = this.ranges[i].colorNum;
    }
    return result;
  };
  return ColorMap;
}());
var ColorMapUI = /** @class */ (function (_super) {
  __extends(ColorMapUI, _super);
  function ColorMapUI(ranges, highColor) {
    return _super.call(this, ranges, highColor) || this;
  }
  Object.defineProperty(ColorMapUI.prototype, "uIRanges", {
    get: function () {
      return this.ranges;
    },
    enumerable: true,
    configurable: true
  });
  // TODO: Make the ColorMapUI standalone -- and not extend ColorMap.
  // Override the method in ColorMap
  ColorMapUI.prototype.insertColorMapEntry = function (entry, index) {
    throw new RangeError("Not Implemented.");
  };
  ColorMapUI.prototype.getRegularColorMap = function () {
    var uiRanges = this.uIRanges;
    var ranges = [];
    var ptr;
    for (ptr = 0; ptr < uiRanges.length; ptr++) {
      var uiCme = uiRanges[ptr];
      var cme = new ColorMapEntry(uiCme.cutOff, uiCme.colorNum);
      ranges.push(cme);
    }
    var result = new ColorMap(ranges, this.highColor);
    return result;
  };
  ColorMapUI.FromColorMapForExport = function (cmfe) {
    var ranges = [];
    var ptr;
    for (ptr = 0; ptr < cmfe.ranges.length; ptr++) {
      var cmeForExport = cmfe.ranges[ptr];
      var cme = ColorMapUIEntry.fromOffsetAndCssColor(cmeForExport.cutOff, cmeForExport.cssColor);
      ranges.push(cme);
    }
    var result = new ColorMapUI(ranges, cmfe.highColor);
    return result;
  };
  return ColorMapUI;
}(ColorMap));
var ColorMapForExport = /** @class */ (function () {
  function ColorMapForExport(ranges, highColor) {
    this.ranges = ranges;
    this.highColor = highColor;
  }
  ColorMapForExport.FromColorMap = function (colorMap) {
    var ranges = [];
    var ptr;
    for (ptr = 0; ptr < colorMap.ranges.length; ptr++) {
      var icme = colorMap.ranges[ptr];
      var cme = ColorMapUIEntry.fromColorMapEntry(icme);
      var cssColor = cme.rgbHex;
      var cmeForExport = new ColorMapEntryForExport(cme.cutOff, cssColor);
      ranges.push(cmeForExport);
    }
    var result = new ColorMapForExport(ranges, colorMap.highColor);
    return result;
  };
  return ColorMapForExport;
}());
var ColorNumbers = /** @class */ (function () {
  function ColorNumbers() {
    this.black = 65536 * 65280; // FF00 0000
    this.white = ColorNumbers.getColor(255, 255, 255);
    this.red = ColorNumbers.getColor(255, 0, 0);
    this.green = ColorNumbers.getColor(0, 255, 0);
    this.blue = ColorNumbers.getColor(0, 0, 255);
  }
  //data[y * canvasWidth + x] =
  //  (255 << 24) |	// alpha
  //  (value << 16) |	// blue
  //  (value << 8) |	// green
  //  value;		// red
  ColorNumbers.getColor = function (r, g, b, alpha) {
    if (r > 255 || r < 0)
      throw new RangeError('R must be between 0 and 255.');
    if (g > 255 || g < 0)
      throw new RangeError('G must be between 0 and 255.');
    if (b > 255 || b < 0)
      throw new RangeError('B must be between 0 and 255.');
    //var result;
    //if (alpha !== null) {
    //  if (alpha > 255 || alpha < 0)
    //    throw new RangeError('Alpha must be between 0 and 255.');
    //  result = alpha << 24;
    //  result |= b << 16;
    //  result |= g << 8;
    //  result |= r;
    //}
    //else {
    //  result = 65536 * 65280; // FF00 0000 - opaque Black
    //  result += b << 16;
    //  result += g << 8;
    //  result += r;
    //}

    if (alpha === null) {
      alpha = 255;
    } else {
      if (alpha > 255 || alpha < 0) throw new RangeError('Alpha must be between 0 and 255.');
    }

    var result = alpha << 24;
    result |= b << 16;
    result |= g << 8;
    result |= r;
    return result;
  };
  // Returns array of numbers: r,g,b,a Where r,g and b are 0-255 integers and a is 0-1 float.
  ColorNumbers.getColorComponents = function (cNum) {
    var result = new Array(4);
    // Mask all but the lower 8 bits.
    result[0] = cNum & 0x000000FF;
    // Shift down by 8 bits and then mask.
    result[1] = cNum >> 8 & 0x000000FF;
    result[2] = cNum >> 16 & 0x000000FF;
    result[3] = 255; //cNum >> 24 & 0x000000FF;
    return result;
  };
  // Returns array of numbers: r,g,b,a Where r,g and b are 0-255 integers and a is 0-1 float.
  ColorNumbers.getColorComponentsFromCssColor = function (cssColor) {
    var result = new Array(4);
    var bs = cssColor.slice(1, 3);
    var gs = cssColor.slice(3, 5);
    var rs = cssColor.slice(5, 7);
    result[0] = parseInt(bs, 16);
    result[1] = parseInt(gs, 16);
    result[2] = parseInt(rs, 16);
    result[3] = 255; //parseInt(cssColor.slice(7,8), 16);
    return result;
  };
  ColorNumbers.getColorComponentsFromRgba = function (rgbaColor) {
    var result = new Array(4);
    //let rgbaObject: object = JSON.parse(rgbaColor);
    //return 'rgba(200,20,40,1)';
    var lst = rgbaColor.replace('rgba(', '');
    lst = lst.replace(')', '');
    var comps = lst.split(',');
    result[0] = parseInt(comps[0], 10);
    result[1] = parseInt(comps[1], 10);
    result[2] = parseInt(comps[2], 10);
    result[3] = 255; //parseInt(comps[3], 10);
    return result;
  };
  return ColorNumbers;
}());
// -- WebWorker Message Implementations
var WebWorkerMessage = /** @class */ (function () {
  function WebWorkerMessage(messageKind) {
    this.messageKind = messageKind;
  }
  WebWorkerMessage.FromEventData = function (data) {
    return new WebWorkerMessage(data.messageKind || data || 'no data');
  };
  return WebWorkerMessage;
}());
var WebWorkerStartRequest = /** @class */ (function () {
  function WebWorkerStartRequest(messageKind, canvasSize, mapInfo, colorMap, sectionAnchor, sectionNumber) {
    this.messageKind = messageKind;
    this.canvasSize = canvasSize;
    this.mapInfo = mapInfo;
    this.colorMap = colorMap;
    this.sectionAnchor = sectionAnchor;
    this.sectionNumber = sectionNumber;
  }
  WebWorkerStartRequest.FromEventData = function (data) {
    var result = new WebWorkerStartRequest(data.messageKind, data.canvasSize,
      // Because the MapInfo class has methods, we must build a new instance from the data.
      MapInfo.fromIMapInfo(data.mapInfo),
      // Because the ColorMap class has methods, we must build a new instance from the data.
      new ColorMap(data.colorMap.ranges, data.colorMap.highColor), data.sectionAnchor, data.sectionNumber);
    return result;
  };
  WebWorkerStartRequest.CreateRequest = function (mapWorkingData, sectionNumber) {
    var result = new WebWorkerStartRequest('Start', mapWorkingData.canvasSize, mapWorkingData.mapInfo, mapWorkingData.colorMap, mapWorkingData.sectionAnchor, sectionNumber);
    return result;
  };
  WebWorkerStartRequest.prototype.getMapWorkingData = function () {
    var result = new MapWorkingData(this.canvasSize, this.mapInfo, this.colorMap, this.sectionAnchor, true);
    return result;
  };
  return WebWorkerStartRequest;
}());
var WebWorkerIterateRequest = /** @class */ (function () {
  function WebWorkerIterateRequest(messageKind, iterateCount) {
    this.messageKind = messageKind;
    this.iterateCount = iterateCount;
  }
  WebWorkerIterateRequest.FromEventData = function (data) {
    var result = new WebWorkerIterateRequest(data.messageKind, data.iterateCount);
    return result;
  };
  WebWorkerIterateRequest.CreateRequest = function (iterateCount) {
    var result = new WebWorkerIterateRequest('Iterate', iterateCount);
    return result;
  };
  return WebWorkerIterateRequest;
}());
var WebWorkerImageDataRequest = /** @class */ (function () {
  function WebWorkerImageDataRequest(messageKind) {
    this.messageKind = messageKind;
  }
  WebWorkerImageDataRequest.FromEventData = function (data) {
    var result = new WebWorkerImageDataRequest(data.messageKind);
    return result;
  };
  WebWorkerImageDataRequest.CreateRequest = function () {
    var result = new WebWorkerImageDataRequest('GetImageData');
    return result;
  };
  return WebWorkerImageDataRequest;
}());
var WebWorkerImageDataResponse = /** @class */ (function () {
  function WebWorkerImageDataResponse(messageKind, sectionNumber, pixelData) {
    this.messageKind = messageKind;
    this.sectionNumber = sectionNumber;
    this.pixelData = pixelData;
  }
  WebWorkerImageDataResponse.FromEventData = function (data) {
    var result = new WebWorkerImageDataResponse(data.messageKind, data.sectionNumber, data.pixelData);
    return result;
  };
  WebWorkerImageDataResponse.CreateResponse = function (sectionNumber, pixelData) {
    var result = new WebWorkerImageDataResponse("ImageDataResponse", sectionNumber, pixelData);
    return result;
  };
  WebWorkerImageDataResponse.prototype.getImageData = function (cs) {
    var result = null;
    //if (this.pixelData) {
    var pixelCount = this.pixelData.length / 4;
    if (pixelCount !== cs.width * cs.height) {
      console.log('The image data being returned is not the correct size for our canvas.');
    }
    result = new ImageData(this.pixelData, cs.width, cs.height);
    //}
    return result;
  };
  return WebWorkerImageDataResponse;
}());
var WebWorkerAliveFlagsRequest = /** @class */ (function () {
  function WebWorkerAliveFlagsRequest(messageKind) {
    this.messageKind = messageKind;
  }
  WebWorkerAliveFlagsRequest.FromEventData = function (data) {
    var result = new WebWorkerAliveFlagsRequest(data.messageKind);
    return result;
  };
  WebWorkerAliveFlagsRequest.CreateRequest = function (flagData) {
    var result = new WebWorkerAliveFlagsRequest('GetAliveFlags');
    return result;
  };
  return WebWorkerAliveFlagsRequest;
}());
var WebWorkerAliveFlagsResponse = /** @class */ (function () {
  function WebWorkerAliveFlagsResponse(messageKind, sectionNumber, flagData) {
    this.messageKind = messageKind;
    this.sectionNumber = sectionNumber;
    this.flagData = flagData;
  }
  WebWorkerAliveFlagsResponse.FromEventData = function (data) {
    var result = new WebWorkerImageDataResponse(data.messageKind, data.sectionNumber, data.flagData);
    return result;
  };
  WebWorkerAliveFlagsResponse.CreateResponse = function (sectionNumber, flagData) {
    var result = new WebWorkerAliveFlagsResponse("AliveFlagResults", sectionNumber, flagData);
    return result;
  };
  WebWorkerAliveFlagsResponse.prototype.getAliveFlags = function () {
    var result = new Array(this.flagData.length);
    var ptr = 0;
    for (; ptr < this.flagData.length; ptr++) {
      result[ptr] = this.flagData[ptr] !== 0;
    }
    return result;
  };
  return WebWorkerAliveFlagsResponse;
}());
var WebWorkerIterCountsRequest = /** @class */ (function () {
  function WebWorkerIterCountsRequest(messageKind) {
    this.messageKind = messageKind;
  }
  WebWorkerIterCountsRequest.FromEventData = function (data) {
    var result = new WebWorkerIterCountsRequest(data.messageKind);
    return result;
  };
  WebWorkerIterCountsRequest.CreateRequest = function (flagData) {
    var result = new WebWorkerIterCountsRequest('GetIterCounts');
    return result;
  };
  return WebWorkerIterCountsRequest;
}());
var WebWorkerIterCountsResponse = /** @class */ (function () {
  function WebWorkerIterCountsResponse(messageKind, sectionNumber, iterCountsData) {
    this.messageKind = messageKind;
    this.sectionNumber = sectionNumber;
    this.iterCountsData = iterCountsData;
  }
  WebWorkerIterCountsResponse.FromEventData = function (data) {
    var result = new WebWorkerIterCountsResponse(data.messageKind, data.sectionNumber, data.iterCountsData);
    return result;
  };
  WebWorkerIterCountsResponse.CreateResponse = function (sectionNumber, iterCountsData) {
    var result = new WebWorkerIterCountsResponse("IterCountsResults", sectionNumber, iterCountsData);
    return result;
  };
  return WebWorkerIterCountsResponse;
}());
var WebWorkerHistogramRequest = /** @class */ (function () {
  function WebWorkerHistogramRequest(messageKind) {
    this.messageKind = messageKind;
  }
  WebWorkerHistogramRequest.FromEventData = function (data) {
    var result = new WebWorkerHistogramRequest(data.messageKind);
    return result;
  };
  WebWorkerHistogramRequest.CreateRequest = function () {
    var result = new WebWorkerHistogramRequest('GetHistogram');
    return result;
  };
  return WebWorkerHistogramRequest;
}());
var WebWorkerHistorgramResponse = /** @class */ (function () {
  function WebWorkerHistorgramResponse(messageKind, sectionNumber, vals, occurances) {
    this.messageKind = messageKind;
    this.sectionNumber = sectionNumber;
    this.vals = vals;
    this.occurances = occurances;
  }
  WebWorkerHistorgramResponse.FromEventData = function (data) {
    var result = new WebWorkerHistorgramResponse(data.messageKind, data.sectionNumber, data.vals, data.occurances);
    return result;
  };
  WebWorkerHistorgramResponse.CreateResponse = function (sectionNumber, histogram) {
    var arrayPair = histogram.getHistArrayPair();
    var result = new WebWorkerHistorgramResponse("HistogramResults", sectionNumber, arrayPair.vals, arrayPair.occurances);
    return result;
  };
  WebWorkerHistorgramResponse.prototype.getHistorgram = function () {
    var arrayPair = new HistArrayPair(this.vals, this.occurances);
    var result = Histogram.fromHistArrayPair(arrayPair);
    return result;
  };
  WebWorkerHistorgramResponse.prototype.getHistArrayPair = function () {
    var result = new HistArrayPair(this.vals, this.occurances);
    return result;
  };
  return WebWorkerHistorgramResponse;
}());
var WebWorkerUpdateColorMapRequest = /** @class */ (function () {
  function WebWorkerUpdateColorMapRequest(messageKind, cutOffs, colorNums, highColorNum) {
    this.messageKind = messageKind;
    this.cutOffs = cutOffs;
    this.colorNums = colorNums;
    this.highColorNum = highColorNum;
  }
  WebWorkerUpdateColorMapRequest.FromEventData = function (data) {
    var result = new WebWorkerUpdateColorMapRequest(data.messageKind, data.cutOffs, data.colorNums, data.highColorNum);
    return result;
  };
  WebWorkerUpdateColorMapRequest.CreateRequest = function (colorMap) {
    var cutOffs = colorMap.getCutOffs();
    var colorNums = colorMap.getColorNums();
    var result = new WebWorkerUpdateColorMapRequest("UpdateColorMap", cutOffs, colorNums, colorMap.highColor);
    return result;
  };
  WebWorkerUpdateColorMapRequest.prototype.getColorMap = function () {
    var result = ColorMap.FromTypedArrays(this.cutOffs, this.colorNums, this.highColorNum);
    return result;
  };
  return WebWorkerUpdateColorMapRequest;
}());
//// Only used when the javascript produced from compiling this TypeScript is used to create worker.js
var mapWorkingData = null;
var sectionNumber = 0;
// Handles messages sent from the window that started this web worker.
onmessage = function (e) {
  var pixelData;
  var imageData;
  var imageDataResponse;
  //console.log('Worker received message: ' + e.data + '.');
  var plainMsg = WebWorkerMessage.FromEventData(e.data);
  if (plainMsg.messageKind === 'Start') {
    var startMsg = WebWorkerStartRequest.FromEventData(e.data);
    mapWorkingData = startMsg.getMapWorkingData();
    sectionNumber = startMsg.sectionNumber;
    console.log('Worker created MapWorkingData with element count = ' + mapWorkingData.elementCount);
    var responseMsg = new WebWorkerMessage('StartResponse');
    console.log('Posting ' + responseMsg.messageKind + ' back to main script');
    self.postMessage(responseMsg);
  }
  else if (plainMsg.messageKind === 'Iterate') {
    var iterateRequestMsg = WebWorkerIterateRequest.FromEventData(e.data);
    var iterCount = iterateRequestMsg.iterateCount;
    mapWorkingData.doIterationsForAll(iterCount);
    pixelData = mapWorkingData.getPixelData();
    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);
    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
    self.postMessage(imageDataResponse, [pixelData.buffer]);
  }
  else if (plainMsg.messageKind === 'GetImageData') {
    //mapWorkingData.doIterationsForAll(1);
    pixelData = mapWorkingData.getPixelData();
    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);
    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
    self.postMessage(imageDataResponse, [pixelData.buffer]);
  }
  else if (plainMsg.messageKind === "UpdateColorMap") {
    var upColorMapReq = WebWorkerUpdateColorMapRequest.FromEventData(e.data);
    mapWorkingData.colorMap = upColorMapReq.getColorMap();
    console.log('WebWorker received an UpdateColorMapRequest with ' + mapWorkingData.colorMap.ranges.length + ' entries.');
    pixelData = mapWorkingData.getPixelData();
    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);
    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
    self.postMessage(imageDataResponse, [pixelData.buffer]);
  }
  else if (plainMsg.messageKind === "GetHistogram") {
    var histogram = mapWorkingData.getHistogram();
    var histogramResponse = WebWorkerHistorgramResponse.CreateResponse(sectionNumber, histogram);
    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
    self.postMessage(histogramResponse, [histogramResponse.vals.buffer, histogramResponse.occurances.buffer]);
  }
  else {
    console.log('Received unknown message kind: ' + plainMsg.messageKind);
  }
};
//# sourceMappingURL=m-map-common.js.map
