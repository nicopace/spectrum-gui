function formatDumpInfo(json) {
  return json.map(function(sample) {
    return sample.data.map(function(col) { 
      return {freq: col[0], amp: col[1]};
    })
  })
};

function randomSelect(valuesArr) {
  var choice = Math.floor(Math.random() * valuesArr.length);
  console.log(choice);
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

var instantNode;
function getInstantNode() {
  if (!instantNode) {
    instantNode = document.getElementById('instantNode');
  }
  return instantNode;
}

var body;
var canvas;
var width = 400;
var height = 500;
var padding, domain;
var yScale, xScale, colorScale;;
var xGroup, yGroup;

function setup() {
  body = d3.select("body");
  canvas = body.append("svg")
    .attr('width', width)
    .attr('height', height);
  padding = 30;
  domain = [-110, -50];

  // Amplitude
  yScale = d3.scaleLinear()
    .domain(domain)
    .range([0, height - padding * 2])
    .clamp(true);

  // Intensity(Amplitude)
  colorScale = d3.scaleLinear()
    .domain([domain[0], (domain[0] + domain[1])/2, domain[1]])
    .range(["blue", "green", "red"])

  // Frequency
  xScale = d3.scaleLinear()
    .domain([5600, 5700])
    .range([0, width - padding * 2]);

  xAxis = d3.axisBottom(xScale);
  xGroup = canvas.append('g').attr("transform", "translate("+ padding + ", " + ( height - padding ) + ")").call(xAxis);

  yAxis = d3.axisLeft(yScale);
  yGroup = canvas.append('g')
    .attr("transform", "translate(" + ( padding ) + " " + ( padding ) + ")")
    .call(yAxis)
}

function keyAccesor(d) {
  return d.freq
}

function renderInstant(values) {
  canvas
    .selectAll('rect')
    .data(values[0], keyAccesor)
    .attr('class', 'col')
    .style('background-color', function(d) {
      return colorScale(d.amp)
    })
    .attr('fill', function(d) { return colorScale( d.amp )})
    .attr('x', function(d) { return xScale( d.freq ) + padding })
    .attr('y', function(d) { return  height - yScale(d.amp) - padding })
    .style('height', function(d) { return yScale(d.amp) });

  canvas
    .selectAll('rect')
    .data(values[0], keyAccesor)
    .enter()
    .append("rect")
    .attr('class', 'col')
    .style('background-color', function(d) {
      return colorScale(d.amp)
    })
    .attr('fill', function(d) { return colorScale( d.amp )})
    .attr('x', function(d) { return xScale( d.freq ) + padding })
    .attr('y', function(d) { return  height - yScale(d.amp) - padding })
    .style('height', function(d) { return yScale(d.amp) })
}

function render(values) {
  renderInstant(values);

  return values;
}

function loop() {
  fetch('samples/ath10k_80mhz.dump.json')
    .then(checkStatus)
    .then(toJSON)
    .then(randomSelect)
    .then(formatDumpInfo)
    // .then(debugPrint)
    .then(render);
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
setInterval(ifEnabled.bind(this, loop), 1000)
// loop();


