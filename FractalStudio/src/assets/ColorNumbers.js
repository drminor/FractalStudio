var ColorNumbers = /** @class */ (function () {
    function ColorNumbers() {
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
        if (alpha === undefined) {
            alpha = 255;
        }
        else {
            if (alpha > 255 || alpha < 0)
                throw new RangeError('Alpha must be between 0 and 255.');
        }
        var result = alpha << 24;
        result |= b << 16;
        result |= g << 8;
        result |= r;
        return result;
    };
    ColorNumbers.getColorFromComps = function (comps) {
        var result = ColorNumbers.getColor(comps[0], comps[1], comps[2], comps[3]);
        return result;
    };
    ColorNumbers.getColorFromCssColor = function (cssColor) {
        var comps = ColorNumbers.getColorComponentsFromCssColor(cssColor);
        var result = ColorNumbers.getColorFromComps(comps);
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
    // TODO: handle conversion from Alpha in range from 0.0 to 1.0 to range: 0 to 255.
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
    ColorNumbers.getRgbHex = function (comps) {
        var result = '#'
            + ('0' + comps[0].toString(16)).slice(-2)
            + ('0' + comps[1].toString(16)).slice(-2)
            + ('0' + comps[2].toString(16)).slice(-2);
        //return "#FFFF00";
        return result;
    };
    // TODO: handle conversion from Alpha in range from 0.0 to 1.0 to range: 0 to 255.
    ColorNumbers.getRgbaString = function (comps) {
        var result = 'rgba('
            + comps[0].toString(10) + ','
            + comps[1].toString(10) + ','
            + comps[2].toString(10) + ','
            + '1'
            + ')';
        //return 'rgba(200,20,40,1)';
        return result;
    };
    ColorNumbers.get1DPos = function (imageData, cComps) {
        var result = 0;
        var minDiff = 1000;
        var ptr;
        for (ptr = 0; ptr < imageData.length; ptr += 4) {
            var curDiff = Math.abs(cComps[0] - imageData[ptr])
                + Math.abs(cComps[1] - imageData[ptr + 1])
                + Math.abs(cComps[2] - imageData[ptr + 2]);
            if (curDiff < minDiff) {
                minDiff = curDiff;
                result = ptr;
            }
        }
        result = result / 4;
        return result;
    };
    ColorNumbers.white = ColorNumbers.getColor(255, 255, 255);
    ColorNumbers.black = ColorNumbers.getColor(0, 0, 0);
    ColorNumbers.red = ColorNumbers.getColor(255, 0, 0);
    ColorNumbers.green = ColorNumbers.getColor(0, 255, 0);
    ColorNumbers.blue = ColorNumbers.getColor(0, 0, 255);
    return ColorNumbers;
}());
