/*
Program       esci-correlation.js
Author        Gordon Moore
Date          20 August 2020
Description   The JavaScript code for esci-correlation
Licence       GNU General Public Licence Version 3, 29 June 2007
*/

// #region Version history
/*
0.0.1   Initial version
0.0.2 2020-08-26 #2 Appearance jigs
0.0.3 2020-08-26 #1 Basic correlation. Not all flags implemented yet.
0.0.4 2020-08-28 #1 Mostly implemented, waitimg for inevitable tweaks :)
0.0.5 2020-08-28 #1 Fixed display of r bug
0.0.6 2020-08-30 #1 All sorts of fixes and checking.
0.0.7 2020-08-31 #1 Fix bounding on correlation line
0.0.8 2020-09-01 #6 First attempt at forcing correlation to match target correlation
0.0.9 2020-09-02 #5 Changed colours for labels in Display Lines  #8 added test data and import.


*/
//#endregion 

let version = '0.0.9';

'use strict';
$(function() {
  console.log('jQuery here!');  //just to make sure everything is working

  //#region for variable definitions (just allows code folding)
  let tooltipson              = false;                                        //toggle the tooltips on or off

  let margin;     //margins for pdf display area

  let widthD;                                                                //the true width of the pdf display area in pixels
  let heightD;   

  let rwidth;                                                                 //the width returned by resize
  let rheight;                                                                //the height returned by resize

  let pauseId;
  let repeatId;
  let delay = 50;
  let pause = 500;

  let sliderinuse = false;

  //tab 1 panel 1 N1
  let $N1slider;
  let N1 = 4;
  const $N1val = $('#N1val');
  $N1val.val(N1.toFixed(0));
  const $N1nudgebackward = $('#N1nudgebackward');
  const $N1nudgeforward = $('#N1nudgeforward');

  //tab 1 panel 2 r
  let $rslider;

  let rs = 0.5;                                                 //r slider
  let r = 0.5;                                                  //calculated r

  const $rval = $('#rval');
  $rval.val(r.toFixed(2).toString().replace('0.', '.'));

  const $calculatedr = $('#calculatedr');

  const $rnudgebackward = $('#rnudgebackward');
  const $rnudgeforward = $('#rnudgeforward');

  //tab 1 panel 3 New data set
  const $newdataset = $('#newdataset');
  
  //tab 1 panel 4 Display features
  const $displayr = $('#displayr');
  let displayr = false;

  const $displayctm = $('#displayctm');
  let displayctm = false;

  const $displaymd = $('#displaymd');
  let displaymd = false;

  //tab 1 panel 5 Descriptive statstics
  const $statistics1 = $('#statistics1');
  const $statistics1show = $('#statistics1show');
  let statistics1show = false;

  
  //tab 1 panel 6 Display lines
  const $displaylines1 = $('#displaylines1');
  const $displaylines1show = $('#displaylines1show');
  let displaylines1show = false;

  const $corryx = $('#corryx');
  let corryx = false;

  const $corryxval = $('#corryxval');
  let corryxval;
  
  const $corrxy = $('#corrxy');
  let corrxy = false;

  const $corrxyval = $('#corrxyval');
  let corrxyval;

  const $corrlineslope = $('#corrlineslope');
  let corrlineslope = false;

  const $corrlineslopeval = $('#corrlineslopeval');
  let corrlineslopeval;

  const $confidenceellipsediv = $('#confidenceellipsediv');

  const $confidenceellipse = $('#confidenceellipse');
  confidenceellipse = false;

  let svgD;                                                                           //the svg reference to pdfdisplay
  const $display            = $('#display');

  //different representation of the scatters (some for future usage)
  let scatters = [];
  let xscatters = [];
  let yscatters = [];
  let scattersarray = []

  let xs;
  let ys;

  let i;

  let Mx = 0;
  let My = 0;
  let Sx = 0;
  let Sy = 0;

  let Sxx;
  let Sxy;
  let Syx;
  let Syy;

  let Cxx;
  let Cxy;
  let Cyx;
  let Cyy;
  let Cm;

  //y on x
  let betayonx = 0;
  let alphayonx = 0;
  let yvalueyxA = 0;
  let yvalueyxB = 0;

  //x on y
  let betaxony = 0;
  let alphaxony = 0;
  let xvaluexyA = 0;
  let xvaluexyB = 0;

  //confidence line
  let betacl = 0;
  let alphacl = 0;
  let yvaluecl1 = 0;
  let yvaluecl2 = 0;

  let angle = 0;

  const $m1 = $('#m1');
  const $m2 = $('#m2');
  const $s1 = $('#s1');
  const $s2 = $('#s2');

  /*-----------------load data--------------------*/

  const $testdiv = $('#testdiv');
  let testdiv = false;

  const $test = $('#test');
  let test = false;

  $loadtestdatapanel = $('#loadtestdatapanel');

  let testdata = false;

  const $loaddata = $('#loaddata ');
  const $cleardata = $('#cleardata');
  const $cleardatayes = $('#cleardatayes');
  const $cleardatano = $('#cleardatano');

  const $datasetdiv = $('#datasetdiv');

  let loaddata = true;

  //#endregion

  //breadcrumbs
  $('#homecrumb').on('click', function() {
    window.location.href = "https://www.esci.thenewstatistics.com/";
  })

  initialise();

  function initialise() {
    
    //TEST info panel
    $('#displayinfopaneldiv').hide();
    $('#confidenceellipsediv').hide();
    confidenceellipse = false;

    //Test data 
    $loadtestdatapanel.hide();
    $cleardatayes.hide();
    $cleardatano.hide();

    $datasetdiv.hide();

    $('#cleardata').hide();
    loadTestData();

    $('#group1label').val('X');
    $('#group2label').val('Y');    

    $confidenceellipsediv.show();


    //get initial dimensions of #display div
    margin = {top: 30, right: 50, bottom: 20, left: 50}; 

    rheight = $('#main').outerHeight(true);
    rwidth  = $('#main').outerWidth(true)  - $('#leftpanel').outerWidth(true); 

    setDisplaySize();
    setupAxes();

    setTooltips();

    setupSliders(); 

    //calls setupdisplay setupaxes again!
    clear();

    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  }

 
  function setupSliders() {

    $('#N1slider').ionRangeSlider({
      skin: 'big',
      grid: true,
      grid_num: 6,
      type: 'single',
      min: 0,
      max: 300,
      from: 4,
      step: 1,
      prettify: prettify0,
      //on slider handles change
      onChange: function (data) {
        N1 = data.from;
        if (N1 < 4) N1 = 4;
        sliderinuse = true;  //don't update dslider in updateN1()
        updateN1();  //create scatter and update to
        $N1val.val(N1.toFixed(0));

        createScatters();
        drawScatterGraph();
        statistics();
        displayStatistics();
      },
      onFinish: function(data) {
        updateN1();
      }
    })
    $N1slider = $('#N1slider').data("ionRangeSlider");

    $('#rslider').ionRangeSlider({
      skin: 'big',
      grid: true,
      grid_num: 4,
      type: 'single',
      min: -1,
      max: 1,
      from: 0.5,
      step: 0.01,
      prettify: prettify2,
      //on slider handles change
      onChange: function (data) {
        rs = data.from;
        sliderinuse = true;  //don't update dslider in updater()
        updater();
        $rval.val(rs.toFixed(2).toString().replace('0.', '.'));
        $calculatedr.text(r.toFixed(2).toString().replace('0.', '.'))

        createScatters();
        drawScatterGraph();
        statistics();
        displayStatistics();
      }
    })
    $rslider = $('#rslider').data("ionRangeSlider");

    function prettify0(n) {
      return n.toFixed(0);
    }
  
    function prettify1(n) {
      return n.toFixed(1).toString().replace('0.', '.');
    }
  
    function prettify2(n) {
      return n.toFixed(2).toString().replace('0.', '.');
    }
  
  }

  function updateN1() {
    if (!sliderinuse) $N1slider.update({ from: N1 })
    sliderinuse = false;
  }

  function updater() {
    if (!sliderinuse) $rslider.update({ from: rs })
    sliderinuse = false;
  }


  //set everything to a default state.
  function clear() {
    //set sliders to initial
    N1 = 4;
    updateN1();
    $N1val.text(N1.toFixed(0));

    rs = 0.5;
    r  = 0.5;
    updater();
    $rval.text(rs.toFixed(2).toString().replace('0.', '.'));    
    $calculatedr.text(r.toFixed(2).toString().replace('0.', '.')); 

    $statistics1.hide();
    $displaylines1.hide();

    setDisplaySize();
    setupAxes();
  }

  function resize() {
    setDisplaySize();
    setupAxes();

    //don't recreate scatters here
    drawScatterGraph();
    statistics();
    displayStatistics();
  }

  function setDisplaySize() {

    d3.selectAll('svg > *').remove();  //remove all elements under svgP
    $('svg').remove();  

    rheight = $('#main').outerHeight(true);
    rwidth  = $('#main').outerWidth(true)  - $('#leftpanel').outerWidth(true);

    widthD   = rwidth - margin.left - margin.right;  
    heightD  = rheight - margin.top - margin.bottom;

    //try to keep grid square
    if (widthD > heightD) widthD = heightD;
    else 
    if (widthD < heightD) heightD = widthD;

  
    //change #display
    $display.css('width', widthD);
    $display.css('height', heightD);

    svgD = d3.select('#display').append('svg').attr('width', '100%').attr('height', '100%');

  }

  function setupAxes() {
    //clear axes
    d3.selectAll('.xaxis').remove();
    d3.selectAll('.yaxis').remove();
    d3.selectAll('.axistext').remove();

    x = d3.scaleLinear().domain([-3, 3]).range([margin.left+20, widthD-margin.left]);
    y = d3.scaleLinear().domain([-3, 3]).range([heightD-70, 50]);

    let xAxis = d3.axisBottom(x).tickPadding([10]).ticks(7).tickFormat(d3.format('')); //.ticks(20); //.tickValues([]);
    svgD.append('g').attr('class', 'xaxis').style("font", "1.5rem sans-serif").style('padding-top', '0.5rem').attr( 'transform', `translate(0, ${heightD-70})` ).call(xAxis);

    let yAxis = d3.axisLeft(y).tickPadding([10]).ticks(7).tickFormat(d3.format('')); //.ticks(20); //.tickValues([]);
    svgD.append('g').attr('class', 'yaxis').style("font", "1.5rem sans-serif").attr( 'transform', `translate(${margin.left+20}, 0)` ).call(yAxis);


    //add some axis labels
    svgD.append('text').text('X').attr('class', 'axistext').attr('x', x(0.1)).attr('y', y(-3)+45).attr('text-anchor', 'start').attr('fill', 'black').style('font-size', '2.0rem').style('font-weight', 'bold').style('font-style', 'italic');
    svgD.append('text').text('Y').attr('class', 'axistext').attr('x', x(-3)-60).attr('y', y(0)).attr('text-anchor', 'start').attr('fill', 'black').style('font-size', '2.0rem').style('font-weight', 'bold').style('font-style', 'italic');

    //add additional ticks for x scale
    //the minor ticks
    let interval = d3.ticks(-3, 3, 10);  //gets an array of where it is putting tick marks

    let i;
    let minortick;
    let minortickmark;

    //haf way ticks
    for (i=1; i < interval.length; i += 1) {
      minortick = (interval[i] - interval[i-1]);
      for (let ticks = 1; ticks <= 10; ticks += 1) {
        minortickmark = interval[i-1] + (minortick * ticks);
        if (minortickmark > -3 && minortickmark < 3) svgD.append('line').attr('class', 'xaxis').attr('x1', x(minortickmark)).attr('y1', 0).attr('x2', x(minortickmark) ).attr('y2', 10).attr('stroke', 'black').attr('stroke-width', 1).attr( 'transform', `translate(0, ${heightD})` );
        if (minortickmark > -3 && minortickmark < 3) svgD.append('line').attr('class', 'yaxis').attr('x1', 0).attr('y1', y(minortickmark)).attr('x2', 10 ).attr('y2', y(minortickmark)).attr('stroke', 'black').attr('stroke-width', 1).attr( 'transform', `translate(0, ${heightD})` );

      }
    }

    //minor ticks
    // for (i=1; i < interval.length; i += 1) {
    //   minortick = (interval[i] - interval[i-1]) / 10;
    //   for (let ticks = 1; ticks <= 10; ticks += 1) {
    //     minortickmark = interval[i-1] + (minortick * ticks);
    //     if (minortickmark > -3 && minortickmark < 3) {
    //          svgD.append('line').attr('class', 'xaxis').attr('x1', x(minortickmark)).attr('y1', 0).attr('x2', x(minortickmark) ).attr('y2', 5).attr('stroke', 'black').attr('stroke-width', 1).attr( 'transform', `translate(0, ${heightD})` );
    //          svgD.append('line').attr('class', 'yaxis').attr('x1', 0).attr('y1', y(minortickmark)).attr('x2', 5 ).attr('y2', y(minortickmark)).attr('stroke', 'black').attr('stroke-width', 1).attr( 'transform', `translate(0, ${heightD})` );
    //      }
    //   }
    // }

  }


  function createScatters() {

    let iterateR = true;
    let previousr = 0;
    let T = 1;
    let Tinc = 1;    
    let diff;

    scatters      = [];
    xscatters     = [];
    yscatters     = [];
    scattersarray = [];

    let xsa = [];
    let ysa = [];

    if (!test) {
      for (i = 0; i < N1; i += 1) {
        xs = jStat.normal.sample( 0, 1 );
        ys = jStat.normal.sample( 0, 1 );
        xscatters.push(xs);
        yscatters.push(ys);
      }

      r = jStat.corrcoeff( xscatters, yscatters );

      if (rs > -1 && rs < 1 ) {

        olddiff = (rs + 1) - (r + 1);
        let min = 99;
        let minT = 99;
        //need to iterate to get closest r to rs
        for (T =- 10; T < 10; T += 0.01) {
          ysa = [];
          //try for given value of T
          for (i = 0; i < N1; i += 1) {
            ysa[i] = (rs * xscatters[i] * T) + (Math.sqrt(1 - rs*rs) * yscatters[i]);
          }
          
          r = jStat.corrcoeff( xscatters, ysa );  
          diff = (rs + 1) - (r + 1);   //keep rs r positive

          //lg('T = ' + T.toFixed(4) + '    Diff = ' + diff.toFixed(4));
          if (min > Math.abs(diff)) {
            min = Math.abs(diff);
            minT = T;
          }
        }
      
        //lg('Minimum = ' + min.toFixed(4) + ' Minimum T = ' + minT);

        scatters = []
        for (i = 0; i < N1; i += 1) {
          xs = xscatters[i]
          ys = (rs * xscatters[i] * minT) + (Math.sqrt(1 - rs*rs) * yscatters[i]);
          scatters.push( {x: xs, y: ys} );
        }
        yscatters = scatters.map(function (obj) { return obj.y; });

      }
      else {
        scatters = [];
        for (i = 0; i < N1; i += 1) { 
          ysa = (rs * xscatters[i] * 1) + (Math.sqrt(1 - rs*rs) * yscatters[i]);
          scatters.push( {x: xscatters[i], y: ysa} )
        }
        xscatters = scatters.map(function (obj) { return obj.x; });
        yscatters = scatters.map(function (obj) { return obj.y; });
      }

    }
    else {  //use test data
      //cycle trhough the displayed data and load it into scatters
      let datadivsx = $('.dataitems1');
      let datadivsy = $('.dataitems2');
      
      for (i = 0; i < datadivsx.length; i += 1) {
        scatters.push({ x: parseFloat(datadivsx[i].value), y: parseFloat(datadivsy[i].value) })
      }

      xscatters = scatters.map(function (obj) { return obj.x; });
      yscatters = scatters.map(function (obj) { return obj.y; });

    }
  }

  function drawScatterGraph() {
    d3.selectAll('.scatters').remove();
    d3.selectAll('.rtext').remove();
    d3.selectAll('.ctm').remove();
    d3.selectAll('.regression').remove();
    d3.selectAll('.marginals').remove();
    d3.selectAll('.confidenceellipse').remove();

    //display scatters
    for (i = 0; i < scatters.length; i += 1) {
      if      (scatters[i].x < -3)  svgD.append('circle').attr('class', 'scatters').attr('cx', x(-3.05)).attr('cy', y(scatters[i].y)).attr('r', '3').attr('stroke', 'red').attr('stroke-width', 2).attr('fill', 'red');      
      else if (scatters[i].x > 3)   svgD.append('circle').attr('class', 'scatters').attr('cx', x(3.05)).attr('cy', y(scatters[i].y)).attr('r', '3').attr('stroke', 'red').attr('stroke-width', 2).attr('fill', 'red'); 
      else if (scatters[i].y < -3)  svgD.append('circle').attr('class', 'scatters').attr('cx', x(scatters[i].x)).attr('cy', y(-3.05)).attr('r', '3').attr('stroke', 'red').attr('stroke-width', 2).attr('fill', 'red'); 
      else if (scatters[i].y > 3)   svgD.append('circle').attr('class', 'scatters').attr('cx', x(scatters[i].x)).attr('cy', y(3.05)).attr('r', '3').attr('stroke', 'red').attr('stroke-width', 2).attr('fill', 'red'); 
      else  /*normal*/              svgD.append('circle').attr('class', 'scatters').attr('cx', x(scatters[i].x)).attr('cy', y(scatters[i].y)).attr('r', '3').attr('stroke', 'blue').attr('stroke-width', 2).attr('fill', 'blue');
    }

    //display marginals
    if (displaymd) {
      for (i = 0; i < scatters.length; i += 1) {
        if      (scatters[i].y < -3) svgD.append('circle').attr('class', 'scatters').attr('cx', x(-2.95)).attr('cy', y(-3.05)).attr('r', '3').attr('stroke', 'black').attr('stroke-width', 1).attr('fill', 'black');
        else if (scatters[i].y > 3)  svgD.append('circle').attr('class', 'scatters').attr('cx', x(-2.95)).attr('cy', y(3.05)).attr('r', '3').attr('stroke', 'black').attr('stroke-width', 1).attr('fill', 'black');
        else                         svgD.append('circle').attr('class', 'scatters').attr('cx', x(-2.95)).attr('cy', y(scatters[i].y)).attr('r', '3').attr('stroke', 'black').attr('stroke-width', 1).attr('fill', 'none');
 
        if      (scatters[i].x < -3) svgD.append('circle').attr('class', 'scatters').attr('cx', x(-3.05)).attr('cy', y(-2.95)).attr('r', '3').attr('stroke', 'black').attr('stroke-width', 1).attr('fill', 'black');
        else if (scatters[i].x > 3)  svgD.append('circle').attr('class', 'scatters').attr('cx', x(3.05)).attr('cy', y(-2.95)).attr('r', '3').attr('stroke', 'black').attr('stroke-width', 1).attr('fill', 'black');
        else                         svgD.append('circle').attr('class', 'scatters').attr('cx', x(scatters[i].x)).attr('cy', y(-2.95)).attr('r', '3').attr('stroke', 'black').attr('stroke-width', 1).attr('fill', 'none');
      }
    }
  }

  function statistics() {

    Mx = jStat.mean(xscatters);
    Sx = jStat.stdev(xscatters, true);  

    My = jStat.mean(yscatters)
    Sy = jStat.stdev(yscatters, true)

    r = jStat.corrcoeff( xscatters, yscatters )

    //get Sxy, Sxx, Syy
    Sxx = 0;
    Syy = 0;
    Sxy = 0;
    Syx = 0;

    for (let i = 0; i < scatters.length; i += 1) {
      Sxy += (scatters[i].x - Mx) * (scatters[i].y - My);
      Sxx += (scatters[i].x - Mx) * (scatters[i].x - Mx);
      Syy += (scatters[i].y - My) * (scatters[i].y - My);
    }
    Syx = Sxy;
    
    //covariance matrix Cm - [Cxx Cxy]        //if needed
    //                       [Cyx Cyy]    
    Cxx = jStat.covariance(xscatters, xscatters);  //this is the xsd^2, that is the variance of x
    Cxy = jStat.covariance(xscatters, yscatters);
    Cyx = jStat.covariance(yscatters, xscatters);  //same as Cxy really
    Cyy = jStat.covariance(yscatters, yscatters);  //ths is the ysd^2, that is the variance of x

    Cm = [[Cxx, Cxy], [Cyx, Cyy]];

    //get gradients of y on x, x on y and correlation line
    betayonx = r * Sy/Sx;
    betaxony = r * Sx/Sy;
    betaxonyinverse = 1/betaxony;
    betacl    = Sy/Sx;
    if (r < 0) betacl = -betacl;

    //formula for y on x
    alphayonx = My - betayonx * Mx;
    yvalueyxA = alphayonx + betayonx * -3;
    yvalueyxB = alphayonx + betayonx * 3

    //formula for x on y
    alphaxony = Mx - betaxony * My;;
    xvaluexyA = alphaxony + betaxony * -3;
    xvaluexyB = alphaxony + betaxony * 3

    //formula for correlation line
    yvaluecl1 = (-3 * betacl) + (My - (betacl * Mx));
    yvaluecl2 = (3 * betacl)  + (My - (betacl * Mx));

  }

  function displayStatistics() {

    //display mean and sd values
    $m1.text(Mx.toFixed(2).toString());
    $m2.text(My.toFixed(2).toString());
    $s1.text(Sx.toFixed(2).toString());
    $s2.text(Sy.toFixed(2).toString());

    //display calculated r from data
    $calculatedr.text(r.toFixed(2).toString().replace('0.', '.'))

    //display calculated r on graph
    if(displayr) { 
      svgD.append('text').text('r = ').attr('class', 'rtext').attr('x', 150).attr('y', y(2.8)).attr('text-anchor', 'start').attr('fill', 'black').style('font-size', '2.0rem').style('font-weight', 'bold').style('font-style', 'italic');
      svgD.append('text').text(r.toFixed(2).toString().replace('0.', '.')).attr('class', 'rtext').attr('x', 200).attr('y', y(2.8)).attr('text-anchor', 'start').attr('fill', 'black').style('font-size', '2.0rem').style('font-weight', 'bold');
    }

    //need to create a clipping rectangle
    let mask = svgD.append('defs').append('clipPath').attr('id', 'mask').append('rect').attr('x', x(-3)).attr('y', y(3)).attr('width', x(3) - x(-3)).attr('height', y(-3) - y(3));
    //show clip area -- 
    //svgD.append('rect').attr('class', 'test').attr('x', x(-3)).attr('y', y(3)).attr('width', x(3) - x(-3)).attr('height', y(-3) - y(3)).attr('stroke', 'black').attr('stroke-width', '0').attr('fill', 'rgb(255, 255, 0, 0.5)');

    //cross through means
    if (displayctm) {
      svgD.append('line').attr('class', 'ctm').attr('x1', x(Mx)).attr('y1', y(-3)).attr('x2', x(Mx) ).attr('y2', y(3)).attr('stroke', 'black').attr('stroke-width', 1).style('stroke-dasharray', ('3, 3'));
      svgD.append('line').attr('class', 'ctm').attr('x1', x(-3)).attr('y1', y(My)).attr('x2', x(3)).attr('y2', y(My)).attr('stroke', 'black').attr('stroke-width', 1).style('stroke-dasharray', ('3, 3'));
    }

    $corryxval.text((betayonx).toFixed(2).toString().replace('0.', '.'));
    $corrxyval.text((betaxonyinverse).toFixed(2).toString().replace('0.', '.'));
    $corrlineslopeval.text((betacl).toFixed(2).toString().replace('0.', '.')); 

    //corryx = true;
    if (corryx) {
      svgD.append('line').attr('class', 'regression').attr('x1', x(-3)).attr('y1', y(yvalueyxA)).attr('x2', x(3) ).attr('y2', y(yvalueyxB)).attr('stroke', 'blue').attr('stroke-width', 1).attr('clip-path', 'url(#mask)');
    }

    //corrxy = true;
    if (corrxy) {
      svgD.append('line').attr('class', 'regression').attr('x1', x(xvaluexyA)).attr('y1', y(-3)).attr('x2', x(xvaluexyB) ).attr('y2', y(3)).attr('stroke', 'red').attr('stroke-width', 1).attr('clip-path', 'url(#mask)');
    }

    //corrlineslope = true;
    if (corrlineslope) {
      svgD.append('line').attr('class', 'regression').attr('x1', x(-3) ).attr('y1', y(yvaluecl1) ).attr('x2', x(3) ).attr('y2', y(yvaluecl2) ).attr('stroke', 'black').attr('stroke-width', 1).attr('clip-path', 'url(#mask)');
    }
    
    //confidenceellipse = true;
    drawConfidenceEllipse();

  }


  function drawConfidenceEllipse() {
    if (confidenceellipse) {

      $('#covxx').text(Cxx.toFixed(2));
      $('#covxy').text(Cxy.toFixed(2));
      $('#covyx').text(Cyx.toFixed(2));
      $('#covyy').text(Cyy.toFixed(2));    
  
      //get the gradient of betaxony from normal perspective
      let betaxonygradient = (3 - -3)/(xvaluexyB - xvaluexyA);

      //create a math.matrix representation
      //create Cholesky decomposition from covariance matrix
      // let cov = math.matrix([[covxx, covxy], [covyx, covyy]]);
      // print(cov); 
      // cov = math.diag(cov);
      // print(cov);
      // cov = math.diag(cov);
      // print(cov);
      // cov = math.sqrt(cov);
      // print(cov);
      
      // let eigs = math.eigs(cov)
      // print(eigs);

      //find eigenvectors and eigenvalues  //depends on which is which
      let lambda1 = quadraticB(1, -(Cxx+Cyy), (Cxx*Cyy - Cxy*Cyx))
      let lambda2 = quadraticA(1, -(Cxx+Cyy), (Cxx*Cyy - Cxy*Cyx))

      let eigenvector1 = -Cxy/(Cyy-lambda1);  //x=1
      let eigenvector2 = -Cxy/(Cyy-lambda2);  //x=1

      $('#lambda1').text(lambda1.toFixed(2));
      $('#y1').text(eigenvector1.toFixed(2));

      $('#lambda2').text(lambda2.toFixed(2));
      $('#y2').text(eigenvector2.toFixed(2));

      semimajor = Sx * Math.sqrt(4.605 * lambda1); //90% = 4.605 ,95% = 5.991, 99% = 9.210
      semiminor = Sy * Math.sqrt(4.605 * lambda2); 

      angle; // = 90 =>horizontal!!
      let angle1 = Math.atan(eigenvector1) * 180/Math.PI;
      let angle2 = Math.atan(eigenvector2) * 180/Math.PI;

      if (lambda1 >= lambda2) angle = angle1; else angle = angle2; 

      //get gradient of eigenvector so I can draw a line  Actually this is eigenvector1
      //let gradient = eigenvector1;  //or gradient = Math.tan(angle/180 * Math.PI);
 

      //https://www.visiondummy.com/2014/04/draw-error-ellipse-representing-covariance-matrix/

      //markers (for arrows)
      svgD.append("defs").append("svg:marker").attr('id', 'arrowred')
        .attr("viewBox", "0 0 10 10").attr("refX", 1).attr("refY", 5).attr("markerWidth", 3).attr("markerHeight", 3)
        .attr("orient", "auto").append("svg:path").attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr('fill', 'red');
      
      svgD.append("defs").append("svg:marker").attr('id', 'arrowgreen')
        .attr("viewBox", "0 0 10 10").attr("refX", 1).attr("refY", 5).attr("markerWidth", 3).attr("markerHeight", 3)
        .attr("orient", "auto").append("svg:path").attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr('fill', 'green');


      //covariance error ellipse
      if (angle >= 0) svgD.append('ellipse').attr('class', 'confidenceellipse').attr( 'cx', x(Mx) ).attr('cy', y(My) ).attr('rx', semimajor * widthD / 6).attr('ry', semiminor * heightD / 6).attr('transform', `rotate( ${-angle}, ${x(Mx)}, ${y(My)} )`).attr('stroke', 'orange').attr('stroke-width', 3).attr('fill', 'none');//.attr('clip-path', 'url(#mask)');
      else            svgD.append('ellipse').attr('class', 'confidenceellipse').attr( 'cx', x(Mx) ).attr('cy', y(My) ).attr('rx', semimajor * widthD / 6).attr('ry', semiminor * heightD / 6).attr('transform', `rotate( ${180-angle}, ${x(Mx)}, ${y(My)} )`).attr('stroke', 'orange').attr('stroke-width', 3).attr('fill', 'none')//;.attr('clip-path', 'url(#mask)');

      //eigenvectors
      //major
      if (angle >= 0) svgD.append('line').attr('class', 'regression').attr('x1', x(Mx)).attr('y1', y(My)).attr('x2', x(Mx) + semimajor * widthD / 6 ).attr('y2', y(My) ).attr('transform', `rotate( ${-angle}, ${x(Mx)}, ${y(My)} )`).attr('stroke', 'red').attr('stroke-width', 3).attr('marker-end', 'url(#arrowred)');//.attr('clip-path', 'url(#mask)');
      else           svgD.append('line').attr('class', 'regression').attr('x1', x(Mx)).attr('y1', y(My)).attr('x2', x(Mx) + semimajor * widthD / 6 ).attr('y2', y(My) ).attr('transform', `rotate( ${180-angle}, ${x(Mx)}, ${y(My)} )`).attr('stroke', 'red').attr('stroke-width', 3).attr('marker-end', 'url(#arrowred)');//.attr('clip-path', 'url(#mask)');

      //minor
      if (angle >= 0) svgD.append('line').attr('class', 'regression').attr('x1', x(Mx)).attr('y1', y(My)).attr('x2', x(Mx) ).attr('y2', y(My) - semiminor * heightD / 6 ).attr('transform', `rotate( ${-angle}, ${x(Mx)}, ${y(My)} )`).attr('stroke', 'green').attr('stroke-width', 3).attr('marker-end', 'url(#arrowgreen)');//.attr('clip-path', 'url(#mask)');
      else           svgD.append('line').attr('class', 'regression').attr('x1', x(Mx)).attr('y1', y(My)).attr('x2', x(Mx) ).attr('y2', y(My) + semiminor * heightD / 6 ).attr('transform', `rotate( ${180-angle}, ${x(Mx)}, ${y(My)} )`).attr('stroke', 'green').attr('stroke-width', 3).attr('marker-end', 'url(#arrowgreen)');//.attr('clip-path', 'url(#mask)');

    }

    
    function quadraticA(a, b, c) {
      let xA = (-b - Math.sqrt(b * b - 4 * a * c))/(2 * a);
      return xA;
    }

    function quadraticB(a, b, c) {
      let xB = (-b + Math.sqrt(b * b - 4 * a * c))/(2 * a);
      return xB;
    }

  }

  /*--------------------------------------New Data Set----------------*/ 

  $newdataset.on('click', function() {  //button

    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  })

  /*--------------------------------------Display Features-------------*/

  $displayr.on('change', function() {
    displayr = $displayr.is(':checked');

    //dont recreate scatters
    drawScatterGraph();
    statistics();
    displayStatistics();
  })

  $displayctm.on('change', function() {
    displayctm = $displayctm.is(':checked');

    //don't recreate scatters
    drawScatterGraph();
    statistics();
    displayStatistics();
  })

  $displaymd.on('change', function() {
    displaymd = $displaymd.is(':checked');

    //don't recreate scatters
    drawScatterGraph();
    statistics();
    displayStatistics();
  })


  //show statistics
  $statistics1show.on('change', function() {
    statistics1show = $statistics1show.prop('checked');
    if (statistics1show) {
      $statistics1.show();
    }
    else {
      $statistics1.hide();
    }

  })

  //show display lines
  $displaylines1show.on('change', function() {
    displaylines1show = $displaylines1show.prop('checked');
    if (displaylines1show) {
      $displaylines1.show();
    }
    else {
      $displaylines1.hide();
      $corryx.prop('checked', false);
      corryx = false;
      $corrxy.prop('checked', false);
      corrxy = false;
      $corrlineslope.prop('checked', false);
      corrlineslope = false;
      $confidenceellipse.prop('checked', false);
      confidenceellipse = false;

      //don't recreate scatters
      drawScatterGraph();
      statistics();
      displayStatistics();
    }
  })

  $corryx.on('change', function() {
    corryx = $corryx.is(':checked');

    //don't recreate scatters
    drawScatterGraph();
    statistics();
    displayStatistics();
  })

  $corrxy.on('change', function() {
    corrxy = $corrxy.is(':checked');

    //don't recreate scatters
    drawScatterGraph();
    statistics();
    displayStatistics();
  })

  $corrlineslope.on('change', function() {
    corrlineslope = $corrlineslope.is(':checked');

    //don't recreate scatters
    drawScatterGraph();
    statistics();
    displayStatistics();
  })

  $confidenceellipse.on('change', function() {
    confidenceellipse = $confidenceellipse.is(':checked');

    //don't recreate scatters
    drawScatterGraph();
    statistics();
    displayStatistics();
  })


/*----------------------------------------N1 nudge bars-----------*/
//#region nudge bars
  //changes to N1
  $N1val.on('change', function() {
    if ( isNaN($N1val.val()) ) {
      N1 = 4;
      $N1val.val(N1.toFixed(0));
      return;
    };
    N1 = parseFloat($N1val.val());
    if (N1 < 4) {
      N1 = 4;
    }
    if (N1 > 300) {
      N1 = 300;
    }
    $N1val.val(N1.toFixed(0));
    updateN1();

    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  })

  $N1nudgebackward.on('mousedown', function() {
    N1nudgebackward();
    pauseId = setTimeout(function() {
      repeatId = setInterval ( function() {
        N1nudgebackward();
      }, delay );
    }, pause)
  })

  $N1nudgebackward.on('mouseup', function() {
    clearInterval(repeatId);
    clearTimeout(pauseId);
  })

  function N1nudgebackward() {
    N1 -= 1;
    if (N1 < 4) N1 = 4;
    $N1val.val(N1.toFixed(0));
    updateN1();

    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  }

  $N1nudgeforward.on('mousedown', function() {
    N1nudgeforward();
    pauseId = setTimeout(function() {
      repeatId = setInterval ( function() {
        N1nudgeforward();
      }, delay );
    }, pause)
  })

  $N1nudgeforward.on('mouseup', function() {
    clearInterval(repeatId);
    clearTimeout(pauseId);
  })

  function N1nudgeforward() {
    N1 += 1;
    if (N1 > 300) N1 = 300;
    $N1val.val(N1.toFixed(0));
    updateN1();

    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  }

/*----------------------------------------r nudge bars-----------*/
  //changes to r
  $rval.on('change', function() {
    if ( isNaN($rval.val()) ) {
      rs = 0.5;
      $rval.val(rs.toFixed(2).toString().replace('0.', '.'));
      $calculatedr.text(r.toFixed(2).toString().replace('0.', '.'));
      return;
    };
    rs = parseFloat($rval.val());
    if (rs < -1) {
      rs = -1;
    }
    if (rs > 1) {
      rs = 1;
    }
    $rval.val(rs.toFixed(2).toString().replace('0.', '.'));
    $calculatedr.text(r.toFixed(2).toString().replace('0.', '.'));
    updater();

    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  })

  $rnudgebackward.on('mousedown', function() {
    rnudgebackward();
    pauseId = setTimeout(function() {
      repeatId = setInterval ( function() {
        rnudgebackward();
      }, delay );
    }, pause)
  })

  $rnudgebackward.on('mouseup', function() {
    clearInterval(repeatId);
    clearTimeout(pauseId);
  })

  function rnudgebackward() {
    rs -= 0.01;
    if (rs < -1) rs = -1;
    $rval.val(rs.toFixed(2).toString().replace('0.', '.'));
    $calculatedr.text(r.toFixed(2).toString().replace('0.', '.'));
    updater();

    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  }

  $rnudgeforward.on('mousedown', function() {
    rnudgeforward();
    pauseId = setTimeout(function() {
      repeatId = setInterval ( function() {
        rnudgeforward();
      }, delay );
    }, pause)
  })

  $rnudgeforward.on('mouseup', function() {
    clearInterval(repeatId);
    clearTimeout(pauseId);
  })

  function rnudgeforward() {
    rs += 0.01;
    if (rs > 1) rs = 1;
    $rval.val(rs.toFixed(2).toString().replace('0.', '.'));
    $calculatedr.text(r.toFixed(2).toString().replace('0.', '.'));
    updater();

    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  }
//#endregion

  /*---------------------------------------------Tooltips on or off-------------------------------------- */

  function setTooltips() {
    Tipped.setDefaultSkin('esci');

    //heading section
    Tipped.create('#logo',          'Version: '+version,                              { skin: 'red', size: 'versionsize', behavior: 'mouse', target: 'mouse', maxWidth: 250, hideOthers: true, hideOnClickOutside: true, hideAfter: 0 });
  
    Tipped.create('#tooltipsonoff', 'Tips on/off, default is off!',                   { skin: 'esci', size: 'xlarge', showDelay: 750, behavior: 'mouse', target: 'mouse', maxWidth: 250, hideOthers: true, hideOnClickOutside: true, hideAfter: 0 });

    Tipped.create('.headingtip',    'https://thenewstatistics.com',                   { skin: 'esci', size: 'xlarge', showDelay: 750, behavior: 'mouse', target: 'mouse', maxWidth: 250, hideOthers: true, hideOnClickOutside: true, hideAfter: 0 });

    Tipped.create('.hometip',       'Click to return to esci Home',                   { skin: 'esci', size: 'xlarge', showDelay: 750, behavior: 'mouse', target: 'mouse', maxWidth: 250, hideOthers: true, hideOnClickOutside: true, hideAfter: 0 });

    

    //spare
    // Tipped.create('. tip', '', { skin: 'esci', size: 'xlarge', showDelay: 750, behavior: 'mouse', target: 'mouse', maxWidth: 250, hideOthers: true, hideOnClickOutside: true, hideAfter: 0 });

    Tipped.disable('[data-tooltip]');
  }

  $('#tooltipsonoff').on('click', function() {
    if (tooltipson) {
      tooltipson = false;
      $('#tooltipsonoff').css('background-color', 'lightgrey');
	    Tipped.disable('[data-tooltip]');
    }
    else {
      tooltipson = true;
      $('#tooltipsonoff').css('background-color', 'lightgreen');
      Tipped.enable('[data-tooltip]');
    }
  })


  /*----------------------------------------------------------footer----------------------------------------*/
 
  $('#footer').on('click', function() {
    window.location.href = "https://thenewstatistics.com/";
  })

  /*---------------------------------------------------------  resize event -----------------------------------------------*/
  $(window).bind('resize', function(e){
    window.resizeEvt;
    $(window).resize(function(){
        clearTimeout(window.resizeEvt);
        window.resizeEvt = setTimeout(function(){
          resize();
        }, 500);
    });
  });

  //helper function for testing
  function lg(s) {
    console.log(s);
  }  

  function print (value) {
    const precision = 2
    console.log(math.format(value, precision))
  }

  //keep display at top when scrolling
  function boxtothetop() {
    let windowTop = $(window).scrollTop();
    let top = $('#boxHere').offset().top;
    if (windowTop > top) {
      $display.addClass('box');
      $('#boxHere').height($display.outerHeight());
    } else {
      $display.removeClass('box');
      $('#boxHere').height(0);
    }
  }


  //----------------------------clear data buttons--------------------------------------------------

  $cleardata.on('click', function() {
    $cleardatayes.show();
    $cleardatano.show();
  })

  $cleardatayes.on('click', function() {
    $cleardatayes.hide();
    $cleardatano.hide();
    
    //clear the data
    $('.dataitems1').remove();
    $('.dataitems2').remove();
  })

  $cleardatano.on('click', function() {
    $cleardatayes.hide();
    $cleardatano.hide();
  })  


  //----------------------------load data buttons--------------------------------------------------

  //open test data panel
  $test.on('change', function() {
    test = $test.prop('checked');
    if (test) {
      $loadtestdatapanel.show();
    }
    else {
      $loadtestdatapanel.hide();

      //turn off ellipse
      $confidenceellipse.prop('checked', false);
      confidenceellipse = false;
    }

    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  })

  $loaddata.on('click', function() {
    $('#datasetdiv').show(); 

    if (loaddata) {
      $('#datasetdiv').show();
      loaddata = false;
    }
    else {
      $('#datasetdiv').hide();
      loaddata = true;
    }
  })

  $('#dataset').on('change', function(e) {
    let thefile = e.target.files; // FileList object
    let reader = new FileReader();

    let heading = true;
    let splits;
    let split;

    $('.dataitems1').remove();
    $('.dataitems2').remove();

    reader.onload = function(event) {
      //lg(reader.result);
      splits = reader.result.split('\r\n');

      for (let i = 0; i < splits.length-1; i += 1) {

        split = splits[i].split(',');

        if (heading) {
          $('#group1labelpd').val(split[0]);
          $('#group2labelpd').val(split[1]); 
          heading = false;       
        }
        else {
          $('#data').append(  `<input type=text class=dataitems1 value=${ split[0] }> <input type=text class=dataitems2 value=${ split[1] }>` );
        }
      }

      createScatters();
      drawScatterGraph();
      statistics();
      displayStatistics();      

    }

    reader.readAsText(thefile[0]);
    $('#datasetdiv').hide();
    loaddata = true;

  })

  $('.dataitems1').on('change', function() {
    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  })

  $('.dataitems2').on('change', function() {
    createScatters();
    drawScatterGraph();
    statistics();
    displayStatistics();
  })


  function loadTestData() {
    $('#data').append(  `<input type=text class=dataitems1 value=${ -2.9 }> <input type=text class=dataitems2 value=${ -2.6 }>` );
    $('#data').append(  `<input type=text class=dataitems1 value=${ -1.2 }>  <input type=text class=dataitems2 value=${ -1.5 }>` );
    $('#data').append(  `<input type=text class=dataitems1 value=${ 0.3 }>   <input type=text class=dataitems2 value=${ -0.6 }>` );
    $('#data').append(  `<input type=text class=dataitems1 value=${ 1.4 }>   <input type=text class=dataitems2 value=${ 2.8 }>` );
    $('#data').append(  `<input type=text class=dataitems1 value=${ 2.5 }>   <input type=text class=dataitems2 value=${ 2.2 }>` );
  }

})

