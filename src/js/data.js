import '../css/data.scss';

import $ from 'jquery';
import Vue from 'vue';
import * as d3 from "d3";
import numeral from "numeral";
import saveSvgAsPng from "save-svg-as-png";
import Tooltip from "tooltip.js";
import "isomorphic-fetch";
import owlCarousel from 'owl.carousel';

var findIndex = require('array.prototype.findindex');

findIndex.shim(); // if you want to install it on the global environment


var monthlyData = [];
var yearlyData = [];
var posts = [];

var yearlyDataIndex = 1000;

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

var parseTime = d3.timeParse("%Y-%m-%d");

var filePath = "https://www2.arccorp.com/globalassets/forms/corpstats.csv?" + new Date().getTime();

var data = {
  usd: "",
  tot_airlines: "",
  passenger_trips: "",
  passenger_trips_year: "",
  passenger_trips_yoy: "",
  tot_emd_sales: "",
  tot_emd_sales_year: "",
  tot_emd_sales_yoy: "",
  tot_sales: "",
  tot_sales_year: "",
  tot_sales_yoy: "",
  global_segments: "",
  global_segments_year: "",
  global_segments_yoy: "",
  avg_tkt_price: 1,
  avg_tkt_price_year: "",
  avg_tkt_price_ytd: "",
  avg_tkt_price_ly: "",
  avg_tkt_price_yoy: 1,
  tot_agency_loc: ""
};

var app = new Vue({
  el: '.dataSections',
  data: data,
  computed: {
    getTicketYoy: function() {
      var avgtktprice = this.avg_tkt_price;
      var diff = parseFloat(this.avg_tkt_price_yoy) / 100 * parseFloat(String(avgtktprice).replace("$", ""));
      if (diff > 0) {
        return "<span class='positive'>+  $" + Math.floor(diff) + "</span>";
      } else {
        return "<span class='negative'>- $" + Math.floor(diff) + "</span>";
      }
    }
  },
  methods: {
    percentFormat: function(name) {
      //console.log(this[name]);
      if (this[name] > 0) {
        return "<span class='positive'>+ " + this[name] + "%</span>";
      } else {
        return "<span class='negative'>- " + this[name].replace("-", "") + "%</span>";
      }

      //return "<span>" + this[name] + "%</span>";
    }
  }
});


//extract data from csv
d3.csv(filePath, function(data) {
  if (data.ID >= yearlyDataIndex) {
    yearlyData.push(data);
  } else {
    monthlyData.push(data);
  }
}).then(function() {

  //sort data by date ascending
  monthlyData.sort(function(x, y) {
    return d3.ascending(x.DT, y.DT);
  });

  console.log(monthlyData);

  //set current date
  currentDate = setCurrentDate();

  //update currentDate to 2018 for Summary
  //remove this line for live data
  currentDate = currentDate.replace("2020", "2019");

  var lastDate = "2018-12-01"

  oldestDate = setOldestDate();

  console.log(currentDate + ":" + oldestDate);

  //get index of the row for the current date
  currentDateID = setCurrentDateID();
  oldestDateID = setOldestDateID();





  //get last year dates
  yoyDate = setYoyDate();





  var n = 12;

  var domesticFareAmt = getFilteredData(n, "DOMESTIC_FARE_AMT");



  //get current carrier count, column name: CARR_CNT
  data.tot_airlines = getDataPoint(currentDate, "CARR_CNT");

  // get total sales TOT_SALES_AMT
  data.tot_sales = numeral(getDataTotalPoint(currentDate, "TOT_SALES_AMT")).format('$0,0');
  data.tot_sales_year = currentDate.split('-')[0];
  data.tot_sales_yoy = getYoyPercentage(currentDate, "TOT_SALES_AMT", "total");

  //get global segments yearly data
  data.global_segments = numeral(getDataTotalPoint(yoyDate, "TKT_CNT")).format('0,0');
  data.global_segments_year = currentDate.split('-')[0];
  data.global_segments_yoy = getYoyPercentage(yoyDate, "TKT_CNT", "total");

  //get passenger trips, column name: ALL_TRAN_CNT
  data.passenger_trips = numeral(getDataTotalPoint(currentDate, "ALL_TRAN_CNT")).format('0,0');
  data.passenger_trips_year = currentDate.split('-')[0];
  data.passenger_trips_yoy = getYoyPercentage(currentDate, "ALL_TRAN_CNT", "total");

  // get emd total sales EMD_SALES_AMT
  data.tot_emd_sales = numeral(getDataTotalPoint(currentDate, "YTD_EMD_SALES_AMT")).format('$0,0');
  data.tot_emd_sales_year = currentDate.split('-')[0];
  data.tot_emd_sales_yoy = getYoyPercentage(currentDate, "YTD_EMD_SALES_AMT", "total");

  // average ticket place AVG_TKT_PRICE'
  data.avg_tkt_price = numeral(getDataTotalPoint(currentDate, "AVG_TKT_PRICE")).format('$0,0');
  data.avg_tkt_price_ly = numeral(getDataTotalPoint("2016-01-01", "AVG_TKT_PRICE")).format('$0');
  data.avg_tkt_price_ytd = numeral(getDataTotalPoint(yoyDate, "AVG_TKT_PRICE")).format('$0');
  data.avg_tkt_price_yoy = getYoyPercentage(currentDate, "AVG_TKT_PRICE", "total");
  data.avg_tkt_price_year = formatMonth(currentDate.split('-')[1]) + " " + currentDate.split('-')[0];

  // total retail agency Locations RETAIL_LOCATIONS_CNT
  data.tot_agency_loc = numeral(getDataPoint(lastDate, "RETAIL_LOCATIONS_CNT")).format('0,0');



  /* =============================================

    d3 chart drawing

    ==============================================
  */

  var totalSalesData = getYearsTotalData(currentDate, 7, "TOT_SALES_AMT");
  var yearGlobalSegments = getYearsTotalData(currentDate, 7, "TKT_CNT");
  var emdSalesData = getYearsTotalData(currentDate, 6, "YTD_EMD_SALES_AMT");
  var retailLocData = [{
      name: "OTAs",
      value: 4855
    },
    {
      name: "TMCs",
      value: 6714
    },
    {
      name: "Niche",
      value: 3473
    }
  ];
  //console.log(emdSalesData);

  //draw total sales bar chart
  drawBarChart("#totalSales .svgChart", totalSalesData, "DT", "TOT_SALES_AMT", "tot_sales", "tot_sales_year", "dollar");
  $("#totalSales .dataBar").last().addClass("last");

  //draw global segments
  drawLineChart("#global-segments .svgChart", yearGlobalSegments, "DT", "TKT_CNT", "global_segments", "global_segments_year", " ", "total");
  $("#global-segments .dataPoint").last().addClass("last");
  $("#global-segments .vertLine").first().addClass("first");

  //draw emd Sales
  drawBarChart("#emd-sales .svgChart", emdSalesData, "DT", "YTD_EMD_SALES_AMT", "tot_emd_sales", "tot_emd_sales_year", "dollar");
  $("#emd-sales .dataBar").last().addClass("last");

  //draw retail agency locations drawDonutChart(selector, chartdata, xkey, ykey, totalCount)
  //drawDonutChart("#data-retail .svgChart", retailLocData, "name", "value", data.tot_agency_loc);

  //init setTooltips
  setTooltips();
  initLatest();
})

function imageExists(image_url) {

  var http = new XMLHttpRequest();

  http.open('HEAD', image_url, false);
  http.send();

  return http.status != 404;

}

function setPostData(el) {
  var post = {};
  post.postTitle = el.find(".content-block--pageItem__title a").text();
  post.postTags = el.find(".content-block--pageItem__metadata li").eq(0).text().split(',');
  post.postDate = el.find(".content-block--pageItem__metadata li").eq(1).text();
  post.postBody = el.find(".content-block--pageItem__body").text();


  //getimageUrl
  var link = el.find(".content-block--pageItem__title a").prop("href");

  var subString = link.substring(link.indexOf("latest/") + 7).replace("/", "");
  if (link.indexOf("arctravelconnect") > -1) {
    subString = link.substring(link.indexOf("highlights/") + 11).replace("/", "");
  }
  var imgLink = "https://www2.arccorp.com/globalassets/homepage/redesign/latest/" + subString + ".jpg";
  var imgLinkJumbo = 'https://www2.arccorp.com/globalassets/homepage/redesign/latest/' + subString + '-jumbo.jpg';

  post.postImg = "";


  if (parseInt(post.postDate.split(",")[1]) > 2017) {
    var date = post.postDate.split(" ");

    if ((date[0] == "Jan" || date[0] == "Feb" || date[0] == "Mar" || date[0] == "Apr") && date[2] == "2018") {

    } else if (imageExists(imgLink)) {
      post.postImg = imgLink;
      post.postImgJumbo = imgLinkJumbo;
    }
  }

  post.postLink = link;

  return post;
}

//init latest data slider
function initLatest() {
  var el = $(".latest-data");

  //add to javascript object
  for (var i = 0; i < $(".content-block--pageItem").length; i++) {
    posts.push(setPostData($(".content-block--pageItem").eq(i)));
  }

  function getTemplate(post) {
    post.link = post.link + "?utm_source=our_data";

    var template = "<div class=' col-md-4'><div class='dataArticle'><div class='dataArticleImg'><a href='" + post.postLink + "'><img src='" + post.postImg +"'></a></div><div class='dataArticleTitle'><a href='" + post.postLink + "'>" + post.postTitle + "</a></div><div class='dataArticleBody'>" + post.postBody + "</div><div class='dataArticleLink'><a href='" + post.postLink + "'>Read More</a></div></div></div>";

    return template;
  }

  //append html
  for(var i = 0; i < 1; i += 1){
    $('.dataArticlesInner').append("<div class='dataArticleSection'><div class='row'>" + getTemplate(posts[i]) + getTemplate(posts[i + 1]) + getTemplate(posts[i + 2]) + "</div></div>");
  }

}

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
    title: "Electronic miscellaneous document transactions indicate sales of ancillary services (e.g., premium seats) and other miscellaneous services settled separately from the airline ticket used for travel."
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
    var index = monthlyData.findIndex(function(e) {
      return e.ID == i.toString();
    });
    e.push(monthlyData[index]);
  }

  //console.log(e);

  return e;
}

//get total carrier count COL name : CARR_CNT
function getDataPoint(date, columnName) {
  //get ID of column based on date
  var dateID = monthlyData.findIndex(function(e) {
    return e.DT == date;
  });

  return monthlyData[dateID][columnName];
}

//get year total data point
function getDataTotalPoint(date, columnName) {
  var date = date.split("-")[0] + "-01-01";
  var totalID = yearlyData.findIndex(function(e) {
    return e.DT == date;
  });

  return yearlyData[totalID][columnName];
}

//get last years data
function getYearsTotalData(startDate, n, columnName) {
  var columns = [];

  var date = startDate;
  var year = date.split("-")[0];
  var month = "01";
  var day = "01";

  //add preceding years including itself
  for (var i = 0; i < n; i++) {
    date = (parseInt(year) - i) + '-' + month + '-' + day;
    //console.log(date);
    var dataPoint = getDataTotalPoint(date, columnName);

    var dataArray = {
      DT: date
    };
    dataArray[columnName] = Math.floor(dataPoint);

    columns.push(dataArray);
  }

  return columns.reverse();
}

//set most current date from csv
function setCurrentDate() {
  return d3.max(monthlyData, function(d, i) {
    return d.DT;
  });
}

//get id from currnet data
function setCurrentDateID() {
  var currentDateID = monthlyData.findIndex(function(e) {
    return e.DT == currentDate;
  });
  return monthlyData[currentDateID].ID;
}

//return an array of indices of n previous months
function setOldestDate() {
  return d3.min(monthlyData, function(d, i) {
    return d.DT;
  });
}

//get id of oldest date
function setOldestDateID() {
  var OldestDateID = monthlyData.findIndex(function(e) {
    return e.DT == oldestDate;
  });
  return monthlyData[OldestDateID].ID;
}

//get previous year from current date
function setYoyDate() {
  var curYear = currentDate.substring(0, 4);
  return currentDate.replace(curYear, curYear - 1);
}

function getYoyPercentage(startDate, columnName, type) {
  var percentage = 0;

  var curYear = startDate.substring(0, 4);
  var prevDate = startDate.replace(curYear, curYear - 1);

  var curVal = getDataPoint(startDate, columnName);
  var lastVal = getDataPoint(prevDate, columnName);

  if (type === "total") {
    curVal = getDataTotalPoint(startDate, columnName);
    lastVal = getDataTotalPoint(prevDate, columnName);
  }


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

  var svg = d3.select(selector).append("svg")
    .attr("class", "barChart")
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

      key = key.split('-')[0];

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

      key = key.split('-')[0];

      data[dataAttr] = val;
      data[dataAttr2] = key;
    });

  // add the x axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // add the y Axis
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

}

function drawLineChart(selector, chartdata, xkey, ykey, dataAttr, dataAttr2, format, timeType) {
  var margin = {
      top: 15,
      right: 35,
      bottom: 10,
      left: 35
    },
    width = 260 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

  var x = d3.scaleTime().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);

  x.domain(d3.extent(chartdata, function(d) {
    return parseTime(d[xkey]);
  }));

  y.domain(d3.extent(chartdata, function(d) {
    return parseInt(d[ykey]);
  }));

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

  // Add the valueline path.
  svg.append("path")
    .datum(chartdata)
    .attr("class", "line")
    .attr("d", valueline);

  // add the dots with tooltips
  svg.selectAll("dot")
    .data(chartdata)
    .enter().append("circle")
    .attr("class", "dataPoint")
    .attr("r", 4.5)
    .attr("cx", function(d) {

      return x(parseTime(d[xkey]));
    })
    .attr("cy", function(d) {
      return y(d[ykey]);
    })
    .on("mouseover", function(d) {
      var key = d[xkey];
      var val = d[ykey];
      if (format === "dollar") {
        val = numeral(val).format("$0,0");
      } else {
        val = numeral(val).format("0,0");
      }

      if (timeType === "total") {
        key = key.split('-')[0];
      } else {
        key = key.split('-')[0];
      }

      data[dataAttr] = val;
      data[dataAttr2] = key;
      d3.select(this).transition().attr("r", 7);
    })
    .on("mouseout", function(d) {
      var key = chartdata[chartdata.length - 1][xkey];
      var val = chartdata[chartdata.length - 1][ykey];

      if (format === "dollar") {
        val = numeral(val).format("$0,0");
      } else {
        val = numeral(val).format("0,0");
      }

      if (timeType === "total") {
        key = key.split('-')[0];
      } else {
        key = formatMonth(key.split('-')[1]) + " " + key.split('-')[0];
      }

      data[dataAttr] = val;
      data[dataAttr2] = key;
      d3.select(this).transition().attr("r", 4.5);
    });

  svg.selectAll('lines')
    .data(chartdata)
    .enter().append("line")
    .attr("class", "vertLine")
    .attr("x2", function(d) {
      return x(parseTime(d[xkey]));
    })
    .attr("y2", function(d) {
      return y(parseInt(d[ykey])) + 9;
    })
    .attr("x1", function(d) {
      return x(parseTime(d[xkey]));
    })
    .attr("y1", height + 10);

  svg.append("line")
    .attr("class", "vertLine")
    .attr("x2", width + 5)
    .attr("y2", height + 9)
    .attr("x1", -5)
    .attr("y1", height + 9)
    .attr("style", "stroke-width: 2px");


  // Add the X Axis
  svg.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(d3.timeMonth)
      .tickFormat(d3.timeFormat("%b")));

  // Add the Y Axis
  svg.append("g")
    .attr("class", "yAxis")
    .call(d3.axisLeft(y).tickFormat(function(d) {
      return numeral(d).format('($ 0,0[.]00 a)');

    }));

}

function drawDonutChart(selector, chartdata, xkey, ykey, totalCount) {

  var colors = ["#129bb2", "#c5b593", "#dd7b31"];

  var margin = {
      top: 5,
      right: 0,
      bottom: 5,
      left: 0
    },
    width = 260 - margin.left - margin.right,
    height = 260 - margin.top - margin.bottom,
    radius = Math.min(width - 80, height) / 2;

  //console.log(radius);

  var arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(Math.floor((width - 80) / 2.0));

  var pie = d3.pie()
    .sort(null)
    .value(function(d) {
      return d[ykey];
    });

  var svg = d3.select(selector).append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  svg.append("line")
    .attr("class", "vertLine")
    .attr("x1", 0)
    .attr("y1", radius * -2)
    .attr("x2", 0)
    .attr("y2", radius * 2);

  svg.append("line")
    .attr("class", "vertLine")
    .attr("x1", radius * -2)
    .attr("y1", 0)
    .attr("x2", radius * 2)
    .attr("y2", 0);

  var g = svg.selectAll(".arc")
    .data(pie(chartdata))
    .enter().append("g");

  //add donut paths
  g.append("path")
    .attr("d", arc)
    .style("fill", function(d, i) {
      if ((i + 1) > 3) {
        i = Math.floor((i / 3.0) - 1);
      }
      return colors[i];
    });



  //add totalCount to center of the donut chart
  g.append("text")
    .attr("text-anchor", "middle")
    .attr('y', 10)
    .attr('fill', '#ffffff')
    .attr('class', 'mainStat')
    .attr('shape-rendering', 'crispEdges')
    .text(totalCount);


}
