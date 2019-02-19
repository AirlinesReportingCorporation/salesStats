import '../css/data.scss';

import $ from 'jquery';
import Vue from 'vue';
import * as d3 from "d3";
import numeral from "numeral";
import saveSvgAsPng from "save-svg-as-png";

var jData = [];

var currentDate = "";
var currentDateID = "";

var oldestDate = "";
var oldestDateID = "";

var yoyDate = "";

var months = [];

var margin = {
    top: 20,
    right: 20,
    bottom: 150,
    left: 150
  },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

var filePath = "https://www2.arccorp.com/globalassets/forms/corpstats.csv?" + new Date().getTime();

var data = {
  usd: "",
  tot_airlines: "",
  passenger_trips: "",
  tot_emd_sales: "",
  tot_sales: "",
  avg_tkt_price: "",
  tot_agency_loc: ""
};

var app = new Vue({
  el: '.dataSections',
  data: data
})

//extract data from csv
d3.csv(filePath, function(data) {
  jData.push(data);
}).then(function() {

  //sort data by date ascending
  jData.sort(function(x, y) {
    return d3.ascending(x.DT, y.DT);
  });

  console.log(jData);

  //set current date
  currentDate = setCurrentDate();
  oldestDate = setOldestDate();

  //get index of the row for the current date
  currentDateID = setCurrentDateID();
  oldestDateID = setOldestDateID();

  //get last year dates
  yoyDate = setYoyDate();

  console.log(yoyDate);

  var n = 12;

  var domesticFareAmt = getFilteredData(n, "DOMESTIC_FARE_AMT");

  //get current carrier count, column name: CARR_CNT
  data.tot_airlines = getDataPoint(currentDate, "CARR_CNT");

  //get passenger trips, column name: ALL_TRAN_CNT
  data.passenger_trips = numeral(getDataPoint(currentDate, "ALL_TRAN_CNT")).format('0,0');

  // get emd total sales EMD_SALES_AMT
  data.tot_emd_sales = numeral(getDataPoint(currentDate, "EMD_SALES_AMT")).format('$0,0');

  // get total sales TOT_SALES_AMT
  data.tot_sales = numeral(getDataPoint(currentDate, "TOT_SALES_AMT")).format('$0,0');

  // average ticket place AVG_TKT_PRICE
  data.avg_tkt_price = numeral(getDataPoint(currentDate, "AVG_TKT_PRICE")).format('$0,0');

  // total retail agency Locations RETAIL_LOCATIONS_CNT
  data.tot_agency_loc = numeral(getDataPoint(currentDate, "RETAIL_LOCATIONS_CNT")).format('0,0');

  drawChart("#testChart", domesticFareAmt, "DT", "DOMESTIC_FARE_AMT");

  setTimeout(function() {

    var path = d3.select("#testChart").transition();
    domesticFareAmt = getFilteredData(24, "DOMESTIC_FARE_AMT");
    drawChart("#testChart", domesticFareAmt, "DT", "DOMESTIC_FARE_AMT");
    redrawChart("#testChart", domesticFareAmt, "DT", "DOMESTIC_FARE_AMT");

  }, 3000);



})

function getFilteredData(n, columnName) {
  var e = [];
  var id = parseInt(currentDateID);
  var endIndex = id - n;

  for (var i = id; i > endIndex; i--) {
    var index = jData.findIndex(function(e) {
      return e.ID == i.toString();
    });
    e.push(jData[index]);
  }

  //console.log(e);

  return e;
}

// get total carrier count COL name : CARR_CNT
function getDataPoint(date, columnName) {
  //get ID of column based on date
  var dateID = jData.findIndex(function(e) {
    return e.DT == date;
  });

  return jData[dateID][columnName];
}

function setCurrentDate() {
  return d3.max(jData, function(d, i) {
    return d.DT;
  });
}

function setCurrentDateID() {
  var currentDateID = jData.findIndex(function(e) {
    return e.DT == currentDate;
  });
  return jData[currentDateID].ID;
}

//return an array of indices of n previous months
function setOldestDate() {
  return d3.min(jData, function(d, i) {
    return d.DT;
  });
}

function setOldestDateID() {
  var OldestDateID = jData.findIndex(function(e) {
    return e.DT == oldestDate;
  });
  return jData[OldestDateID].ID;
}

function setYoyDate(){
  var curYear = currentDate.substring(0, 4);
  return currentDate.replace(curYear, curYear - 1);
}

function drawChart(selector, data, xkey, ykey) {

  var parseTime = d3.timeParse("%Y-%m-%d");

  var valueline = d3.line()
    .x(function(d) {
      return x(parseTime(d[xkey]));
    })
    .y(function(d) {
      return y(parseInt(d[ykey]));
    });

  var svg = d3.select(selector).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  x.domain(d3.extent(data, function(d) {
    return parseTime(d[xkey]);
  }));

  y.domain(d3.extent(data, function(d) {
    return parseInt(d[ykey]);
  }));


  /*
  y.domain([0, d3.max(data, function(d) {
    return parseInt(d[ykey]);
  })]);*/

  // Add the valueline path.
  svg.append("path")
    .data([data])
    .attr("class", "line")
    .attr("d", valueline);

  // add the dots with tooltips
  svg.selectAll("dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dataPoint")
    .attr("r", 5)
    .attr("cx", function(d) {

      return x(parseTime(d[xkey]));
    })
    .attr("cy", function(d) {
      return y(d[ykey]);
    })
    .on("mouseover", function(d) {
      d3.select(this).transition().attr("r", 10);
    })
    .on("mouseout", function(d) {
      d3.select(this).transition().attr("r", 5);
    });

  svg.selectAll('lines')
    .data(data)
    .enter().append("line")
    .attr("class", "vertLine")
    .attr("x2", function(d) {
      return x(parseTime(d[xkey]));
    })
    .attr("y2", function(d) {
      return y(parseInt(d[ykey])) + 10;
    })
    .attr("x1", function(d) {
      return x(parseTime(d[xkey]));
    })
    .attr("y1", height);

  // Add the X Axis
  svg.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(d3.timeMonth)
      .tickFormat(d3.timeFormat("%b")));


  var xAxis2 = d3.axisBottom(x).tickFormat(d3.timeFormat("%Y"));

  // add year x axis
  svg.append("g")
    .call(xAxis2.ticks(d3.timeYear))
    .attr("class", "xAxis xDate")
    .attr("transform", "translate(0," + parseInt(height + 40) + ")");

  // Add the Y Axis
  svg.append("g")
    .attr("class", "yAxis")
    .call(d3.axisLeft(y).tickFormat(function(d) {
      return numeral(d).format('($ 0,0[.]00 a)');

    }));
}

function redrawChart(selector, data, xkey, ykey) {

  var parseTime = d3.timeParse("%Y-%m-%d");

  var valueline = d3.line()
    .x(function(d) {
      return x(parseTime(d[xkey]));
    })
    .y(function(d) {
      return y(parseInt(d[ykey]));
    });



  var svg = d3.select(selector + " svg")
    .transition()
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  x.domain(d3.extent(data, function(d) {
    return parseTime(d[xkey]);
  }));

  var yExtent = d3.extent(data, function(d) {
    return parseInt(d[ykey]);
  })

  var yPercentage = (yExtent[1] - yExtent[0]) * 0.15;

  console.log([parseInt(yExtent[0] * 0.85), parseInt(yExtent[1] * 1.15)]);

  y.domain([parseInt(yExtent[0] * 0.85), parseInt(yExtent[1] * 1.15)]);

  svg.selectAll("circle").remove();
  d3.selectAll(".vertLine").remove();

  svg.select(".line")
    .duration(750)
    .attr("class", "line")
    .attr("d", valueline(data));

  svg.select(".xAxis") // change the x axis
    .duration(750)
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(d3.timeMonth)
      .tickFormat(d3.timeFormat("%b")));

  svg.select(".yAxis")
    .duration(750)
    .call(d3.axisLeft(y).tickFormat(function(d) {
      return numeral(d).format('($ 0,0[.]00 a)');
    }));

  d3.select(selector + " svg g").selectAll('dots')
    .data(data)
    .enter().append("circle")
    .attr("class", "dataPoint")
    .attr("r", 5)
    .attr("cx", function(d) {
      return x(parseTime(d[xkey]));
    })
    .attr("cy", function(d) {
      console.log(d[ykey]);
      return y(parseInt(d[ykey]));
    })
    .on("mouseover", function(d) {
      d3.select(this).transition().attr("r", 10);
    })
    .on("mouseout", function(d) {
      d3.select(this).transition().attr("r", 5);
    });



  d3.select(selector + " svg g").selectAll('lines')
    .data(data)
    .enter().append("line")
    .attr("class", "vertLine")
    .attr("x2", function(d) {
      return x(parseTime(d[xkey]));
    })
    .attr("y2", function(d) {
      return y(parseInt(d[ykey])) + 10;
    })
    .attr("x1", function(d) {
      return x(parseTime(d[xkey]));
    })
    .attr("y1", height);

  var xAxis2 = d3.axisBottom(x).tickFormat(d3.timeFormat("%Y"));

  // add year x axis
  svg.select(".xAxis.xDate")
    .call(xAxis2.ticks(d3.timeYear))


}
