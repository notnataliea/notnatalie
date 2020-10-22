function CurvePoints(points, tension, isClosed, numOfSegments) {
	'use strict';

	// options or defaults
	tension = (typeof tension === 'number') ? tension : 0.5;
  isClosed = isClosed ? isClosed : false;
	numOfSegments = numOfSegments ? numOfSegments : 20;

	var pts,
		res = [],
		l = points.length, i,
		cache = new Float32Array((numOfSegments+2)*4),
		cachePtr = 4;

    pts = points.slice(0);

    // The algorithm require a previous and next point to the actual point array.
    // Check if we will draw closed or open curve.
    // If closed, copy end points to beginning and first points to end
    // If open, duplicate first points to beginning, end points to end
	if (isClosed) {
		pts.unshift(points[l - 1]); // insert end point as first point
		pts.push(points[0]); // first point as last point
	}
	else {
		pts.unshift(points[0]); // copy 1. point and insert at beginning
		pts.push(points[l - 1]);	// duplicate end-points
	}

	// cache inner-loop calculations as they are based on t alone
	cache[0] = 1;

	for (i = 1; i < numOfSegments; i++) {

		var step = i / numOfSegments,
			step2 = step * step,
			step3 = step2 * step,
			step23 = step3 * 2,
			step32 = step2 * 3;

		cache[cachePtr++] =	step23 - step32 + 1;	    // c1
		cache[cachePtr++] =	step32 - step23;		      // c2
		cache[cachePtr++] =	step3 - 2 * step2 + step;	// c3
		cache[cachePtr++] =	step3 - step2;			      // c4
	}

	cache[++cachePtr] = 1;

	// calc. points
	parse(pts, cache, l);

	if (isClosed) {
		//l = points.length;
		pts = [];
		pts.push(points[l - 2], points[l - 1]); // second last and last
		pts.push(points[0], points[1]); // first and second
		parse(pts, cache, 4);
	}

	function parse(pts, cache, l) {

		for (var i = 1; i < l; i ++) {

			var pt1 = pts[i][0],
				pt2 = pts[i][1],
				pt3 = pts[i + 1][0],
				pt4 = pts[i + 1][1],
        // calc tension vectors
        t1x = (pt3 - pts[i - 1][0]) * tension,
        t1y = (pt4 - pts[i - 1][1]) * tension,
        t2x = (pts[i + 2][0] - pt1) * tension,
        t2y = (pts[i + 2][1] - pt2) * tension;

			for (var t = 0; t <= numOfSegments; t++) {
				var c = t * 4;

        // calc x and y cords with common control vectors
				res.push([
          cache[c] * pt1 + cache[c+1] * pt3 + cache[c+2] * t1x + cache[c+3] * t2x,
          cache[c] * pt2 + cache[c+1] * pt4 + cache[c+2] * t1y + cache[c+3] * t2y
        ]);
			}
		}
	}

	return res;
};


function EaseInOutQuad(t, b, c, d) {
	t /= d/2;
	if (t < 1) return c/2*t*t + b;
	t--;
	return -c/2 * (t*(t-2) - 1) + b;
};

// http://mrl.nyu.edu/~perlin/noise/
function ImprovedNoise() {
    var p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
      23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
      174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
      133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
      89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
      202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
      248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
      178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
      14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
      93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

    for (var i = 0; i < 256; i++) {
      p[256 + i] = p[i];
    }

    function fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }

    function lerp(t, a, b) {
      return a + t * (b - a);
    }

    function grad(hash, x, y, z) {
      var h = hash & 15;
      var u = h < 8 ? x : y,
        v = h < 4 ? y : h == 12 || h == 14 ? x : z;
      return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    }

    return {
      noise: function(x, y, z) {
        var floorX = Math.floor(x),
          floorY = Math.floor(y),
          floorZ = Math.floor(z);

        var X = floorX & 255,
          Y = floorY & 255,
          Z = floorZ & 255;

        x -= floorX;
        y -= floorY;
        z -= floorZ;

        var xMinus1 = x - 1,
          yMinus1 = y - 1,
          zMinus1 = z - 1;

        var u = fade(x),
          v = fade(y),
          w = fade(z);

        var A = p[X] + Y,
          AA = p[A] + Z,
          AB = p[A + 1] + Z,
          B = p[X + 1] + Y,
          BA = p[B] + Z,
          BB = p[B + 1] + Z;

        return lerp(
          w,
          lerp(
            v,
            lerp(u, grad(p[AA], x, y, z), grad(p[BA], xMinus1, y, z)),
            lerp(u, grad(p[AB], x, yMinus1, z), grad(p[BB], xMinus1, yMinus1, z))
          ),
          lerp(
            v,
            lerp(
              u,
              grad(p[AA + 1], x, y, zMinus1),
              grad(p[BA + 1], xMinus1, y, z - 1)
            ),
            lerp(
              u,
              grad(p[AB + 1], x, yMinus1, zMinus1),
              grad(p[BB + 1], xMinus1, yMinus1, zMinus1)
            )
          )
        );
      }
    };
  };


// Starting Variables
let canvas, canvasContainer; // Canvas and container objects
let ctx; // Variables that store the 2D canvas context
let linesRef = []; // All base line positions in the canvas
let linesStart = [] // Tracking the starting point of the lines before animating
let lines = []; // All lines in the canvas
let noisex = []
let noisey = [];
let perlin = new ImprovedNoise(); // Noise generation based on http://mrl.nyu.edu/~perlin/noise/
let tension = 0.4;
let time = {
  count: 0,
  directionOut: true,
  elapsed: 0,
  start: null,
  total: 6000
};
let variant = [];


// Canvas container div
canvasContainer = document.createElement("div");
canvasContainer.style.width = "100%";
canvasContainer.style.height = "100%";
canvasContainer.style.overflow = "hidden";
var mainContainer = document.getElementsByTagName("main");
mainContainer[0].appendChild(canvasContainer);

// Canvas for lines and sprites
canvas = document.createElement("canvas");
canvas.width = "1030"
canvas.height = "500";
canvasContainer.appendChild(canvas);

// The drawing context on the canvas set above
ctx = canvas.getContext("2d");

linesRef = [
  [[0,-52],[78,-40],[187,-124],[345,23],[530,-82],[651,-34],[766,-70],[858,-12],[1030,-109]],
  [[0,-38],[77,-27],[186,-112],[345,35],[530,-65],[651,-20],[766,-54],[858,2],[1030,-95]],
  [[0,-24],[77,-13],[186,-99],[345,48],[529,-51],[650,-7],[766,-41],[857,17],[1030,-80]],
  [[0,-10],[76,0],[185,-84],[344,62],[529,-37],[649,7],[765,-28],[857,31],[1030,-67]],
  [[0,3],[76,14],[185,-70],[344,76],[528,-24],[648,20],[765,-13],[856,44],[1030,-52]],
  [[0,17],[75,28],[184,-56],[343,90],[528,-10],[647,33],[764,0],[856,58],[1030,-40]],
  [[0,26],[75,37],[183,-47],[343,99],[527,-1],[646,42],[764,8],[856,67],[1030,-30]],
  [[0,34],[74,45],[182,-39],[342,107],[527,7],[645,51],[763,17],[855,76],[1030,-21]],
  [[0,43],[74,54],[182,-30],[342,117],[526,16],[645,60],[763,26],[855,84],[1030,-13]],
  [[0,52],[74,63],[181,-21],[342,125],[526,24],[644,69],[763,35],[855,94],[1030,-4]],
  [[0,64],[73,74],[182,-12],[342,137],[526,37],[646,79],[764,46],[856,104],[1030,6]],
  [[0,78],[73,89],[183,4],[343,152],[525,50],[646,92],[766,58],[857,116],[1030,20]],
  [[0,90],[73,102],[184,15],[345,162],[525,64],[647,106],[768,73],[857,132],[1030,33]],
  [[0,104],[72,116],[185,29],[347,176],[525,77],[647,119],[768,88],[858,144],[1030,47]],
  [[0,118],[72,128],[186,39],[349,193],[524,90],[648,133],[770,100],[859,156],[1030,61]],
  [[0,127],[72,139],[184,51],[350,200],[524,99],[649,142],[770,109],[868,168],[1030,70]],
  [[0,136],[71,147],[182,61],[352,210],[523,110],[650,152],[777,127],[880,178],[1030,79]],
  [[0,145],[71,152],[180,75],[353,216],[523,122],[653,164],[778,140],[886,185],[1030,94]],
  [[0,151],[70,158],[178,88],[355,225],[522,135],[657,180],[778,154],[890,195],[1030,108]],
  [[0,153],[70,160],[176,99],[356,234],[522,146],[660,187],[779,168],[895,202],[1030,121]],
  [[0,155],[72,162],[170,110],[360,243],[522,160],[671,201],[788,180],[900,211],[1030,133]],
  [[0,157],[76,164],[167,121],[367,252],[522,173],[670,209],[802,189],[901,225],[1030,146]],
  [[0,159],[80,166],[164,133],[370,259],[520,184],[663,221],[807,196],[901,240],[1030,158]],
  [[0,161],[84,168],[153,142],[371,268],[515,194],[664,230],[808,203],[900,252],[1030,168]],
  [[0,169],[86,170],[146,155],[370,279],[511,202],[666,243],[809,208],[896,266],[1030,179]],
  [[0,180],[90,179],[151,173],[365,288],[504,213],[668,253],[800,226],[891,278],[1030,190]],
  [[0,192],[92,200],[156,194],[364,298],[501,225],[669,264],[797,244],[880,287],[1030,205]],
  [[0,203],[97,219],[164,212],[354,307],[502,238],[664,272],[790,260],[875,293],[1030,217]],
  [[0,215],[110,233],[174,231],[352,316],[502,251],[668,278],[786,276],[873,298],[1030,230]],
  [[0,226],[103,250],[180,245],[350,330],[501,264],[670,285],[780,292],[865,303],[1030,244]],
  [[0,236],[111,262],[191,256],[349,337],[497,276],[670,289],[771,305],[857,309],[1030,257]],
  [[0,249],[115,275],[195,269],[349,348],[494,286],[667,292],[765,319],[852,318],[1030,269]],
  [[0,259],[116,291],[195,283],[349,359],[496,298],[663,297],[756,328],[846,329],[1030,282]],
  [[0,270],[119,310],[199,301],[350,367],[494,307],[652,306],[748,335],[833,346],[1030,291]],
  [[0,284],[120,324],[195,313],[355,376],[492,321],[632,323],[741,340],[824,364],[1030,301]],
  [[0,297],[121,337],[191,328],[359,391],[491,336],[613,344],[734,347],[822,373],[1030,311]],
  [[0,310],[120,350],[187,338],[362,405],[488,350],[605,356],[721,356],[821,384],[1030,323]],
  [[0,323],[110,364],[178,354],[362,421],[486,363],[598,370],[714,365],[819,394],[1030,334]],
  [[0,337],[103,376],[169,365],[356,435],[476,380],[583,388],[703,374],[817,408],[1030,344]],
  [[0,350],[94,390],[162,380],[347,454],[462,396],[570,403],[694,385],[814,423],[1030,354]],
  [[0,367],[91,406],[157,396],[339,473],[451,416],[568,421],[689,395],[811,438],[1030,369]],
  [[0,383],[92,424],[155,413],[336,491],[449,439],[559,446],[679,407],[810,455],[1030,380]],
  [[0,399],[100,440],[160,429],[335,509],[453,456],[556,461],[678,421],[810,470],[1030,399]],
  [[0,415],[108,459],[172,449],[337,525],[463,468],[555,476],[676,437],[808,482],[1030,419]],
  [[0,432],[124,480],[188,469],[344,539],[474,481],[554,490],[675,449],[803,493],[1030,439]],
  [[0,448],[133,501],[209,489],[361,552],[484,494],[558,503],[678,463],[804,504],[1030,460]],
  [[0,465],[153,523],[233,509],[369,563],[497,509],[564,514],[682,475],[798,518],[1030,480]],
  [[0,480],[162,541],[254,528],[377,574],[504,522],[574,529],[688,486],[804,533],[1030,496]],
  [[0,498],[173,560],[264,546],[383,588],[515,533],[584,543],[693,498],[808,547],[1030,510]],
  [[0,512],[176,572],[264,566],[386,605],[523,553],[591,554],[710,521],[821,559],[1030,522]],
  [[0,527],[177,581],[265,586],[389,617],[527,567],[597,565],[720,545],[822,571],[1030,532]],
  [[0,542],[178,595],[266,604],[390,629],[531,581],[600,576],[721,572],[823,578],[1030,546]],
  [[0,557],[177,608],[267,618],[390,640],[533,595],[604,587],[729,604],[825,589],[1030,557]]
];



for (let line = 0; line < linesRef.length; line++) {
  drawCurve(ctx, linesRef[line], tension);
}
lines = JSON.parse(JSON.stringify(linesRef));

animate();

// animate, main loop
function animate() {
  if (!time.start) { time.start = Date.now(); }
  time.elapsed = Date.now() - time.start;

  if (time.elapsed >= time.total) {
    time.count++;
    time.elapsed = 0;
    time.start = Date.now();

    if (time.count == 2) {
      time.directionOut = !time.directionOut;
    }
    if (time.count == 3) {
      time.directionOut = !time.directionOut;
      time.count = 0;
    }
  }

  if (time.elapsed == 0) {
    noisex = [];
    noisey = [];
    variant = [];

    linesStart = JSON.parse(JSON.stringify(lines));
    // Create noise destination
    for (let column = 0; column < 9; column++) {
      noisex.push(perlin.noise(Math.random(), 0, 0));
      noisey.push(perlin.noise(Math.random(), 0, 0));
      variant.push({'centerPoint': Math.round (Math.random() * lines.length), 'amount': Math.abs(perlin.noise(Math.random(), 0, 0)) });
    }
  }

  update();
  draw();
  requestAnimationFrame(animate);
}

function update() {
  const progress = time.elapsed / time.total;

  for (let column = 0; column < 9; column++) {
    for (let row = 0; row < lines.length; row++) {
      let modifier = 0;

      // Add force that brings the particle back to it's origin
      if (time.directionOut === false) {
        lines[row][column][0] = EaseInOutQuad(time.elapsed, linesStart[row][column][0], linesRef[row][column][0] - linesStart[row][column][0], time.total);
        lines[row][column][1] = EaseInOutQuad(time.elapsed, linesStart[row][column][1], linesRef[row][column][1] - linesStart[row][column][1], time.total);
      } else {
        if (row != variant[column].centerPoint) {
          modifier = 0.1 * ( ( 1 - Math.abs(row - variant[column].centerPoint) / lines.length ) * (row - variant[column].centerPoint) );
        }
        // Update position
        if (column > 0 && column < 8 && lines[row][column][0] - lines[row][column - 1][0] > 50 && lines[row][column +1 ][0] - lines[row][column][0] > 50 ) {
          lines[row][column][0] += (progress * noisex[column]);
        }
        if (
          ( row == 0 && lines[row + 1][column][1] - lines[row][column][1] > 1 ) ||
          ( row == lines.length - 1 && lines[row][column][1] - lines[row - 1][column][1] > 1 ) ||
          ( row > 0 && row < lines.length - 1 && lines[row + 1][column][1] - lines[row][column][1] > 1 && lines[row][column][1] - lines[row - 1][column][1] > 1 )
        ) {
          lines[row][column][1] += (progress * noisey[column]) + (variant[column].amount * modifier);
        }
      }
    }
  }
}

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    drawCurve(ctx, line, tension);
  }
}

function drawCurve(ctx, lineCoords, tension, isClosed, numOfSegments, showPoints) {
  showPoints = showPoints ? showPoints : false;
  ctx.beginPath();
  ctx.strokeStyle = "rgba(233, 232, 242, 0.5)";

  drawLines(ctx, CurvePoints(lineCoords, tension, isClosed, numOfSegments));
  ctx.stroke();

  if (showPoints) {
    ctx.beginPath();
    for (let h = 0; h < lineCoords.length; h++) {
      const coords = lineCoords[h];
      ctx.rect(coords[0] - 2, coords[1] - 2, 4, 4);
      ctx.fill();
    }
  }
}


function drawLines(ctx, coords) {
  ctx.moveTo(coords[0][0], coords[0][1]);
  for (let i = 1; i < coords.length; i++) {
    ctx.lineTo(coords[i][0], coords[i][1]);
  }
}