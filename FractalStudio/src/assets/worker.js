importScripts('ColorNumbers.js');
importScripts('apRational.js');

var MAX_CANVAS_WIDTH = 50000;
var MAX_CANVAS_HEIGHT = 50000;
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
  Point.prototype.add = function (amount) {
    return new Point(this.x + amount, this.y + amount);
  };
  Point.prototype.mult = function (amount) {
    return new Point(this.x * amount, this.y * amount);
  };
  Point.prototype.scale = function (factor) {
    return new Point(this.x * factor.x, this.y * factor.y);
  };
  Point.prototype.translate = function (factor) {
    return new Point(this.x + factor.x, this.y + factor.y);
  };
  Point.prototype.isEqual = function (p) {
    if (p === null)
      return false;
    if (p.x !== this.x)
      return false;
    if (p.y !== this.y)
      return false;
    return true;
  };
  return Point;
}());
var Box = /** @class */ (function () {
  function Box(botLeft, topRight) {
    this.botLeft = botLeft;
    this.topRight = topRight;
  }
  Box.fromPointExtent = function (botLeft, width, height) {
    var result = new Box(botLeft, new Point(botLeft.x + width, botLeft.y + height));
    return result;
  };
  Object.defineProperty(Box.prototype, "width", {
    get: function () {
      return this.topRight.x - this.botLeft.x;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Box.prototype, "height", {
    get: function () {
      return this.topRight.y - this.botLeft.y;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Box.prototype, "isUpsideDown", {
    get: function () {
      return this.topRight.y < this.botLeft.y;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Box.prototype, "isBackwards", {
    get: function () {
      return this.topRight.x < this.botLeft.x;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Box.prototype, "absHeight", {
    get: function () {
      if (this.isUpsideDown) {
        return this.botLeft.y - this.topRight.y;
      }
      else {
        return this.height;
      }
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Box.prototype, "absTop", {
    get: function () {
      if (this.isUpsideDown) {
        return this.botLeft.y;
      }
      else {
        return this.topRight.y;
      }
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Box.prototype, "absWidth", {
    get: function () {
      if (this.isBackwards) {
        return this.botLeft.x - this.topRight.x;
      }
      else {
        return this.width;
      }
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Box.prototype, "absLeft", {
    get: function () {
      if (this.isBackwards) {
        return this.botLeft.x;
      }
      else {
        return this.topRight.x;
      }
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Box.prototype, "size", {
    get: function () {
      return new CanvasSize(this.width, this.height);
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(Box.prototype, "absSize", {
    get: function () {
      return new CanvasSize(this.absWidth, this.absHeight);
    },
    enumerable: true,
    configurable: true
  });
  Box.prototype.getShiftedBox = function (dir, percent) {
    var result;
    var delta;
    switch (dir) {
      case 'r':
        delta = this.width * percent / 100;
        result = this.addX(delta);
        break;
      case 'l':
        delta = this.width * percent / 100;
        result = this.addX(-1 * delta);
        break;
      case 'u':
        delta = this.height * percent / 100;
        result = this.addY(delta);
        break;
      case 'd':
        delta = this.height * percent / 100;
        result = this.addY(-1 * delta);
        break;
      default:
        console.log('GetShiftedCoords received unrecognized dir ' + dir + '.');
        result = this;
    }
    return result;
  };
  Box.prototype.addX = function (amount) {
    var result = new Box(new Point(this.botLeft.x + amount, this.botLeft.y), new Point(this.topRight.x + amount, this.topRight.y));
    return result;
  };
  Box.prototype.addY = function (amount) {
    var result = new Box(new Point(this.botLeft.x, this.botLeft.y + amount), new Point(this.topRight.x, this.topRight.y + amount));
    return result;
  };
  Box.prototype.mult = function (amount) {
    var botLeft = new Point(this.botLeft.x * amount, this.botLeft.y * amount);
    var topRight = new Point(this.topRight.x * amount, this.topRight.y * amount);
    var result = new Box(botLeft, topRight);
    return result;
  };
  Box.prototype.scale = function (factor) {
    console.log('The dif in x vs y factor on getScaledBox is ' + (factor.width - factor.height) + '.');
    var result = new Box(new Point(this.botLeft.x * factor.width, this.botLeft.y * factor.height), new Point(this.topRight.x * factor.width, this.topRight.y * factor.height));
    return result;
  };
  Box.prototype.translate = function (factor) {
    return new Box(this.botLeft.translate(factor.botLeft), this.topRight.translate(factor.topRight));
  };
  Box.prototype.getExpandedBox = function (percent) {
    // 1/2 the amount of change for the width
    var deltaX = this.width * percent / 200;
    // 1/2 the amount of change for the width
    var deltaY = this.height * percent / 200;
    var botLeft = new Point(this.botLeft.x - deltaX, this.botLeft.y - deltaY);
    var topRight = new Point(this.topRight.x + deltaX, this.topRight.y + deltaY);
    var result = new Box(botLeft, topRight);
    return result;
  };
  Box.prototype.isEqual = function (box) {
    if (box === null) {
      console.log('Comparing this box to null, returning NOT-EQUAL.');
      return false;
    }
    else {
      if (!this.botLeft.isEqual(box.botLeft)) {
        console.log('Comparing two boxes and found that they are NOT-EQUAL.');
        return false;
      }
      if (!this.topRight.isEqual(box.topRight)) {
        console.log('Comparing two boxes and found that they are NOT-EQUAL.');
        return false;
      }
    }
    console.log('Comparing two boxes and found that they are equal.');
    return true;
  };
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
    var result = new Box(new Point(sx, sy), new Point(ex, ey));
    return result;
  };
  //private round(x: number): number {
  //  const result: number = parseInt((x + 0.5).toString(), 10);
  //  return result;
  //}
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
      console.log('A CanvasSize is being contructed with an invalid width.');
      alert('Width is invalid');
    }
    if (!this.isReasonableExtent(this.height, MAX_CANVAS_HEIGHT)) {
      console.log('A CanvasSize is being contructed with an invalid height.');
      alert('Height is invalid');
    }
  }
  CanvasSize.prototype.getScaledCanvas = function (amount) {
    var result = new CanvasSize(this.width * amount, this.height * amount);
    return result;
  };
  CanvasSize.prototype.mult = function (amount) {
    var result = new CanvasSize(this.width * amount, this.height * amount);
    return result;
  };
  CanvasSize.prototype.scale = function (factor) {
    var result = new CanvasSize(this.width * factor.width, this.height * factor.height);
    return result;
  };
  CanvasSize.prototype.isReasonableExtent = function (nVal, max) {
    //return isFinite(nVal) && nVal > 0 && nVal <= max && Math.floor(nVal) === nVal;
    return isFinite(nVal) && nVal > 0 && nVal <= max;
  };
  return CanvasSize;
}());
var MapInfo = /** @class */ (function () {
  function MapInfo(coords, maxIterations, threshold, iterationsPerStep) {
    this.coords = coords;
    this.maxIterations = maxIterations;
    this.threshold = threshold;
    this.iterationsPerStep = iterationsPerStep;
    if (coords === null) {
      throw new Error('When creating a MapInfo, the coords argument cannot be null.');
    }
  }
  MapInfo.fromPoints = function (bottomLeft, topRight, maxIterations, threshold, iterationsPerStep) {
    var coords = new Box(bottomLeft, topRight);
    var result = new MapInfo(coords, maxIterations, threshold, iterationsPerStep);
    return result;
  };
  MapInfo.fromIMapInfo = function (mi) {
    var bl = new Point(mi.coords.botLeft.x, mi.coords.botLeft.y);
    var tr = new Point(mi.coords.topRight.x, mi.coords.topRight.y);
    var coords = new Box(bl, tr);
    var threshold;
    if (mi.threshold === undefined) {
      threshold = 4;
    }
    else {
      threshold = mi.threshold;
    }
    var result = new MapInfo(coords, mi.maxIterations, threshold, mi.iterationsPerStep);
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
  Object.defineProperty(MapInfo.prototype, "upsideDown", {
    get: function () {
      return this.coords.isUpsideDown;
    },
    enumerable: true,
    configurable: true
  });
  MapInfo.prototype.isEqual = function (other) {
    if (other === null)
      return false;
    if (!this.coords.isEqual(other.coords))
      return false;
    if (this.maxIterations !== other.maxIterations)
      return false;
    if (this.iterationsPerStep !== other.iterationsPerStep)
      return false;
    if (this.threshold !== other.threshold)
      return false;
    return true;
  };
  MapInfo.prototype.toString = function () {
    return 'sx:' + this.coords.botLeft.x + ' ex:' + this.coords.topRight.x + ' sy:' + this.coords.botLeft.y + ' ey:' + this.coords.topRight.y + ' mi:' + this.maxIterations + ' ips:' + this.iterationsPerStep + '.';
  };
  return MapInfo;
}());
var IndexAndRunningSum = /** @class */ (function () {
  function IndexAndRunningSum(idx, runningSum) {
    this.idx = idx;
    this.runningSum = runningSum;
  }
  return IndexAndRunningSum;
}());
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
    this._maxVal = -1;
    this.entriesMap = new Map();
  }
  Object.defineProperty(Histogram.prototype, "maxVal", {
    get: function () {
      if (this._maxVal === -1) {
        // The getHistEntries method also sets the value of _maxVal.
        this.getHistEntries();
      }
      return this._maxVal;
    },
    enumerable: true,
    configurable: true
  });
  /// ---  By Division ----
  Histogram.prototype.getEqualGroupsForAll = function (numberOfGroups) {
    var result = this.getEqualGroupsForSubset(numberOfGroups, 0, -1);
    return result;
  };
  Histogram.prototype.getEqualGroupsForSubset = function (numberOfGroups, startCutOff, endCutOff) {
    console.log('GetEqualGroupsForSubset is being called with cnt:' + numberOfGroups + ' sc:' + startCutOff + ' ec:' + endCutOff + '.');
    var hes = this.getHistEntries();
    // Get index of starting cutoff;
    var startIdx = this.getIndexFromVal(hes, startCutOff, 0);
    // Get index of ending cutoff;
    var maxIdx = this.getIndexOfMaxIter(hes, 5);
    maxIdx--; // Don't include the entry at the end that corresponds to the maxIterations.
    var endIdx;
    if (endCutOff === -1) {
      endIdx = maxIdx;
    }
    else {
      endIdx = this.getIndexFromVal(hes, endCutOff, startIdx);
      if (endIdx > maxIdx)
        endIdx = maxIdx;
    }
    var cnt = 1 + endIdx - startIdx;
    var result = this.getEqualGroupsForSubset_Int(hes, numberOfGroups, startIdx, cnt);
    return result;
  };
  Histogram.prototype.getEqualGroupsForSubset_Int = function (hes, numberOfGroups, startIdx, cnt) {
    console.log('GetEqualGroupsForSubset_Int is being called with cnt:' + numberOfGroups + ' si:' + startIdx + ' cnt:' + cnt + '.');
    var numOfResultsRemaining = numberOfGroups; // - 2;
    var result = Array(numOfResultsRemaining);
    var resultPtr = 0;
    var resultEndPtr = numberOfGroups - 1; // - 3;
    while (cnt > 0 && numOfResultsRemaining > 0) {
      var sum = this.getSumHits(hes, startIdx, cnt);
      var target = parseInt((0.5 + sum / numberOfGroups).toString(), 10);
      if (hes[startIdx].occurances >= target) {
        result[resultPtr++] = hes[startIdx].val;
        startIdx++;
        cnt--;
      }
      else if (hes[startIdx + cnt - 1].occurances >= target) {
        result[resultEndPtr--] = hes[startIdx + cnt - 1].val;
        cnt--;
      }
      else {
        var bp = this.getForwardBreakPoint(hes, startIdx, cnt, target);
        result[resultPtr++] = hes[bp].val;
        var newStart = bp + 1;
        var ac = newStart - startIdx;
        startIdx = newStart;
        cnt -= ac;
      }
      numOfResultsRemaining--;
      numberOfGroups--;
    }
    return result;
  };
  // Returns the index into hes where the runnng sum is >= target.
  Histogram.prototype.getForwardBreakPoint = function (hes, startIdx, cnt, target) {
    var runSum = 0;
    var ptr;
    for (ptr = startIdx; ptr < startIdx + cnt; ptr++) {
      runSum += hes[ptr].occurances;
      if (runSum >= target) {
        // We have found the breakpoint at ptr.
        return ptr;
      }
    }
    // The breakpoint is the last index into hes.
    var result = startIdx + cnt - 1;
    return result;
  };
  Histogram.prototype.getIndexFromVal = function (hes, val, startIdx) {
    var found = false;
    var result;
    var ptr;
    for (ptr = startIdx; ptr < hes.length; ptr++) {
      if (hes[ptr].val === val) {
        result = ptr;
        found = true;
        break;
      }
      if (hes[ptr].val > val) {
        result = ptr - 1;
        if (result < 0)
          result = 0;
        found = true;
        break;
      }
    }
    if (!found) {
      result = hes.length - 1;
    }
    return result;
  };
  Histogram.prototype.getSumHits = function (hes, startIdx, cnt) {
    var result = 0;
    var ptr;
    for (ptr = startIdx; ptr < startIdx + cnt; ptr++) {
      result += hes[ptr].occurances;
    }
    return result;
  };
  Histogram.prototype.getAverageOcc = function (hes, startIdx, cnt) {
    var total = this.getSumHits(hes, startIdx, cnt);
    var avg = total / cnt;
    return avg;
  };
  Histogram.prototype.getIndexOfMaxIter = function (hes, numberOfEntriesToCheck) {
    var result = 0;
    var curMaxVal = -1;
    var ptr;
    var start = hes.length - 1;
    var end = start - numberOfEntriesToCheck;
    if (end < 0)
      end = 0;
    for (ptr = start; ptr >= end; ptr--) {
      if (hes[ptr].occurances > curMaxVal) {
        curMaxVal = hes[ptr].occurances;
        result = ptr;
      }
    }
    if (result !== start) {
      // Perhaps there is no large entry at the end for the maxInterations
      // If the maximum value found is less than 5 times the average occurances
      // then just use the last entry.
      var avg = this.getAverageOcc(hes, 0, hes.length);
      if (curMaxVal < avg * 5) {
        result = start;
      }
      else {
        // We did find a large entry near the end, but it was not at the very end.
        var cnt = end - start;
        console.log('The maximum value of the last ' + cnt + ' histogram entries is not the last entry.');
      }
    }
    return result;
  };
  /// --- End By Division ---
  /// --- By Percentages ---
  Histogram.prototype.getCutoffs = function (percentages) {
    var result = new Array(percentages.length);
    var hes = this.getHistEntries();
    // Get Total hits excluding the hits from those points that reached the maxium iteration count.
    var maxIterIndex = this.getIndexOfMaxIter(hes, 5);
    var total = this.getSumHits(hes, 0, maxIterIndex);
    var runningPercent = 0;
    var idxAndSum = new IndexAndRunningSum(0, 0);
    var ptr;
    for (ptr = 0; ptr < percentages.length; ptr++) {
      runningPercent += percentages[ptr]; // / 100;
      var target = runningPercent * total;
      idxAndSum = this.getCutOff(target, hes, idxAndSum);
      if (idxAndSum.idx < hes.length) {
        result[ptr] = hes[idxAndSum.idx].val;
      }
      else {
        // Use the value of the last entry and exit.
        result[ptr] = hes[hes.length - 1].val;
        break;
      }
    }
    return result;
  };
  Histogram.prototype.getCutOff = function (targetVal, hes, startIdxAndSum) {
    var ptr = startIdxAndSum.idx;
    var rs = startIdxAndSum.runningSum;
    //if (targetVal > rs) {
    //  throw new RangeError('targetVal > running sum on call to getCutOff.');
    //}
    var haveAdvanced = false;
    while (ptr < hes.length) {
      var newRs = rs + hes[ptr].occurances;
      if (newRs > targetVal) {
        if (haveAdvanced) {
          var diffPrev = targetVal - rs;
          var diffNext = newRs - targetVal;
          if (diffNext <= diffPrev) {
            rs = newRs;
            ptr++;
          }
        }
        else {
          // Must use the next value because we have not yet advanced any -- which means the current value has already been used.
          rs = newRs;
          ptr++;
        }
        break;
      }
      else {
        rs = newRs;
        ptr++;
        haveAdvanced = true;
      }
    }
    var result = new IndexAndRunningSum(ptr, rs);
    return result;
  };
  /// --- End Target Percentage ---
  Histogram.prototype.getHistEntries = function () {
    var result = new Array(this.entriesMap.size);
    var vals = Array.from(this.entriesMap.keys());
    var occs = Array.from(this.entriesMap.values());
    var ptr;
    for (ptr = 0; ptr < this.entriesMap.size; ptr++) {
      result[ptr] = new HistEntry(vals[ptr], occs[ptr]);
    }
    result.sort(function (a, b) { return a.val - b.val; });
    // Set our maxVal, while since we have gone to the trouble of getting sorting our map.
    this._maxVal = result[result.length - 1].val;
    return result;
  };
  Histogram.prototype.getHistArrayPair = function () {
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
    if (vals === undefined || vals.length === 0)
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
  Histogram.prototype.getGroupCnts = function (breakPoints) {
    var result = new Array(breakPoints.length);
    var hes = this.getHistEntries();
    var lastIdx = 0;
    var ptr;
    for (ptr = 0; ptr < breakPoints.length; ptr++) {
      var accum = 0;
      var thisBp = breakPoints[ptr];
      var p2 = void 0;
      for (p2 = lastIdx; p2 < hes.length; p2++) {
        if (hes[p2].val <= thisBp) {
          accum += hes[p2].occurances;
        }
        else {
          break;
        }
      }
      result[ptr] = accum;
      lastIdx = p2;
    }
    // Add up all occurances after the last break point.
    var accum2 = 0;
    var p3;
    for (p3 = lastIdx; p3 < hes.length; p3++) {
      accum2 += hes[p3].occurances;
    }
    result.push(accum2);
    return result;
  };
  Histogram.prototype.getGroupPercentages = function (groupCounts) {
    var result = new Array(groupCounts.length);
    var hes = this.getHistEntries();
    var maxIterIndex = this.getIndexOfMaxIter(hes, 5);
    var total = this.getSumHits(hes, 0, maxIterIndex);
    var ptr;
    for (ptr = 0; ptr < groupCounts.length; ptr++) {
      result[ptr] = groupCounts[ptr] / total;
    }
    return result;
  };
  Histogram.prototype.toString = function () {
    var result = '';
    var hEntries = this.getHistEntries();
    var ptr;
    for (ptr = 0; ptr < hEntries.length; ptr++) {
      var he = hEntries[ptr];
      result = result + he.toString() + '\n';
    }
    return result;
  };
  Histogram.getBreakPointsDisplay = function (bps) {
    var result = '';
    var startRange = 0;
    var ptr;
    for (ptr = 0; ptr < bps.length; ptr++) {
      var endRange = bps[ptr];
      result += 'Range ' + ptr + ': ' + startRange + '-' + endRange + '\n';
      startRange = endRange;
    }
    return result;
  };
  return Histogram;
}());
var CurWorkVal = /** @class */ (function () {
  function CurWorkVal() {
    this.z = new Point(0, 0);
    this.cnt = 0;
    this.escapeVel = 0;
    this.done = false;
  }
  return CurWorkVal;
}());
var MapWorkingData = /** @class */ (function () {
  function MapWorkingData(canvasSize, mapInfo, colorMap, sectionAnchor) {
    this.canvasSize = canvasSize;
    this.mapInfo = mapInfo;
    this.colorMap = colorMap;
    this.sectionAnchor = sectionAnchor;
    this.elementCount = this.getNumberOfElementsForCanvas(this.canvasSize);
    this.workingVals = this.buildWorkingVals(this.elementCount);
    // X coordinates get larger as one moves from the left of the map to  the right.
    this.xVals = MapWorkingData.buildVals(this.canvasSize.width, this.mapInfo.bottomLeft.x, this.mapInfo.topRight.x);
    // Y coordinates get larger as one moves from the bottom of the map to the top.
    // But ImageData "blocks" are drawn from top to bottom.
    if (mapInfo.upsideDown) {
      // The y coordinates are already reversed, just use buildVals
      this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.bottomLeft.y, this.mapInfo.topRight.y);
    }
    else {
      // if we only have a single section, then we must reverse the y values.
      // The y coordinates are not reversed, reverse them here.
      this.yVals = MapWorkingData.buildVals(this.canvasSize.height, this.mapInfo.topRight.y, this.mapInfo.bottomLeft.y);
    }
    this.curIterations = 0;
    this.log2 = Math.log10(2);
    console.log('Constructing MapWorkingData, ColorMap = ' + this.colorMap + '.');
  }
  Object.defineProperty(MapWorkingData.prototype, "cnts", {
    // The number of times each point has been iterated.
    get: function () {
      var result = new Uint16Array(this.elementCount);
      var ptr;
      for (ptr = 0; ptr < this.elementCount; ptr++) {
        result[ptr] = this.workingVals[ptr].cnt;
      }
      return result;
    },
    enumerable: true,
    configurable: true
  });
  MapWorkingData.prototype.buildWorkingVals = function (elementCount) {
    var result = new Array(elementCount);
    var ptr;
    for (ptr = 0; ptr < this.elementCount; ptr++) {
      result[ptr] = new CurWorkVal();
    }
    return result;
  };
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
  // Returns the index to use when accessing wAData, wBData, cnts or flags.
  MapWorkingData.prototype.getLinearIndex = function (c) {
    return c.x + c.y * this.canvasSize.width;
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
    var wv = this.workingVals[ptr];
    if (wv.done) {
      // This point has been flagged, don't iterate.
      return true;
    }
    var z = wv.z;
    var c = new Point(this.xVals[mapCoordinate.x], this.yVals[mapCoordinate.y]);
    var cntr;
    var zxSquared = z.x * z.x;
    var zySquared = z.y * z.y;
    for (cntr = 0; cntr < iterCount; cntr++) {
      z.y = 2 * z.x * z.y + c.y;
      z.x = zxSquared - zySquared + c.x;
      zxSquared = z.x * z.x;
      zySquared = z.y * z.y;
      if (zxSquared + zySquared > this.mapInfo.threshold) {
        // This point is done.
        // One more interation
        z.y = 2 * z.x * z.y + c.y;
        z.x = zxSquared - zySquared + c.x;
        zxSquared = z.x * z.x;
        zySquared = z.y * z.y;
        // Ok, two more interations
        z.y = 2 * z.x * z.y + c.y;
        z.x = zxSquared - zySquared + c.x;
        zxSquared = z.x * z.x;
        zySquared = z.y * z.y;
        var modulus = Math.log10(zxSquared + zySquared) / 2;
        var nu = Math.log10(modulus / this.log2) / this.log2;
        //let nu: number = Math.log(modulus) / this.log2;
        wv.escapeVel = 1 - nu / 4; // / 4;
        //wv.escapeVel = nu;
        wv.done = true;
        break;
      }
    }
    // Store the new value back to our Working Data.
    wv.z.x = z.x;
    wv.z.y = z.y;
    // Increment the number of times this point has been iterated.
    wv.cnt += cntr;
    this;
    return wv.done;
  };
  // Updates each element by performing a single interation.
  // Returns true if at least one point is not done.
  MapWorkingData.prototype.doIterationsForAll = function (iterCount) {
    // The processed values will be old after this completes.
    //this.isProcessed = false;
    var stillAlive = false; // Assume all done until one is found that is not done.
    var x;
    var y;
    for (y = 0; y < this.canvasSize.height; y++) {
      for (x = 0; x < this.canvasSize.width; x++) {
        var pointIsDone = this.iterateElement(new Point(x, y), iterCount);
        if (!stillAlive && !pointIsDone) stillAlive = true;
          stillAlive = true;
      }
    }
    return stillAlive;
  };
  MapWorkingData.prototype.getPixelData = function () {
    var imgData = new Uint8ClampedArray(this.elementCount * 4);
    // Address the image data buffer as Int32's
    var pixelData = new Uint32Array(imgData.buffer);
    var ptr;
    for (ptr = 0; ptr < this.elementCount; ptr++) {
      var wv = this.workingVals[ptr];
      var cNum = this.colorMap.getColor(wv.cnt, wv.escapeVel);
      pixelData[ptr] = cNum;
    }
    return imgData;
  };
  // Divides the specified MapWorking data into the specified vertical sections, each having the width of the original Map.
  MapWorkingData.getWorkingDataSections = function (canvasSize, mapInfo, colorMap, numberOfSections) {
    console.log('At getWorkingDataSections, ColorMap = ' + colorMap + '.');
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
    if (mapInfo.upsideDown) {
      // The y coordinates are already reversed, just use buildVals
      yVals = MapWorkingData.buildVals(canvasSize.height, mapInfo.bottomLeft.y, mapInfo.topRight.y);
    }
    else {
      // The y coordinates are not reversed, reverse them here.
      yVals = MapWorkingData.buildVals(canvasSize.height, mapInfo.topRight.y, mapInfo.bottomLeft.y);
    }
    var ptr = 0;
    // Build all but the last section.
    for (; ptr < numberOfSections - 1; ptr++) {
      var secCanvasSize_1 = new CanvasSize(canvasSize.width, sectionHeightWN);
      var secBottom_1 = yVals[bottomPtr];
      var secTop_1 = yVals[topPtr];
      var secBotLeft_1 = new Point(left, secBottom_1);
      var secTopRight_1 = new Point(right, secTop_1);
      var coords_1 = new Box(secBotLeft_1, secTopRight_1);
      var secMapInfo_1 = new MapInfo(coords_1, mapInfo.maxIterations, mapInfo.threshold, mapInfo.iterationsPerStep);
      var yOffset_1 = ptr * sectionHeightWN;
      var secAnchor_1 = new Point(0, yOffset_1);
      result[ptr] = new MapWorkingData(secCanvasSize_1, secMapInfo_1, colorMap, secAnchor_1);
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
    var secMapInfo = new MapInfo(coords, mapInfo.maxIterations, mapInfo.threshold, mapInfo.iterationsPerStep);
    var yOffset = ptr * sectionHeightWN;
    var secAnchor = new Point(0, yOffset);
    result[ptr] = new MapWorkingData(secCanvasSize, secMapInfo, colorMap, secAnchor);
    return result;
  };
  MapWorkingData.prototype.iterationCountForNextStep = function () {
    var result;
    var gap = this.mapInfo.maxIterations - this.curIterations;
    if (gap > this.mapInfo.iterationsPerStep) {
      result = this.mapInfo.iterationsPerStep;
    }
    else {
      result = gap;
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
var ColorMapEntryBlendStyle;
(function (ColorMapEntryBlendStyle) {
  ColorMapEntryBlendStyle[ColorMapEntryBlendStyle["none"] = 0] = "none";
  ColorMapEntryBlendStyle[ColorMapEntryBlendStyle["next"] = 1] = "next";
  ColorMapEntryBlendStyle[ColorMapEntryBlendStyle["endColor"] = 2] = "endColor";
})(ColorMapEntryBlendStyle || (ColorMapEntryBlendStyle = {}));
var ColorMapEntry = /** @class */ (function () {
  function ColorMapEntry(cutOff, colorNum, blendStyle, endColorNum) {
    this.cutOff = cutOff;
    this.colorNum = colorNum;
    this.blendStyle = blendStyle;
    this.endColorNum = endColorNum;
  }
  return ColorMapEntry;
}());
var ColorMap = /** @class */ (function () {
  function ColorMap(ranges, highColor) {
    this.ranges = ranges;
    this.highColor = highColor;
    if (ranges === null || ranges.length === 0) {
      throw new Error('When creating a ColorMap, the ranges argument must have at least one entry.');
    }
    // Update the prevCutOff and bucketWidth values for each of our ColorMapEntries.
    this.setBucketWidths();
  }
  //public static FromTypedArrays(cutOffs: Uint16Array, colorNums: Uint32Array, highColor: number): ColorMap {
  //  let workRanges: ColorMapEntry[] = new Array<ColorMapEntry>(cutOffs.length);
  //  let i: number = 0;
  //  for (; i < cutOffs.length; i++) {
  //    workRanges[i] = new ColorMapEntry(cutOffs[i], colorNums[i], ColorMapEntryBlendStyle.none, null);
  //  }
  //  let result: ColorMap = new ColorMap(workRanges, highColor);
  //  return result;
  //}
  ColorMap.prototype.getColor = function (countValue, escapeVel) {
    var result;
    var index = this.searchInsert(countValue);
    if (index === this.ranges.length) {
      result = this.highColor;
      return result;
    }
    var cme = this.ranges[index];
    var cNum1 = cme.colorNum;
    if (cme.blendStyle === ColorMapEntryBlendStyle.none) {
      result = cme.colorNum;
      return result;
    }
    var cNum2;
    if (cme.blendStyle === ColorMapEntryBlendStyle.next) {
      if (index + 1 === this.ranges.length) {
        cNum2 = this.highColor;
      }
      else {
        cNum2 = this.ranges[index + 1].colorNum;
      }
    }
    else {
      cNum2 = cme.endColorNum;
    }
    result = this.blend(cme.prevCutOff, cme.bucketWidth, countValue, cNum1, cNum2, escapeVel);
    return result;
  };
  ColorMap.prototype.blend = function (botBucketVal, bucketWidth, countValue, cNum1, cNum2, escapeVel) {
    var c1 = ColorNumbers.getColorComponents(cNum1);
    var c2 = ColorNumbers.getColorComponents(cNum2);
    var cStart;
    if (countValue === botBucketVal) {
      // We're starting at the very bottom.
      //cStart = new Array<number>(...c1);
      cStart = c1;
    }
    else {
      var stepFactor = (-1 + countValue - botBucketVal) / bucketWidth;
      cStart = this.simpleBlend(c1, c2, stepFactor);
    }
    var intraStepFactor = escapeVel / bucketWidth; // 1 / bucketWidth; //
    var r = cStart[0] + (c2[0] - c1[0]) * intraStepFactor;
    var g = cStart[1] + (c2[1] - c1[1]) * intraStepFactor;
    var b = cStart[2] + (c2[2] - c1[2]) * intraStepFactor;
    if (r < 0 || r > 255) {
      console.log('Bad red value.');
    }
    if (g < 0 || g > 255) {
      console.log('Bad green value.');
    }
    if (b < 0 || b > 255) {
      console.log('Bad blue value.');
    }
    var newCNum = ColorNumbers.getColor(r, g, b, 255);
    return newCNum;
  };
  ColorMap.prototype.simpleBlend = function (c1, c2, factor) {
    if (factor === 0) {
      return c1;
    }
    var r = c1[0] + (c2[0] - c1[0]) * factor;
    var g = c1[1] + (c2[1] - c1[1]) * factor;
    var b = c1[2] + (c2[2] - c1[2]) * factor;
    if (r < 0 || r > 255) {
      console.log('Bad red value.');
    }
    if (g < 0 || g > 255) {
      console.log('Bad green value.');
    }
    if (b < 0 || b > 255) {
      console.log('Bad blue value.');
    }
    var result = [r, g, b, 255];
    return result;
  };
  // Returns the index of the range entry that either
  // 1. matches the given countVal
  // or
  // 2. contains the first entry with a cutOff value greater than the given countVal.
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
  ColorMap.prototype.setBucketWidths = function () {
    var ptr;
    this.ranges[0].bucketWidth = this.ranges[0].cutOff;
    this.ranges[0].prevCutOff = 0;
    var prevCutOff = this.ranges[0].cutOff;
    for (ptr = 1; ptr < this.ranges.length; ptr++) {
      this.ranges[ptr].prevCutOff = prevCutOff;
      this.ranges[ptr].bucketWidth = this.ranges[ptr].cutOff - prevCutOff;
      prevCutOff = this.ranges[ptr].cutOff;
    }
    //this.ranges[this.ranges.length - 1].prevCutOff = prevCutOff;
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
  ColorMap.prototype.toString = function () {
    var result = 'ColorMap with ' + this.ranges.length + ' entries.';
    return result;
  };
  return ColorMap;
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
    var result = new MapWorkingData(this.canvasSize, this.mapInfo, this.colorMap, this.sectionAnchor);
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
  function WebWorkerUpdateColorMapRequest(messageKind, colorMap) {
    this.messageKind = messageKind;
    this.colorMap = colorMap;
  }
  WebWorkerUpdateColorMapRequest.FromEventData = function (data) {
    // Since the value of data does not contain any of the functions defined for a ColorMap object,
    // we must create a new ColorMap from the raw data members of the provided 'raw' instance.
    var newColorMap = new ColorMap(data.colorMap.ranges, data.colorMap.highColor);
    var result = new WebWorkerUpdateColorMapRequest(data.messageKind, newColorMap);
    return result;
  };
  WebWorkerUpdateColorMapRequest.CreateRequest = function (colorMap) {
    var result = new WebWorkerUpdateColorMapRequest("UpdateColorMap", colorMap);
    return result;
  };
  return WebWorkerUpdateColorMapRequest;
}());
// Only used when the javascript produced from compiling this TypeScript is used to create worker.js
var mapWorkingData = null;
var sectionNumber = 0;
// Handles messages sent from the window that started this web worker.
onmessage = function (e) {
  var pixelData;
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
    mapWorkingData.colorMap = upColorMapReq.colorMap;
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
