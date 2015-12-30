
function make_x_axis(x, m) {
  return d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(m);
}

function make_y_axis(y, num_fields) {
  return d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(num_fields);
}

function redraw(){
  var data = $("#textareaCode").val();
  data = d3.csv.parse(data);

  // Prepares data (left axis, right axis and values of lines)
  var left_items = [];
  var right_items = [];
  var num_fields = data.length;

  var i;
  for (i=data.length-1; i>=0; i--) {
    left_items.push(data[i].left);
    right_items.push(data[i].right);
    data[i].idx = data.length-i-1;
  }

  var reserved = ["left", "right", "color", "idx"];
  var keys_not_filtered = Object.keys(data[0]);
  var line_names = keys_not_filtered.filter(
      function (x) {return reserved.indexOf(x) < 0;});

  // Prepare min/max values to decide x domain.
  var min_value = parseFloat(data[1][line_names[0]]);
  var max_value = parseFloat(data[1][line_names[0]]);
  var j;
  for (i = 0; i < line_names.length; i++) {
    for (j = 1; j < data.length; j++) {
      var value = parseFloat(data[j][line_names[i]]);
      min_value = Math.min(min_value, value);
      max_value = Math.max(max_value, value);
    }
  }
  var middle_value = (min_value + max_value) / 2.0;

  // Margin related pixel values.
  var margin_tick = 1;
  var margin_value = 6.0;
  var side_margin_ratio = 0.05;
  var margin = {top: 30, right: 60, bottom: 30, left: 60};
  var width_ = 600 - margin.left - margin.right;
  var height_per_field = 70;
  var height_ = data.length * height_per_field - margin.top - margin.bottom;

  var x = d3.scale.linear().range([0, width_]);
  var y_left = d3.scale.linear().range([height_, 0]);
  var y_right = d3.scale.linear().range([height_, 0]);

  // A default color set.
  var color = d3.scale.category10();

  color.domain(line_names);
  var pathes = color.domain().map(function(col){
    // Selects a color from default color set.
    var path_color = color(col);
    // If the custom color set has the key for the line, overrides path_color.
    if (col in $.globalns.color)
      path_color = $.globalns.color[col];
    // Returns a set of data for each line.
    return {
      name: col,
      color: path_color,
      // Collects values of the line.
      values: data.map(function(d){
        return {value: d[col], idx: d.idx};
      })
    };
  });

  var margin_in_value = (max_value - min_value) * 2.0 * side_margin_ratio;
  x.domain([min_value - margin_in_value,
            max_value + margin_in_value]);
  y_left.domain([0-margin_tick, num_fields-1+margin_tick]);
  y_right.domain([0-margin_tick, num_fields-1+margin_tick]);

  // Removes old graph.
  d3.select("#the-chart svg g").remove();
  d3.select("#the-chart svg").remove();

  var svg = d3.select("#the-chart")
      .append("svg")
      .attr("width", width_ + margin.left + margin.right)
      .attr("height", height_ + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(margin_value)
      .tickFormat(function(d){return d;});

  var yAxisLeft = d3.svg.axis()
      .scale(y_left)
      .orient("left")
      .ticks(num_fields)
      .tickFormat(function(d){return left_items[d];});

  var yAxisRight = d3.svg.axis()
      .scale(y_right)
      .orient("right")
      .ticks(num_fields)
      .tickFormat(function(d){return right_items[d];});

  var valueline = d3.svg.line()
      .x(function(d) { return x(d.value); })
      .y(function(d) { return y_left(d.idx); });

  var path = svg.selectAll(".pathes")
          .data(pathes)
          .enter()
          .append("g")
          .attr("class", "mypath");

  // Adds path lines.
  path.append("path")
      .attr("class", "line")
      .attr("d", function(d){return valueline(d.values);})
      .style("stroke", function(d){return d.color;});

  // Adds circles on x,y points.
  path.each(function(d) {
    var path_color = d.color;
    d3.select(this).selectAll("circle")
        .data(d.values)
        .enter().append("circle")
        .attr("fill", function(d){return path_color;})
        .attr("r", 4)
        .attr("cx", function(d){return x(d.value);})
        .attr("cy", function(d){return y_left(d.idx);});
  });

  // Updates the color pick panel.
  d3.select("#color-panel")
     .selectAll("input")
     .data(pathes)
     .enter()
     .append("input")
     .attr("type", "text")
     .attr("id", function(d){return "color-for-" + d.name;})
     .attr("class", "color-picker")
     .attr("value",function(d){return d.color;})
     .style("border-right",function(d){return "20px solid " + d.color;});

  // Grid gray guidelines.
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", "translate(0," + height_ + ")")
    .call(make_x_axis(x, margin_value)
      .tickSize(-height_, 0, 0)
      .tickFormat("")
    );
  svg.append("g")
    .attr("class", "grid")
    .call(make_y_axis(y_left, num_fields)
      .tickSize(-width_, 0, 0)
      .tickFormat("")
    );

  // Adds the X Axis.
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height_ + ")")
    .call(xAxis);

  // Adds the Y Axes.
  svg.append("g")
    .attr("class", "y axis")
    .style("fill", "black")
    .call(yAxisLeft);

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width_ + " ,0)")
    .style("fill", "black")
    .call(yAxisRight);
}

function updateColor(el){
  path_name = el.id.substring("color-for-".length);
  $.globalns.color[path_name] = el.value;
  redraw();
}

function shuffleColors() {
  $(".color-picker").each(function(idx, e) {
    var new_color = 0x1000000;
    new_color += Math.floor(Math.random()*(0xff)+1);
    new_color += Math.floor(Math.random()*(0xff)+1)*0x100;
    new_color += Math.floor(Math.random()*(0xff)+1)*0x10000;
    new_color = '#' + new_color.toString(16).substr(-6);

    // Updates color indicator.
    $(this).css('border-color', new_color);
    $(this).val(new_color);

    // redraw function relies on $.globalns.color[path_name] to get colors.
    path_name = e.id.substring("color-for-".length);
    $.globalns.color[path_name] = new_color;
  });
  redraw();
}

function init(){
  // TODO: don't rely on global variables if possible.
  $.globalns = {
    color: {}
  };

  var data = "left,right,line1,line2,line3\n" +
    "Active,Passive,5.0,3.0,4.4\n"+
    "Creative,Routine,3.3,4.4,4.5\n"+
    "Positive,Negative,3.0,5.1,4.6\n"+
    "Red,Blue,3.5,4.7,4.7\n"+
    "White,Black,4.0,3.7,4.8\n";

  d3.select("#textareaCode").text(data);

  $("#the-btn").click(redraw);
  $("#shuffle-btn").click(shuffleColors);

  redraw();

  $('.color-picker').colpick({
    layout:'hex',
    submit:0,
    colorScheme:'dark',
    onChange:function(hsb,hex,rgb,el,bySetColor) {
      $(el).css('border-color','#'+hex);
      // Fill the text box just if the color was set using the picker, and not the colpickSetColor function.
      if(!bySetColor) $(el).val("#"+hex);
      updateColor(el);
    }
  }).keyup(function(){
    $(this).colpickSetColor(this.value);
  });
}

$(init);
