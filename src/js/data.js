import '../css/data.scss';

import $ from 'jquery';
import Vue from 'vue';
import * as d3 from "d3";
import numeral from "numeral";
import saveSvgAsPng from "save-svg-as-png";

var data = {
  usd: ""
};

var app = new Vue({
  el: '.dataSections',
  data: data
})
