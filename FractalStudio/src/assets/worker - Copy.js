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
    this.xVals = MapWorkingData.buildVals(this.canvasSize.width, this.mapInfo.bottomLeft.x, this.mapInfo.topRight.x);
    // Y coordinates get larger as one moves from the bottom of the map to the top.
    // But ImageData "blocks" are drawn from top to bottom.
    //this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
    // if we only have a single section, then we must reverse the y values.
    this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
    this.curInterations = 0;
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
  // Divides the specified MapWorking data into the specified vertical sections, each having the width of the original Map.
  MapWorkingData.getWorkingDataSections = function (canvasSize, mapInfo, numberOfSections) {
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
      var secMapInfo_1 = new MapInfo(secBotLeft_1, secTopRight_1, mapInfo.maxInterations);
      var yOffset_1 = ptr * sectionHeightWN;
      var secAnchor_1 = new Point(0, yOffset_1);
      result[ptr] = new MapWorkingData(secCanvasSize_1, secMapInfo_1, secAnchor_1);
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
    var secMapInfo = new MapInfo(secBotLeft, secTopRight, mapInfo.maxInterations);
    var yOffset = ptr * sectionHeightWN;
    var secAnchor = new Point(0, yOffset);
    result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, secAnchor);
    return result;
  };
  MapWorkingData.prototype.getPixelData = function () {
    var imgData = new Uint8ClampedArray(this.elementCount * 4);
    //const pixelData = new Uint32Array(this.elementCount);
    this.updateImageData(imgData);
    //const imgData = new Uint8ClampedArray(pixelData.buffer);
    //var imageData = new ImageData(imgData, this.canvasSize.width, this.canvasSize.height);
    return imgData;
  };
  MapWorkingData.prototype.updateImageData = function (imgData) {
    if (imgData.length !== this.elementCount * 4) {
      console.log("The imgData data does not have the correct number of elements.");
      return;
    }
    var pixelData = new Uint32Array(imgData.buffer);
    var i = 0;
    var colorNums = new ColorNumbers();
    for (; i < this.elementCount; i++) {
      var cnt = this.cnts[i];
      this.setPixelValueFromCount(cnt, i, pixelData, colorNums);
    }
  };
  MapWorkingData.prototype.setPixelValueBinaryByInt = function (on, ptr, imageData, colorNums) {
    if (on) {
      // Points within the set are drawn in black.
      imageData[ptr] = colorNums.red;
    }
    else {
      // Points outside the set are drawn in white.
      var tt = colorNums.white;
      //tt = ‭math.pow(2, 32);
      imageData[ptr] = tt; //math.pow(2, 32).valueOf() as number;
    }
  };
  MapWorkingData.prototype.setPixelValueFromCount = function (cnt, ptr, imageData, colorNums) {
    var cNum;
    if (cnt < 10) {
      cNum = colorNums.white;
    }
    else if (cnt < 20) {
      cNum = colorNums.red;
    }
    else if (cnt < 50) {
      cNum = colorNums.green;
    }
    else if (cnt < 200) {
      cNum = colorNums.blue;
    }
    else {
      cNum = colorNums.black;
    }
    imageData[ptr] = cNum;
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
  MapWorkingData.prototype.updateImageDataOld = function (imageData) {
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
  MapWorkingData.prototype.getImageDataOld = function () {
    var imageData = new ImageData(this.canvasSize.width, this.canvasSize.height);
    this.updateImageDataOld(imageData);
    return imageData;
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
  return MapWorkingData;
}()); // End Class MapWorkingData
var ColorNumbers = /** @class */ (function () {
  function ColorNumbers() {
    this.black = 65536 * 65280; // FF00 0000
    this.white = this.getColorNumber(255, 255, 255);
    this.red = this.getColorNumber(255, 0, 0);
    this.green = this.getColorNumber(0, 255, 0);
    this.blue = this.getColorNumber(0, 0, 255);
  }
  ColorNumbers.prototype.getColorNumber = function (r, g, b) {
    if (r > 255 || r < 0)
      throw new RangeError('R must be between 0 and 255.');
    if (g > 255 || g < 0)
      throw new RangeError('G must be between 0 and 255.');
    if (b > 255 || b < 0)
      throw new RangeError('B must be between 0 and 255.');
    var result = this.black;
    result += b << 16;
    result += g << 8;
    result += r;
    return result;
  };
  return ColorNumbers;
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
var WebWorkerStartRequest = /** @class */ (function () {
  function WebWorkerStartRequest(messageKind, canvasSize, mapInfo, sectionAnchor, sectionNumber) {
    this.messageKind = messageKind;
    this.canvasSize = canvasSize;
    this.mapInfo = mapInfo;
    this.sectionAnchor = sectionAnchor;
    this.sectionNumber = sectionNumber;
  }
  WebWorkerStartRequest.FromEventData = function (data) {
    var result = new WebWorkerStartRequest(data.messageKind, data.canvasSize, data.mapInfo, data.sectionAnchor, data.sectionNumber);
    return result;
  };
  WebWorkerStartRequest.CreateRequest = function (mapWorkingData, sectionNumber) {
    var result = new WebWorkerStartRequest('Start', mapWorkingData.canvasSize, mapWorkingData.mapInfo, mapWorkingData.sectionAnchor, sectionNumber);
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
  function WebWorkerImageDataRequest(messageKind, pixelData) {
    this.messageKind = messageKind;
    this.pixelData = pixelData;
  }
  WebWorkerImageDataRequest.FromEventData = function (data) {
    var result = new WebWorkerImageDataRequest(data.messageKind, data.pixelData);
    return result;
  };
  WebWorkerImageDataRequest.CreateRequest = function (pixelData) {
    var result = new WebWorkerImageDataRequest('GetImageData', pixelData);
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
  function WebWorkerAliveFlagsRequest(messageKind, flagData) {
    this.messageKind = messageKind;
    this.flagData = flagData;
  }
  WebWorkerAliveFlagsRequest.FromEventData = function (data) {
    var result = new WebWorkerAliveFlagsRequest(data.messageKind, data.flagData);
    return result;
  };
  WebWorkerAliveFlagsRequest.CreateRequest = function (flagData) {
    var result = new WebWorkerAliveFlagsRequest('GetAliveFlags', flagData);
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
  function WebWorkerIterCountsRequest(messageKind, iterCountsData) {
    this.messageKind = messageKind;
    this.iterCountsData = iterCountsData;
  }
  WebWorkerIterCountsRequest.FromEventData = function (data) {
    var result = new WebWorkerAliveFlagsRequest(data.messageKind, data.flagData);
    return result;
  };
  WebWorkerIterCountsRequest.CreateRequest = function (flagData) {
    var result = new WebWorkerAliveFlagsRequest('GetIterCounts', flagData);
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
// Only used when the javascript produced from compiling this TypeScript is used to create worker.js
var mapWorkingData = null;
var sectionNumber = 0;
// Handles messages sent from the window that started this web worker.
onmessage = function (e) {
  var imageData;
  var pixelData;
  var imageDataResponse;
  //console.log('Worker received message: ' + e.data + '.');
  var plainMsg = WebWorkerMessage.FromEventData(e.data);
  if (plainMsg.messageKind === 'Start') {
    var startMsg = WebWorkerStartRequest.FromEventData(e.data);
    mapWorkingData = new MapWorkingData(startMsg.canvasSize, startMsg.mapInfo, startMsg.sectionAnchor);
    sectionNumber = startMsg.sectionNumber;
    console.log('Worker created MapWorkingData with element count = ' + mapWorkingData.elementCount);
    var responseMsg = new WebWorkerMessage('StartResponse');
    console.log('Posting ' + responseMsg.messageKind + ' back to main script');
    self.postMessage(responseMsg);
  }
  else if (plainMsg.messageKind === 'Iterate') {
    console.log('WebWorker ' + this.sectionNumber + ' received an Iterate Request.');
    var iterateRequestMsg = WebWorkerIterateRequest.FromEventData(e.data);
    var iterCount = iterateRequestMsg.iterateCount;
    mapWorkingData.doInterationsForAll(iterCount);

    //mapWorkingData.doInterationsForAll(1);
    //imageData = mapWorkingData.getImageData();
    pixelData = mapWorkingData.getPixelData();

    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);
    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
    self.postMessage(imageDataResponse, [pixelData.buffer]);
  }
  else if (plainMsg.messageKind === 'GetImageData') {
    mapWorkingData.doInterationsForAll(1);
    var dataRequest = WebWorkerImageDataRequest.FromEventData(e.data);
    pixelData = dataRequest.pixelData;
    mapWorkingData.updateImageData(pixelData);
    imageDataResponse = WebWorkerImageDataResponse.CreateResponse(sectionNumber, pixelData);
    //console.log('Posting ' + workerResult.messageKind + ' back to main script');
    self.postMessage(imageDataResponse, [pixelData.buffer]);
  }
  else {
    console.log('Received unknown message kind: ' + plainMsg.messageKind);
  }
};
//# sourceMappingURL=worker.js.map