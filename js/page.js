/**
 * Returns an array with 256 RGB colors
 * evenly distributed from "UV" to "Infrared"
 * respecting the human color perception
 **/
function colortable() {
  /* Poor man's compression - patent pending ;-) */
  var comp = [[123,[[69,-122]],34,24,[1,17],11,10,9,8,6,[[110,-136]],35,17,16,11,8,9,[1,7],9,[2,6],5,7,[4,5],6,5,4,5,[1,4],6,4,5,[1,4],5,[4,4],[28,5]],
    [1,[[3,148]],[1,[2,-1]],[[1,-1]],[[2,-1]],-1,[2,[1,-1]],-1,[[1,-1]],[2,-1],[[1,-1]],[8,-1],-2,[1,-1],-2,-1,[1,-2],-1,-2,-1,[4,-2],-3,-2,
    [2,-3],-2,-4,-3,-5,[1,-4],[1,-5],[1,-8],-10,-16,[[7,-12]],[[2,145]],[[1,-1]],-1,[5,[1,-1]],[2,[2,-1]],[1,[3,-1]],[[4,-1]],[[8,-1]],[[28,-1]],
    [[3,-1]],[1,3],9,12,[4,9],[[1,2]],[[1,-3]],[1,[1,-1]],-1,[[1,-1]],[1,-1],[[1,-1]],[13,-1],-2,[2,-1],-2,-1,-2,[1,-1],[2,-2],-1,[7,-2],[1,-3],
    -2,-3,-2,-3,-4,[1,-3],-4,-3,-4,-6,-4,[2,-5],-9,-7,-8,-11,-13,-26,[11,-7]],[[[91,256]],-1,-6,[1,-5],-6,-7,[2,-5],-6,-7,[4,-5],-7,[4,-5],-7,[3,-5],
    -7,[4,-5],-7,[1,-5],-6,-5,-6,-8,-7,-8,-9,-14,[119,-1]]];

  var channels = [[],[],[]];
  var colors = [];

  for(var chan = 0; chan < 3; chan++) {
    var val = 0;

    for(var i = 0; i < comp[chan].length; i++) {
      if(Object.prototype.toString.call(comp[chan][i]) != '[object Array]') {
        val = val + comp[chan][i];
        channels[chan].push(val);
      } else if(Object.prototype.toString.call(comp[chan][i][0]) == '[object Array]') {
        val = val + comp[chan][i][0][1];
        for(var j = 0; j <= comp[chan][i][0][0]; j++) channels[chan].push(val);
      } else if(Object.prototype.toString.call(comp[chan][i][1]) != '[object Array]') {
        for(var j = 0; j <= comp[chan][i][0]; j++) {
          val = val + comp[chan][i][1];
          channels[chan].push(val);
        }
      } else {
        for(var j = 0; j <= comp[chan][i][0]; j++) {
          val = val + comp[chan][i][1][1];
          for(var k = 0; k <= comp[chan][i][1][0]; k++) channels[chan].push(val);
        }
      }
    }
  }

  for(var i = 0; i < channels[0].length; i++) colors.push([channels[0][i], channels[1][i], channels[2][i]]);

  return colors;
}

/** 
 * Extracts just freq and amp from sample array data
 * json: sample array data from server
 * return: array of freq,amp tuples
 **/
function formatDumpInfo(json) {
  return json.data.map(function(col) {
    return {freq: col[0], amp: col[1]};
  })
};

/**
 * valuesArr: list of values
 * return: one random value of the array
 **/
function randomSelect(valuesArr) {
  var choice = Math.floor(Math.random() * valuesArr.length);
  return valuesArr[choice]
}

/*
 * Turns a fetch response into a json object
 * response: fetch response
 * return: json-ified response
 */
function toJSON(response) {
  return response.json()
}

/**
 * Creates a buffer for values. Each time you call the function returned,
 * it will add the value at the end of the buffer, and return the buffer.
 * Once you get the ammount of values in the buffer, when you add a new value,
 * the first added gets dumped.
 * size: size of the buffer to be created.
 * return: buffer function
 **/
function buffer(size) {
  var bufferValues = [];

  /**
   * Adds values to the buffer.
   * value: value to be added to the buffer.
   * return: the array of buffered values
   **/
  return function(value) {
    bufferValues.unshift(value);
    if(bufferValues.length > size) {
      bufferValues.pop();
    }
    return bufferValues;
  }
}

/**
 * Mutates object values adding indexes to them in an two-dimensional matrix
 * values: a two-dimensional matrix with objects in it
 * returns: the mutated matrix with x and y values with the indexes
 *
 **/
function addIndex(values) {
  var x, y;
  for (y = 0; y < values.length; y++) {
    for (x = 0; x < values[y].length; x++) {
      values[y][x].x = x;
      values[y][x].y = y;
    }
  }
  return values
}

/**
 * Throws error if error happened in the response
 * response: fetch-like response object
 * return: fetch-like response object
 * throws: promise's error
 **/
function checkStatus(response) {
  if (! response.ok) {
    var error = new Error(response.statusText);
    error.response = response;
    return Promise.reject(error);
  }
  return response;
}

var ctable = colortable();

var body;
var instantGraph = {
  ampDomain: [-110, -50],
  freqDomain: [5600, 5700],
  canvas: null,
  width: 400,
  height: 500,
  padding: 30,
  domain: null,
  yScale: null,
  xScale: null,
  colorScale: null,
  xGroup: null,
  yGroup: null,
  setup: function(container) {
    this.canvas = container.append("svg")
      .attr('width', this.width)
      .attr('height', this.height);

    // Amplitude
    this.yScale = d3.scaleLinear()
      .domain(this.ampDomain)
      .range([0, this.height - this.padding * 2])
      .clamp(true);

    // Intensity(Amplitude)
    this.colorScale = d3.scaleLinear()
      .domain(this.ampDomain)
      .range([0, ctable.length])
      .clamp(true);

    // Frequency
    this.xScale = d3.scaleLinear()
      .domain(this.freqDomain)
      .range([0, this.width - this.padding * 2]);

    this.xAxis = d3.axisBottom(this.xScale);
    this.xGroup = this.canvas
      .append('g')
      .attr("transform", "translate("+ this.padding + ", " + ( this.height - this.padding ) + ")")
      .call(this.xAxis);

    this.yAxis = d3.axisLeft(this.yScale);
    this.yGroup = this.canvas.append('g')
      .attr("transform", "translate(" + ( this.padding ) + " " + ( this.padding ) + ")")
      .call(this.yAxis)
  },
  render: function(values) {
    function renderSelf(selector) {
      selector
        .attr('class', 'col')
        .style('background-color', function(d) {
                        var c = ctable[Math.floor(this.colorScale( d.amp ))];
                        return ("rgb(" + c[0] + "," + c[1] + "," + c[2] + ")");
                }.bind(this))
        .attr('fill', function(d) {var c = ctable[Math.floor(this.colorScale( d.amp ))]; return ("rgb("+c[0]+","+c[1]+","+c[2]+")");}.bind(this))
        .attr('x', function(d) { return this.xScale( d.freq ) + this.padding }.bind(this))
        .attr('y', function(d) { return  this.height - this.yScale(d.amp) - this.padding }.bind(this))
        .style('height', function(d) { return this.yScale(d.amp) }.bind(this));
    }

    this.canvas
      .selectAll('rect')
      .data(values, function(d) {return d.freq})
      .call(renderSelf.bind(this))
      .enter()
      .append("rect")
      .call(renderSelf.bind(this))
      .exit().remove();

    return values;
  }
}

var windowGraph = {
  canvas: null,
  windowSize: 10,
  width: 400,
  height: 500,
  padding: null,
  domain: null,
  yScale: null,
  xScale: null,
  colorScale: null,
  xGroup: null,
  yGroup: null,
  container: null,
  setup: function(container) {
    this.canvas = container.append("svg")
      .attr('width', this.width)
      .attr('height', this.height);

    this.container = this.canvas.append('g')
      .attr('class', 'container');

    this.padding = 30;
    this.domain = [-110, -50];

    // Size of the window
    this.yScale = d3.scaleLinear()
      .domain([ 0, this.windowSize ])
      .range([0, this.height - this.padding * 2]);

    // Intensity(Amplitude)
    this.colorScale = d3.scaleLinear()
      .domain([this.domain[0], this.domain[1]])
      .range([0, ctable.length])
     .clamp(true);

    // Frequency
    this.xScale = d3.scaleLinear()
      .domain([5600, 5700])
      .range([0, this.width - this.padding * 2]);

    this.xAxis = d3.axisBottom(this.xScale);
    this.xGroup = this.canvas .append('g')
      .attr("transform", "translate("+ this.padding + ", " + ( this.height - this.padding ) + ")")
      .call(this.xAxis);

    this.yAxis = d3.axisLeft(this.yScale);
    this.yGroup = this.canvas.append('g')
      .attr("transform", "translate(" + ( this.padding ) + " " + ( this.padding ) + ")")
      .call(this.yAxis)
  },
  render: function(values) {
    addIndex(values);

    function render(target) {
      target
        .attr('x', function(d) { return this.padding + this.xScale(d.freq) }.bind(this))
        .attr('y', function(d) { return this.padding + this.yScale(d.y) }.bind(this))
        .style('height', function(d) {return ( this.height - ( this.padding * 2 ) ) / this.windowSize;}.bind(this))
        .style('width', function(d) { return 1 }.bind(this))
        .attr('fill', function(d) {
                var c = ctable[Math.floor(this.colorScale( d.amp ))];
                return ("rgb(" + c[0] + "," + c[1] + "," + c[2] + ")");
              }.bind(this))
    }

    var rows = this.container.selectAll('g.row')
    .data(values);

    var rowsEnter = rows.enter()
    .append('g')
    .attr('class', 'row')
    .merge(rows);


    var rects = rowsEnter.selectAll('rect')
      .data(function(row) {return row}, function(d) { return d.freq })

    rects.exit()
      .remove();

    rects.enter()
      .append('rect')
      .merge(rects)
      .call(render.bind(this))

    return values;
  }
}

function setup() {
  instantGraph.setup(d3.select('div.spectrumGraphs'));
  windowGraph.setup(d3.select('div.spectrumGraphs'));
}

function loop() {
  fetch('samples/ath10k_80mhz.dump.json')
    .then(checkStatus)
    .then(toJSON)
    .then(randomSelect)
    .then(formatDumpInfo)
    .then(instantGraph.render.bind(instantGraph))
    .then(valueBuffer)
    .then(windowGraph.render.bind(windowGraph));
}

var enabledFlag = true;
function ifEnabled(fn) {
  if(enabledFlag) {
    fn()
  }
}

function toggleEnabled() {
  enabledFlag = !enabledFlag;
  document.getElementById("playpause").innerHTML = enabledFlag ? "pause" : "play";
}

setup();
var valueBuffer = buffer(windowGraph.windowSize);
setInterval(ifEnabled.bind(this, loop), 500)
