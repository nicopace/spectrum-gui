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

var body;
var instantGraph = {
  canvas: null,
  width: 400,
  height: 500,
  padding: null,
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
    this.padding = 30;
    this.domain = [-110, -50];

    // Amplitude
    this.yScale = d3.scaleLinear()
      .domain(this.domain)
      .range([0, this.height - this.padding * 2])
      .clamp(true);

    // Intensity(Amplitude)
    this.colorScale = d3.scaleLinear()
      .domain([this.domain[0], (this.domain[0] + this.domain[1])/2, this.domain[1]])
      .range(["blue", "green", "red"]);

    // Frequency
    this.xScale = d3.scaleLinear()
      .domain([5600, 5700])
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
          return this.colorScale(d.amp)
        }.bind(this))
        .attr('fill', function(d) { return this.colorScale( d.amp )}.bind(this))
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
      .domain([this.domain[0], (this.domain[0] + this.domain[1])/2, this.domain[1]])
      .range(["blue", "green", "red"]);

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
        .attr('fill', function(d) { return this.colorScale( d.amp ) }.bind(this))
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
  instantGraph.setup(d3.select('body'));
  windowGraph.setup(d3.select('body'));
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

