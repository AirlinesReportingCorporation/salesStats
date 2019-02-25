import '../css/data.scss';

import $ from 'jquery';
import Vue from 'vue';
import * as d3 from "d3";
import numeral from "numeral";
import saveSvgAsPng from "save-svg-as-png";
import Tooltip from "tooltip.js";

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
  tot_sales_year: "",
  tot_sales_yoy: "",
  global_segments: "",
  global_segments_yoy: "",
  avg_tkt_price: "",
  tot_agency_loc: ""
};

var app = new Vue({
  el: '.dataSections',
  data: data,
  computed: {
    tot_sales_yoy_percent: function() {
      if (this.tot_sales_yoy > 0) {
        return "<span class='positive'>+ " + this.tot_sales_yoy + "%</span>";
      } else {
        return "<span class='negative'>- " + this.tot_sales_yoy + "%</span>";
      }

      return "<span>" + this.tot_sales_yoy + "%</span>";

    }
  }
})

//set tooltips
function setTooltips() {
  new Tooltip($("#totalSales .dataTooltip"), {
    placement: 'top', // or bottom, left, right, and variations
    title: "Total amount (in USD) processed by ARC for air travel transactions including all fares, fees, and taxes across all forms of payment and all transaction types."
  });

  new Tooltip($("#global-segments .dataTooltip"), {
    placement: 'top', // or bottom, left, right, and variations
    title: "Total number of flight segments added to ARC’s global air travel database."
  });

  new Tooltip($("#passenger-trips .dataTooltip"), {
    placement: 'top', // or bottom, left, right, and variations
    title: "Total number of passengers taking a trip from one airport to another using either direct or connecting flights. "
  });

  new Tooltip($("#emd-sales .dataTooltip"), {
    placement: 'top', // or bottom, left, right, and variations
    title: "Electronic miscellaneous document transactions indicate sales of ancillary services (e.g. premium seats) and other miscellaneous services settled separately from the airline ticket used for travel."
  });

  new Tooltip($("#data-airlines .dataTooltip"), {
    placement: 'top', // or bottom, left, right, and variations
    title: "Total ARC-participating airlines as of the end of the most recent calendar month."
  });

  new Tooltip($("#data-commissions .dataTooltip"), {
    placement: 'top', // or bottom, left, right, and variations
    title: "Total YTD agent commissions processed through ARC.  "
  });

  new Tooltip($("#data-average-ticket-price .dataTooltip"), {
    placement: 'top', // or bottom, left, right, and variations
    title: "Average ticket price (in USD) for a round-trip ticket settled through ARC for an itinerary that included only U.S. domestic travel."
  });

  new Tooltip($("#data-retail .dataTooltip"), {
    placement: 'top', // or bottom, left, right, and variations
    title: "Total number of ARC-accredited travel agency locations as of the end of the most recent calendar month. "
  });


}

setTooltips();

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
  console.log(currentDate);
  data.tot_sales_year = formatMonth(currentDate.split('-')[1]) + " " + currentDate.split('-')[0];
  data.tot_sales_yoy = getYoyPercentage(currentDate, "TOT_SALES_AMT");

  //data.global_segments = 

  // average ticket place AVG_TKT_PRICE
  data.avg_tkt_price = numeral(getDataPoint(currentDate, "AVG_TKT_PRICE")).format('$0,0');

  // total retail agency Locations RETAIL_LOCATIONS_CNT
  data.tot_agency_loc = numeral(getDataPoint(currentDate, "RETAIL_LOCATIONS_CNT")).format('0,0');

  drawChart("#testChart", domesticFareAmt, "DT", "DOMESTIC_FARE_AMT");

  //drawChart("#totalSales", );

  var totalSalesData = getYearsData(currentDate, 7, "TOT_SALES_AMT");

  console.log(totalSalesData);

  //draw total sales bar chart
  drawBarChart("#totalSales .svgChart", totalSalesData, "DT", "TOT_SALES_AMT", "tot_sales", "tot_sales_year", "dollar");
  $("#totalSales .dataBar").last().addClass("last");

  setTimeout(function() {

    var path = d3.select("#testChart").transition();
    domesticFareAmt = getFilteredData(24, "DOMESTIC_FARE_AMT");
    drawChart("#testChart", domesticFareAmt, "DT", "DOMESTIC_FARE_AMT");
    redrawChart("#testChart", domesticFareAmt, "DT", "DOMESTIC_FARE_AMT");

  }, 3000);



})

function formatMonth(n) {
  n = parseInt(n);

  switch (n) {
    case 1:
      return "Jan";
      break;
    case 2:
      return "Feb";
    case 3:
      return "March";
      break;
    case 4:
      return "Apr";
      break;
    case 5:
      return "May";
      break;
    case 6:
      return "Jun";
      break;
    case 7:
      return "Jul";
      break;
    case 8:
      return "Aug";
      break;
    case 9:
      return "Sep";
      break;
    case 10:
      return "Oct";
      break;
    case 11:
      return "Nov";
      break;
    case 12:
      return "Dec";
      break;
    default:
      break;
  }

  return false;
}

//get last n years from a start date
function getYearsData(startDate, n, columnName) {
  var columns = [];

  var date = startDate;
  var year = date.split("-")[0];
  var month = date.split("-")[1];
  var day = date.split("-")[2];



  //add preceding years including itself
  for (var i = 0; i < n; i++) {
    console.log(date);
    date = (parseInt(year) - i) + '-' + month + '-' + day;
    //console.log(date);
    var dataPoint = getDataPoint(date, columnName);

    var dataArray = {
      DT: date
    };
    dataArray[columnName] = Math.floor(dataPoint);

    columns.push(dataArray);
  }

  return columns.reverse();
}

//filteredData
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

//set most current date from csv
function setCurrentDate() {
  return d3.max(jData, function(d, i) {
    return d.DT;
  });
}

//get id from currnet data
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

//get id of oldest date
function setOldestDateID() {
  var OldestDateID = jData.findIndex(function(e) {
    return e.DT == oldestDate;
  });
  return jData[OldestDateID].ID;
}

//get previous year from current date
function setYoyDate() {
  var curYear = currentDate.substring(0, 4);
  return currentDate.replace(curYear, curYear - 1);
}

function getYoyPercentage(startDate, columnName) {
  var percentage = 0;

  var curVal = getDataPoint(startDate, columnName);
  var lastVal = getDataPoint(yoyDate, columnName);

  percentage = parseFloat((curVal - lastVal) / curVal) * 100.0;

  return numeral(percentage).format('0[.]00');
}

function drawBarChart(selector, chartdata, xkey, ykey, dataAttr, dataAttr2, format) {

  var margin = {
      top: 5,
      right: 5,
      bottom: 5,
      left: 5
    },
    width = 260 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

  var parseTime = d3.timeParse("%Y-%m-%d");


  var svg = d3.select(selector).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  x = d3.scaleBand()
    .range([margin.left, width - margin.right])
    .padding(0.5)
    .paddingOuter(0.4)

  y = d3.scaleLinear()
    .range([height - margin.bottom, margin.top])

  x.domain(chartdata.map(function(d) {
    return d[xkey];
  }));
  y.domain([0, d3.max(chartdata, function(d) {
    return d[ykey];
  })]);

  svg.selectAll("bar")
    .data(chartdata)
    .enter()
    .append('rect')
    .attr('class', 'dataBar')
    .attr('x', (d) => x(d[xkey]))
    .attr('width', x.bandwidth())
    .attr('y', (d) => y(d[ykey]))
    .attr('height', (d) => height - y(d[ykey]))
    .on("mouseover", function(d) {
      var key = d[xkey];
      var val = d[ykey];
      if (format === "dollar") {
        val = numeral(val).format("$0,0");
      } else {
        val = numeral(val).format("0,0");
      }

      key = formatMonth(key.split('-')[1]) + " " + key.split('-')[0];

      data[dataAttr] = val;
      data[dataAttr2] = key;
    })
    .on("mouseout", function(d) {
      var key = chartdata[chartdata.length - 1][xkey];
      var val = chartdata[chartdata.length - 1][ykey];

      if (format === "dollar") {
        val = numeral(val).format("$0,0");
      } else {
        val = numeral(val).format("0,0");
      }

      key = formatMonth(key.split('-')[1]) + " " + key.split('-')[0];

      data[dataAttr] = val;
      data[dataAttr2] = key;
    });


  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // add the y Axis
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

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

  //console.log([parseInt(yExtent[0] * 0.85), parseInt(yExtent[1] * 1.15)]);

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
