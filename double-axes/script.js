
$(window).load(function() {
    // size and margins vary as the mode changes (desktop or mobile)
    mode = $("body").attr("mode");
    num  = $("body").attr("num"); 

    if (mode=="desktop"){
        $("body").addClass("desktop");
        var num_ticks = 6;
        var full_width = 800;
        var full_height = 600;
        var margin = {top: 30, right: 50, bottom: 40, left: 50};
    } else {
        $("body").addClass("mobile");
        var num_ticks = 3;
        var full_width = 300;
        var full_height = 280;
        var margin = {top: 20, right: 40, bottom: 30, left: 40};
    }
    var width = full_width - margin.left - margin.right;
    var height = full_height- margin.top - margin.bottom;

    // scale for x, y axes
    // set domains later with tsv data
    var x = d3.time.scale()
        .range([0, width]);
    var yTemp = d3.scale.linear()
        .range([height, 0]);
    var yHumid = d3.scale.linear()
        .range([height, 0]);

    // x axis for datetime
    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(num_ticks)
            .tickFormat(d3.time.format('%m/%d %H:%M'))
            .tickPadding(8);

    // 2 y axes for temperature and humidity, respectivelyt
    var yAxisTemp = d3.svg.axis()
        .scale(yTemp)
        .tickFormat(function(d) { return  d3.format(',f')(d) + '\u2103'})
        .orient("left");
    var yAxisHumid = d3.svg.axis()
        .scale(yHumid)
        .tickFormat(function(d) { return  d3.format(',f')(d) + '%'})
        .orient("right");

    // datetime formatter
    var iso = d3.time.format.utc("%Y-%m-%d %H:%M:%S%Z");
    var date_format= d3.time.format("%Y-%m-%d");
    var time_format= d3.time.format("%H:%M");

    var svg = d3.select("#graph").append("svg")
              .attr("preserveAspectRatio", "xMinYMin meet")
              .attr("width", full_width)
              .attr("height", full_height)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Load in data and draw line graph
    var tsv_url = "sample_data.tsv";
    d3.tsv(tsv_url, function(error, data) {
        // preprocess tsv data
        data.forEach(function(d) {
            d.timestamp = iso.parse(d.timestamp+"+0900");
            d.date = date_format(d.timestamp);
            d.time = time_format(d.timestamp);
            d.temp = parseFloat(d.temp);
            d.humid = parseFloat(d.humid);
        });

        // update current temp, humid
        $("#temp").text(data[0].temp + '\u2103');
        $("#humid").text(data[0].humid + "%");
        $("#date").text(data[0].date);
        $("#time").text(data[0].time);

        // domain for y axes
        var temp_margin = 3.0, humid_margin = 5.0;
        var temp_min    = d3.min(data, function(d){return d.temp-temp_margin;});
        var temp_max    = d3.max(data, function(d){return d.temp+temp_margin;});
        var humid_min   = d3.min(data, function(d){return d.humid-humid_margin;});
        var humid_max   = d3.max(data, function(d){return d.humid+humid_margin;});

        x.domain(d3.extent(data, function(d){return d.timestamp;}));
        yTemp.domain([temp_min, temp_max]);
        yHumid.domain([humid_min, humid_max]);

        // bind data with line
        var lineTemp = d3.svg.line()
            .interpolate("basis")
            .x(function(d) { return x(d.timestamp); })
            .y(function(d) { return yTemp(d.temp); });
    
        var lineHumid = d3.svg.line()
            .interpolate("basis")
            .x(function(d) { return x(d.timestamp); })
            .y(function(d) { return yHumid(d.humid); });

        // Draw the x axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0,"+height+")")
            .call(xAxis);
        // Draw the y axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxisTemp);
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate("+width+",0)") // right side
            .call(yAxisHumid);

        // Draw the line
        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", lineTemp);
        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .style("stroke", "steelblue")
            .attr("d", lineHumid);
    });
});
