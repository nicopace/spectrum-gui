function formatDumpInfo(json) {
  return json.map(function(sample) {
    return sample.data.map(function(col) { 
      return {freq: col[0], amp: col[1]};
    })
  })
};

function randomSelect(valuesArr) {
  var choice = Math.floor(Math.random() * valuesArr.length);
  return [valuesArr[choice]]
}

function toJSON(response) {
  return response.json()
}

function debugPrint() {
  console.log(JSON.stringify(arguments[0]));
  return arguments[0]
}

function checkStatus(response) {
  if (response.ok) {
    return response;
  } else {
    var error = new Error(response.statusText);
    error.response = response;
    return Promise.reject(error);
  }
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
    body = container;
    this.canvas = body.append("svg")
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
    this.canvas
      .selectAll('rect')
      .data(values[0], keyAccesor)
      .attr('class', 'col')
      .style('background-color', function(d) {
        return this.colorScale(d.amp)
      }.bind(this))
      .attr('fill', function(d) { return this.colorScale( d.amp )}.bind(this))
      .attr('x', function(d) { return this.xScale( d.freq ) + this.padding }.bind(this))
      .attr('y', function(d) { return  this.height - this.yScale(d.amp) - this.padding }.bind(this))
      .style('height', function(d) { return this.yScale(d.amp) }.bind(this));

    this.canvas
      .selectAll('rect')
      .data(values[0], keyAccesor)
      .enter()
      .append("rect")
      .attr('class', 'col')
      .style('background-color', function(d) {
        return this.colorScale(d.amp)
      }.bind(this))
      .attr('fill', function(d) { return this.colorScale( d.amp )}.bind(this))
      .attr('x', function(d) { return this.xScale( d.freq ) + this.padding }.bind(this))
      .attr('y', function(d) { return  this.height - this.yScale(d.amp) - this.padding }.bind(this))
      .style('height', function(d) { return this.yScale(d.amp) }.bind(this))
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
    body = container;
    this.canvas = body.append("svg")
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

    function addIndex(values) {
      var x, y;
      for (y = 0; y < values.length; y++) {
        for (x = 0; x < values[y][0].length; x++) {
          values[y][0][x].x = x;
          values[y][0][x].y = y;
        }
      };
    }

    function innerRender(target) {
      target
        .append("rect")
        .attr('x', function(d) { return this.xScale( d.freq ) + this.padding }.bind(this))
      // .attr('y', function(d) { return d.y * 30 }.bind(this))
        .attr('y', function(d) { var val = ( this.yScale(d.y) + this.padding ); console.log(val); return val }.bind(this))
        .style('height', function(d) { return this.height / this.windowSize }.bind(this))
        .style('width', function(d) { return 1 }.bind(this))
        .attr('fill', function(d) { return this.colorScale( d.amp ) }.bind(this))
    }

    function render(target) {
      target
      .append('rect')
      .attr('x', function(d) { return this.xScale( d.freq ) + this.padding }.bind(this))
      .attr('y', function(d) { var val = ( this.yScale(d.y) + this.padding ); return val }.bind(this))
      .style('height', function(d) { return this.height / this.windowSize }.bind(this))
      .style('width', function(d) { return 1 }.bind(this))
      .attr('fill', function(d) { return this.colorScale( d.amp ) }.bind(this))
    }

    addIndex(values);

    var group = this.container
      .selectAll("g.windowGraph.data")
      .data(values)
      .enter()
      .append("g").attr('class', 'windowGraph data');

    var nodes = group.selectAll('rect')
    .data(function(d) { return d[0] }, function(d) { return d.x + '-' + d.y });

    render.call(this, nodes);
    render.call(this, nodes.enter());

    // var updateNodes = this.container
    //   .selectAll('rect')
    //   .data(values, function())
    //     .append("rect")
    //     .attr('x', function(d) { return this.xScale( d.freq ) + this.padding }.bind(this))
    //     .attr('y', function(d) { var val = ( this.yScale(d.y) + this.padding ); console.log(val); return val }.bind(this))
    //     .style('height', function(d) { return this.height / this.windowSize }.bind(this))
    //     .style('width', function(d) { return 1 }.bind(this))
    //     .attr('fill', function(d) { return this.colorScale( d.amp ) }.bind(this))
    // .enter()
    //     .append("rect")
    //     .attr('x', function(d) { return this.xScale( d.freq ) + this.padding }.bind(this))
    //     .attr('y', function(d) { var val = ( this.yScale(d.y) + this.padding ); console.log(val); return val }.bind(this))
    //     .style('height', function(d) { return this.height / this.windowSize }.bind(this))
    //     .style('width', function(d) { return 1 }.bind(this))
    //     .attr('fill', function(d) { return this.colorScale( d.amp ) }.bind(this));
    // innerRender.call(this,
    //   updateNodes
    //   .enter()
    // );
  }
}

function setup() {
  instantGraph.setup(d3.select('body'));
  windowGraph.setup(d3.select('body'));
}

function keyAccesor(d) {
  return d.freq
}

function renderWindow(values) {
  windowGraph.render(values);
}

function renderInstant(values) {
  instantGraph.render(values);

  return values;
}

function buffer(size) {
  var buffer = [];
  return function(values) {
    buffer.push(values);
    if(buffer.length > size) {
      buffer.shift();
    }
    return buffer;
  }
}

function loop() {
  fetch('samples/ath10k_80mhz.dump.json')
    .then(checkStatus)
    .then(toJSON)
    .then(randomSelect)
    .then(formatDumpInfo)
    // .then(debugPrint)
    .then(renderInstant)
    .then(valueBuffer)
    .then(renderWindow);
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
setInterval(ifEnabled.bind(this, loop), 1000)
// loop();


