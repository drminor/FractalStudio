var MAX_CANVAS_WIDTH = 5000;
var MAX_CANVAS_HEIGHT = 5000;
var Point = /** @class */ (function () {
  function Point(x, y) {
    this.x = x;
    this.y = y;
  }
  return Point;
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
  function MapInfo(bottomLeft, topRight, maxInterations) {
    this.bottomLeft = bottomLeft;
    this.topRight = topRight;
    this.maxInterations = maxInterations;
  }
  return MapInfo;
}());
var MapWorkingData = /** @class */ (function () {
  function MapWorkingData(canvasSize, mapInfo, sectionAnchor) {
    this.canvasSize = canvasSize;
    this.mapInfo = mapInfo;
    this.sectionAnchor = sectionAnchor;
    this.elementCount = this.getNumberOfElementsForCanvas(this.canvasSize);
    this.wAData = new Float64Array(this.elementCount); // All elements now have a value of zero.
    this.wBData = new Float64Array(this.elementCount); // All elements now have a value of zero.
    this.cnts = new Uint16Array(this.elementCount);
    this.flags = new Uint8Array(this.elementCount);
    // X coordinates get larger as one moves from the left of the map to  the right.
    this.xVals = this.buildVals(this.canvasSize.width, this.mapInfo.bottomLeft.x, this.mapInfo.topRight.x);
    // Y coordinates get larger as one moves from the bottom of the map to the top.
    // But ImageData "blocks" are drawn from top to bottom.
    this.yVals = this.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
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

  // Build the array of 'c' values for one dimension of the map.
  MapWorkingData.prototype.buildValsRev = function (canvasExtent, start, end) {
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
  MapWorkingData.prototype.getImageData = function () {
    var imageData = new ImageData(this.canvasSize.width, this.canvasSize.height);
    this.updateImageData(imageData);
    return imageData;
  };
  MapWorkingData.prototype.getImageDataForLine = function (y) {
    var imageData = new ImageData(this.canvasSize.width, 1);
    this.updateImageDataForLine(imageData, y);
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
  // Divides the specified MapWorking data into the specified vertical sections, each having the width of the original Map.
  MapWorkingData.getWorkingDataSections = function (mapWorkingData, numberOfSections) {
    var result = Array(numberOfSections);
    var sectionHeight = mapWorkingData.canvasSize.height / numberOfSections;
    var sectionHeightWN = parseInt(sectionHeight.toString(), 10);
    var lastSectionHeight = mapWorkingData.canvasSize.height - sectionHeightWN * (numberOfSections - 1);
    var left = mapWorkingData.mapInfo.bottomLeft.x;
    var right = mapWorkingData.mapInfo.topRight.x;
    var bottomPtr = 0;
    var topPtr = sectionHeightWN;
    var ptr;
    for (ptr = 0; ptr < numberOfSections - 1; ptr++) {
      var secCanvasSize_1 = new CanvasSize(mapWorkingData.canvasSize.width, sectionHeightWN);
      var secBottom_1 = mapWorkingData.yVals[bottomPtr];
      var secTop = mapWorkingData.yVals[topPtr];
      var secBotLeft_1 = new Point(left, secBottom_1);
      var secTopRight_1 = new Point(right, secTop);
      var secMapInfo_1 = new MapInfo(secBotLeft_1, secTopRight_1, mapWorkingData.mapInfo.maxInterations);
      var secAnchor_1 = new Point(0, 0);
      result[ptr] = new MapWorkingData(secCanvasSize_1, secMapInfo_1, secAnchor_1);
      // The next bottomPtr should point to one immediately following the last top.
      bottomPtr = topPtr + 1;
      topPtr += sectionHeightWN;
    }
    var secCanvasSize = new CanvasSize(mapWorkingData.canvasSize.width, lastSectionHeight);
    var secBottom = mapWorkingData.yVals[bottomPtr];
    var secBotLeft = new Point(left, secBottom);
    var secTopRight = mapWorkingData.mapInfo.topRight;
    var secMapInfo = new MapInfo(secBotLeft, secTopRight, mapWorkingData.mapInfo.maxInterations);
    var secAnchor = new Point(0, 0);
    result[numberOfSections - 1] = new MapWorkingData(secCanvasSize, secMapInfo, secAnchor);
    return result;
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
var WebWorkerMessage = /** @class */ (function () {
  function WebWorkerMessage(messageKind) {
    this.messageKind = messageKind;
  }
  WebWorkerMessage.FromEventData = function (data) {
    return new WebWorkerMessage(data.messageKind || data || 'no data');
  };
  return WebWorkerMessage;
}());
var WebWorkerMapUpdateResponse = /** @class */ (function () {
  function WebWorkerMapUpdateResponse(messageKind, sectionNumber, imgData) {
    this.messageKind = messageKind;
    this.sectionNumber = sectionNumber;
    this.imgData = imgData;
  }
  WebWorkerMapUpdateResponse.FromEventData = function (data) {
    var result = new WebWorkerMapUpdateResponse(data.messageKind, data.sectionNumber, data.imgData);
    //result.messageKind = data.messageKind || data as string;
    //result.sectionNumber = data.sectionNumber;
    //result.imgData = data.imgData || null;
    return result;
  };
  WebWorkerMapUpdateResponse.ForUpdateMap = function (sectionNumber, imageData) {
    var result = new WebWorkerMapUpdateResponse("UpdatedMapData", sectionNumber, imageData.data);
    return result;
  };
  WebWorkerMapUpdateResponse.prototype.getImageData = function (cs) {
    var result = null;
    if (this.imgData) {
      var pixelCount = this.imgData.length / 4;
      if (pixelCount !== cs.width * cs.height) {
        console.log('The image data being returned is not the correct size for our canvas.');
      }
      result = new ImageData(this.imgData, cs.width, cs.height);
    }
    return result;
  };
  return WebWorkerMapUpdateResponse;
}());
var WebWorkerStartRequest = /** @class */ (function () {
  function WebWorkerStartRequest(messageKind, canvasSize, mapInfo, sectionNumber) {
    this.messageKind = messageKind;
    this.canvasSize = canvasSize;
    this.mapInfo = mapInfo;
    this.sectionNumber = sectionNumber;
  }
  WebWorkerStartRequest.FromEventData = function (data) {
    var result = new WebWorkerStartRequest(data.messageKind, data.canvasSize, data.mapInfo, data.sectionNumber);
    return result;
  };
  WebWorkerStartRequest.ForStart = function (canvasSize, mapInfo, sectionNumber) {
    var result = new WebWorkerStartRequest('Start', canvasSize, mapInfo, sectionNumber);
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
  WebWorkerIterateRequest.ForIterate = function (iterateCount) {
    var result = new WebWorkerIterateRequest('Iterate', iterateCount);
    return result;
  };
  return WebWorkerIterateRequest;
}());
/// Only used when the javascript produced from compiling this TypeScript is used to create worker.js
var mapWorkingData = null;
var sectionNumber = 0;
// Handles messages sent from the window that started this web worker.
onmessage = function (e) {
  //console.log('Worker received message: ' + e.data + '.');
  var plainMsg = WebWorkerMessage.FromEventData(e.data);
  if (plainMsg.messageKind === 'Start') {
    var startMsg = WebWorkerStartRequest.FromEventData(e.data);
    var sectionAnchor = new Point(0, 0);
    mapWorkingData = new MapWorkingData(startMsg.canvasSize, startMsg.mapInfo, sectionAnchor);
    sectionNumber = startMsg.sectionNumber;
    console.log('Worker created MapWorkingData with element count = ' + mapWorkingData.elementCount + ' sn=' + sectionNumber + '.');
    var responseMsg = new WebWorkerMessage('StartResponse');
    console.log('Posting ' + responseMsg.messageKind + ' back to main script');
    self.postMessage(responseMsg);
  }
  else if (plainMsg.messageKind === 'Iterate') {
    mapWorkingData.doInterationsForAll(1);
    var imageData = mapWorkingData.getImageData();
    var workerResult = WebWorkerMapUpdateResponse.ForUpdateMap(sectionNumber, imageData);
    console.log('Posting ' + workerResult.messageKind + ' sn=' + sectionNumber + ' back to main script.');
    self.postMessage(workerResult, [imageData.data.buffer]);
  }
  else {
    console.log('Received unknown message kind: ' + plainMsg.messageKind);
  }
};
//# sourceMappingURL=worker.js.map
