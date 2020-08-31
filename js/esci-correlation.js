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

*/
//#endregion 

let version = '0.0.7';

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
  
  let left;
  let right;

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

  const $confidenceellipse = $('#confidenceellipse');
  confidenceellipse = false;

  let svgD;   

                                                                              //the svg reference to pdfdisplay
  const $display            = $('#display');

  let scatters = [];

  let xs;
  let ys;

  let i;
  let displayRed;

  let xmean;
  let ymean;
  let xsd;
  let ysd;

  const $calculatedr = $('#calculatedr');

  const $m1 = $('#m1');
  const $m2 = $('#m2');
  const $s1 = $('#s1');
  const $s2 = $('#s2');

  let test = false;

  //#endregion

  //breadcrumbs
  $('#homecrumb').on('click', function() {
    window.location.href = "https://www.esci.thenewstatistics.com/";
  })

  initialise();

  function initialise() {
    
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
    drawScatterGraph();
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

  $('#test').on('change', function() {
    test = $('#test').is(':checked');
    createScatters();
    drawScatterGraph();
  })

  function createScatters() {

    let xr, yr, z;

    //test=true;
    if (test) {
      scatters= [{x: -1, y: -1}, {x: -0.5, y: -0.5}, {x: -0.3, y: 0.3}, {x: 0.3, y: -0.3}, {x: 0.5, y: 0.5}, {x: 1, y: 1}]
    }
    else {
      scatters = [];
      s = [];

      for (i = 0; i < N1; i += 1) {
        xs = jStat.normal.sample( 0, 1 );
        ys = jStat.normal.sample( 0, 1 );
        ys = (rs * xs) + (Math.sqrt(1 - rs*rs) * ys);
        scatters.push({ x: xs, y: ys });        
        s.push([xs, ys]);
      }

      //math.js
      s.forEach(function (value, index, matrix) {
        console.log('value:', value, 'index:', index) 
      }) 
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

    statistics();

  }

  function statistics() {

    let xvals = scatters.map(a => a.x);
    let yvals = scatters.map(a => a.y);

    xmean = jStat.mean(xvals);
    xsd   = jStat.stdev(xvals, true);  //sample sd

    ymean = jStat.mean(yvals)
    ysd   = jStat.stdev(yvals, true)

    $m1.text(xmean.toFixed(2).toString());
    $m2.text(ymean.toFixed(2).toString());
    $s1.text(xsd.toFixed(2).toString());
    $s2.text(ysd.toFixed(2).toString());

    //get r
    r = jStat.corrcoeff( xvals, yvals )
    $calculatedr.text(r.toFixed(2).toString().replace('0.', '.'))

    //display r on graph
    if(displayr) { 
      svgD.append('text').text('r = ').attr('class', 'rtext').attr('x', 150).attr('y', y(2.8)).attr('text-anchor', 'start').attr('fill', 'black').style('font-size', '2.0rem').style('font-weight', 'bold').style('font-style', 'italic');
      svgD.append('text').text(r.toFixed(2).toString().replace('0.', '.')).attr('class', 'rtext').attr('x', 200).attr('y', y(2.8)).attr('text-anchor', 'start').attr('fill', 'black').style('font-size', '2.0rem').style('font-weight', 'bold');
    }

    //get Sxy, Sxx, Syy
    let sxx = 0;
    let syy = 0;
    let sxy = 0;

    for (let i = 0; i < scatters.length; i += 1) {
      sxy += (scatters[i].x - xmean) * (scatters[i].y - ymean);
      sxx += (scatters[i].x - xmean) * (scatters[i].x - xmean);
      syy += (scatters[i].y - ymean) * (scatters[i].y - ymean);
    }

    //y on x
    let betayonx = sxy/sxx;
    let alphayonx = ymean - betayonx * xmean;
    let yvalueyxA = alphayonx + betayonx * -3;
    let yvalueyxB = alphayonx + betayonx * 3

    //x on y
    let betaxony = sxy/syy;
    //or let betaxony = (r * r) / betayonx;  //works
    let alphaxony = xmean - betaxony * ymean;;
    let xvaluexyA = alphaxony + betaxony * -3;
    let xvaluexyB = alphaxony + betaxony * 3

    //get the gradient of betaxony from normal perspective
    let betaxonygradient = (3 - -3)/(xvaluexyB - xvaluexyA);


    //need to create a clipping rectangle
    let mask = svgD.append('defs').append('clipPath').attr('id', 'mask').append('rect').attr('x', x(-3)).attr('y', y(3)).attr('width', x(3) - x(-3)).attr('height', y(-3) - y(3));
    //show clip area -- 
    //svgD.append('rect').attr('class', 'test').attr('x', x(-3)).attr('y', y(3)).attr('width', x(3) - x(-3)).attr('height', y(-3) - y(3)).attr('stroke', 'black').attr('stroke-width', '0').attr('fill', 'rgb(255, 255, 0, 0.5)');

    if (displayctm) {
      svgD.append('line').attr('class', 'ctm').attr('x1', x(xmean)).attr('y1', y(-3)).attr('x2', x(xmean) ).attr('y2', y(3)).attr('stroke', 'black').attr('stroke-width', 1).style('stroke-dasharray', ('3, 3'));
      svgD.append('line').attr('class', 'ctm').attr('x1', x(-3)).attr('y1', y(ymean)).attr('x2', x(3)).attr('y2', y(ymean)).attr('stroke', 'black').attr('stroke-width', 1).style('stroke-dasharray', ('3, 3'));
    }

    //TEST info panel
    $('#displayinfopaneldiv').hide();
    //$('#confidenceellipsediv').hide();
    //confidenceellipse = true;

    //covariance matrix - [cxx cxy]
    //                    [cyx cyy]    
    let covxx = jStat.covariance(xvals, xvals);  //this is the xsd^2, that is the variance of x
    let covxy = jStat.covariance(xvals, yvals);
    let covyx = jStat.covariance(yvals, xvals);  //same as covxy really
    let covyy = jStat.covariance(yvals, yvals);  //ths is the ysd^2, that is the variance of x


    
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


    $('#covxx').text(covxx.toFixed(2));
    $('#covxy').text(covxy.toFixed(2));
    $('#covyx').text(covyx.toFixed(2));
    $('#covyy').text(covyy.toFixed(2));
    
    //find eigenvectors and eigenvalues  //depends on which is which
    let lambda1 = quadraticB(1, -(covxx+covyy), (covxx*covyy - covxy*covyx))
    let lambda2 = quadraticA(1, -(covxx+covyy), (covxx*covyy - covxy*covyx))

    let eigenvector1 = -covxy/(covyy-lambda1);  //x=1
    let eigenvector2 = -covxy/(covyy-lambda2);  //x=1

    $('#lambda1').text(lambda1.toFixed(2));
    $('#y1').text(eigenvector1.toFixed(2));

    $('#lambda2').text(lambda2.toFixed(2));
    $('#y2').text(eigenvector2.toFixed(2));

    semimajor = xsd * Math.sqrt(4.605 * lambda1); //* widthD/6;  //90% = 4.605 ,95% = 5.991, 99% = 9.210
    semiminor = ysd * Math.sqrt(4.605 * lambda2); // * heightD/6;

    let angle; // = 90 =>horizontal!!
    let angle1 = Math.atan(eigenvector1) * 180/Math.PI;
    let angle2 = Math.atan(eigenvector2) * 180/Math.PI;

    if (lambda1 >= lambda2) angle = angle1; else angle = angle2; 

    //get gradient of eigenvector so I can draw a line  Actually this is eigenvector1
    let gradient = eigenvector1;  //or gradient = Math.tan(angle/180 * Math.PI);
    let ycl1 = (-3 * gradient) + (ymean - (gradient * xmean));
    let ycl2 = (3 * gradient) + (ymean - (gradient * xmean));

    $corryxval.text((betayonx).toFixed(2).toString().replace('0.', '.'));
    $corrxyval.text((betaxonygradient).toFixed(2).toString().replace('0.', '.'));
    $corrlineslopeval.text((gradient).toFixed(2).toString().replace('0.', '.'));    


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
      svgD.append('line').attr('class', 'regression').attr('x1', x(-3) ).attr('y1', y(ycl1) ).attr('x2', x(3) ).attr('y2', y(ycl2) ).attr('stroke', 'black').attr('stroke-width', 1).attr('clip-path', 'url(#mask)');
    }

    if (confidenceellipse) {
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
      if (angle >= 0) svgD.append('ellipse').attr('class', 'confidenceellipse').attr( 'cx', x(xmean) ).attr('cy', y(ymean) ).attr('rx', semimajor * widthD / 6).attr('ry', semiminor * heightD / 6).attr('transform', `rotate( ${-angle}, ${x(xmean)}, ${y(ymean)} )`).attr('stroke', 'orange').attr('stroke-width', 3).attr('fill', 'none');//.attr('clip-path', 'url(#mask)');
      else            svgD.append('ellipse').attr('class', 'confidenceellipse').attr( 'cx', x(xmean) ).attr('cy', y(ymean) ).attr('rx', semimajor * widthD / 6).attr('ry', semiminor * heightD / 6).attr('transform', `rotate( ${180-angle}, ${x(xmean)}, ${y(ymean)} )`).attr('stroke', 'orange').attr('stroke-width', 3).attr('fill', 'none')//;.attr('clip-path', 'url(#mask)');

      //eigenvectors
      //major
      if (angle >= 0) svgD.append('line').attr('class', 'regression').attr('x1', x(xmean)).attr('y1', y(ymean)).attr('x2', x(xmean) + semimajor * widthD / 6 ).attr('y2', y(ymean) ).attr('transform', `rotate( ${-angle}, ${x(xmean)}, ${y(ymean)} )`).attr('stroke', 'red').attr('stroke-width', 3).attr('marker-end', 'url(#arrowred)');//.attr('clip-path', 'url(#mask)');
      else           svgD.append('line').attr('class', 'regression').attr('x1', x(xmean)).attr('y1', y(ymean)).attr('x2', x(xmean) + semimajor * widthD / 6 ).attr('y2', y(ymean) ).attr('transform', `rotate( ${180-angle}, ${x(xmean)}, ${y(ymean)} )`).attr('stroke', 'red').attr('stroke-width', 3).attr('marker-end', 'url(#arrowred)');//.attr('clip-path', 'url(#mask)');

      //minor
      if (angle >= 0) svgD.append('line').attr('class', 'regression').attr('x1', x(xmean)).attr('y1', y(ymean)).attr('x2', x(xmean) ).attr('y2', y(ymean) - semiminor * heightD / 6 ).attr('transform', `rotate( ${-angle}, ${x(xmean)}, ${y(ymean)} )`).attr('stroke', 'green').attr('stroke-width', 3).attr('marker-end', 'url(#arrowgreen)');//.attr('clip-path', 'url(#mask)');
      else           svgD.append('line').attr('class', 'regression').attr('x1', x(xmean)).attr('y1', y(ymean)).attr('x2', x(xmean) ).attr('y2', y(ymean) + semiminor * heightD / 6 ).attr('transform', `rotate( ${180-angle}, ${x(xmean)}, ${y(ymean)} )`).attr('stroke', 'green').attr('stroke-width', 3).attr('marker-end', 'url(#arrowgreen)');//.attr('clip-path', 'url(#mask)');

    }

  }

  function quadraticA(a, b, c) {
    let xA = (-b - Math.sqrt(b * b - 4 * a * c))/(2 * a);
    return xA;
  }

  function quadraticB(a, b, c) {
    let xB = (-b + Math.sqrt(b * b - 4 * a * c))/(2 * a);
    return xB;
  }



  /*--------------------------------------New Data Set----------------*/ 

  $newdataset.on('click', function() {  //button
    createScatters();
    drawScatterGraph();
  })

  /*--------------------------------------Display Features-------------*/

  $displayr.on('change', function() {
    displayr = $displayr.is(':checked');
    drawScatterGraph();
  })

  $displayctm.on('change', function() {
    displayctm = $displayctm.is(':checked');
    drawScatterGraph();
    
  })

  $displaymd.on('change', function() {
    displaymd = $displaymd.is(':checked');
    drawScatterGraph();
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
      drawScatterGraph();
    }
  })

  $corryx.on('change', function() {
    corryx = $corryx.is(':checked');
    drawScatterGraph();
  })

  $corrxy.on('change', function() {
    corrxy = $corrxy.is(':checked');
    drawScatterGraph();
  })

  $corrlineslope.on('change', function() {
    corrlineslope = $corrlineslope.is(':checked');
    drawScatterGraph();
  })

  $confidenceellipse.on('change', function() {
    confidenceellipse = $confidenceellipse.is(':checked');
    drawScatterGraph();
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

})

