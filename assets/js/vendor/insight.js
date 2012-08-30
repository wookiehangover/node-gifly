

// Don't overwrite pre-existing instances of the object (esp. for older browsers).
var TBRUM = TBRUM || {};
TBRUM.q = TBRUM.q || [];
TBRUM.q.push(["mark","script-firstbyte",new Date().getTime()]);
TBRUM.version = "0.2";
TBRUM.perf_obj = false;

// CUSTOMIZE THESE VARIABLES!!
TBRUM.beaconUrl = TBRUM.beaconUrl || '/beacon.gif';
TBRUM.autorun = ( "undefined" != typeof(TBRUM.autorun) ? TBRUM.autorun : true );


TBRUM.init = function() {
  TBRUM.bDone = false;
  TBRUM.marks = {};
  TBRUM.measures = {};
  TBRUM.starts = {};  // We need to save the starts so that given a measure we can say the epoch times that it began and ended.
  TBRUM.addEventListener("beforeunload", TBRUM.beforeUnload, false);
  TBRUM.addEventListener("load", TBRUM.onload, false); // TODO - this could happen AFTER the load event has already fired!!
  
  (function() { // Onready handler
    var didContentLoaded = false
    var contentFn = function(){}
    
    var setOnContentLoaded = function (fx){
        contentFn = oneTimeContentLoaded(fx)
        watchForContentLoaded()
    }
    
    var oneTimeContentLoaded = function(fx){
      return function(){
      if(!didContentLoaded){
          didContentLoaded = true
          fx()
      }
        }
    }
    
    var watchForContentLoaded = function(){
        if ( document.addEventListener ) {
      document.addEventListener( "DOMContentLoaded", contentFn , false )
        }else if (document.attachEvent){
      document.attachEvent( "onreadystatechange", contentFn );
      var toplevel = false;
      try {
          toplevel = window.frameElement == null;
      } catch(e) {}
      if ( document.documentElement.doScroll && toplevel ) {
          ieScrollCheck();
      }
        }
    }
    
    var ieScrollCheck = function(){
        if(didContentLoaded){ return }
        try {
      document.documentElement.doScroll("left")
        }catch(e) {
      setTimeout( ieScrollCheck, 5 );
      return;
        }
        contentFn()
    }
    setOnContentLoaded( function() {
      // Stuff to do when onready fires
      TBRUM.mark("onready");
      TBRUM.measure( 'onready', 'starttime', 'onready' ); } );
  })();

  // Process any commands that have been queued up while TBRUM.js loaded asynchronously.
  TBRUM.processQ();
  
  TBRUM.findStartTime();
};


// Process any commands in the queue.
// The command queue is used to store calls to the API before the full script has been loaded.
TBRUM.processQ = function() {
  var len = TBRUM.q.length;
  for ( var i = 0; i < len; i++ ) {
    var aParams = TBRUM.q[i];
    var cmd = aParams[0];
    if ( "mark" === cmd ) {
      TBRUM.mark(aParams[1], aParams[2]);
    }
    else if ( "measure" === cmd ) {
      TBRUM.measure(aParams[1], aParams[2], aParams[3]);
    }
    else if ( "done" === cmd ) {
      TBRUM.done(aParams[1]);
    } else if ( "tags" === cmd ) {
      if ( TBRUM.tags )
        TBRUM.tags += ',';
      else
        TBRUM.tags = '';
      TBRUM.tags += aParams[1];
    } else if ( "conv" === cmd ) {
      TBRUM.conversions = aParams.slice(1).join("|");
    }
  }
};

TBRUM.q.push = function() {
  var q = Array.prototype.slice.call( arguments[0], 0 );
  var cmd = q[0];
  var params = q.slice( 1 );
  if ( "conv" == cmd ) {
    TBRUM.conversions = params.join("|");
    if ( TBRUM.bDone )
      TBRUM.beaconWrapper();
  } else if ( "tags" === cmd ) {
    if ( TBRUM.tags )
      TBRUM.tags += ',';
    else
      TBRUM.tags = '';
    TBRUM.tags += arguments[0][1];
  }
}


// Set a time marker (typically the beginning of an episode).
TBRUM.mark = function(markName, markTime) {
  if ( ! markName) {
    return;
  }
  
  TBRUM.marks[markName] = parseInt(markTime || new Date().getTime());

  // Special marks that we look for:
  if ( "firstbyte" === markName ) {
    TBRUM.measure("backend", "starttime", "firstbyte");
  }
  else if ( "onload" === markName ) {
    TBRUM.measure("frontend", "firstbyte", "onload");
    TBRUM.measure("onload", "starttime", "onload");
  }
  else if ( "done" === markName ) {
    TBRUM.measure("total_load_time", "starttime", "done");
  }
};


// Measure an episode.
TBRUM.measure = function(episodeName, startNameOrTime, endNameOrTime) {
  if ( ! episodeName) {
    return;
  }

  var startEpochTime;
  if ( "undefined" === typeof(startNameOrTime) ) {
    if ( "number" === typeof(TBRUM.marks[episodeName]) ) {
      // If no startName is specified, then use the episodeName as the start mark.
      startEpochTime = TBRUM.marks[episodeName];
    }
    else {
      // Create a "measure" that is this exact point in time?
      startEpochTime = new Date().getTime();
    }
  }
  else if ( "number" === typeof(TBRUM.marks[startNameOrTime]) ) {
    // If a mark with this name exists, use that.
    startEpochTime = TBRUM.marks[startNameOrTime];
  }
  else if ( "number" === typeof(startNameOrTime) ) {
    // Assume a specific epoch time is provided.
    startEpochTime = startNameOrTime;
  }
  else {
    return;
  }

  var endEpochTime;
  if ( "undefined" === typeof(endNameOrTime) ) {
    endEpochTime = new Date().getTime();
  }
  else if ( "number" === typeof(TBRUM.marks[endNameOrTime]) ) {
    // If a mark with this name exists, use that.
    endEpochTime = TBRUM.marks[endNameOrTime];
  }
  else if ( "number" === typeof(endNameOrTime) ) {
    endEpochTime = endNameOrTime;
  }
  else {
    return;
  }

  TBRUM.starts[episodeName] = parseInt(startEpochTime);
  TBRUM.measures[episodeName] = parseInt(endEpochTime - startEpochTime);
};


// In the case of Ajax or post-onload TBRUM, call done to signal the end of TBRUM.
TBRUM.done = function(callback) {
  TBRUM.mark("done");
  
  var m = TBRUM.measure;
  if ( TBRUM.perf_obj ) {
    var m2 = TBRUM.mark;
    var timings = window.performance.timing;
    for( var i in timings ) {
      m2( i, timings[i] );
    }
    m( 'red_t', 'redirectStart', 'redirectEnd' );
    m( 'cache_t', 'fetchStart', 'domainLookupStart' );
    m( 'dns_t', 'domainLookupStart', 'domainLookupEnd' );
    m( 'tcp_t', 'connectStart', 'connectEnd' );
    m( 'b_wait_t', 'requestStart', 'responseStart' );
    m( 'b_tran_t', 'responseStart', 'responseEnd' );
    m( 'onready_t', 'navigationStart', 'domContentLoadedEventStart' );
    m( 'onload_t', 'navigationStart', 'loadEventStart' );
    m( 'scr_proc_t', 'script-firstbyte', 'script-done' );
  }
  
  if ( TBRUM.autorun && !TBRUM.bDone ) {
    TBRUM.beaconWrapper();
    if ( TBRUM.measures['onload_t'] && TBRUM.measures['onload_t'] > 0 )
      onload_time = TBRUM.measures['onload_t'];
    else if ( TBRUM.measures['onload'] && TBRUM.measures['onload'] > 0 )
      onload_time = TBRUM.measures['onload'];
    cookie_str = TBRUM.getCookie( 'TBTIM' );
    if ( cookie_str ) {
      parts = cookie_str.split( "|" );
      if ( parts.length < 2 ) {
        cookie_str = onload_time + "|1";
      } else {
        cookie_str = ( parseInt( parts[0] ) + onload_time ) + "|" + ( parseInt( parts[1] ) + 1 );
      }
    } else {
      cookie_str = onload_time + "|1";
    }
    
    TBRUM.setCookie( 'TBTIM', cookie_str, true );
  }

  TBRUM.bDone = true;

  if ( "function" === typeof(callback) ) {
    callback();
  }
};

TBRUM.beaconWrapper = function() {
  TBRUM.sendBeacon( false, {src:TBRUM.src,tbtim:TBRUM.getCookie('TBTIM'),conversion:TBRUM.conversions || '',tags:TBRUM.tags || ''});
}

// Construct a querystring of episodic time measurements and send it to the specified URL.
//    url      The URL to which to send the beacon request. 
//             This is the full path including filename, but without querystring params.
//             Example: "http://yourdomain.com/gen204"
//             A best practice is to return a 204 "No Content" response.
//             If not specified then TBRUM.beaconUrl is used.
//
//    params - An object of key|value pairs that are added to the URL's querystring.
//             Example: { "pageType": "login", "dataCenter": "Wash DC" }
//             That example would add this to the querystring: &pageType=login&dataCenter=Wash%20DC
//
TBRUM.sendBeacon = function(url, params) {
  url = url || TBRUM.beaconUrl;
  var measures = TBRUM.measures;
  var sTimes = "?";
  for ( var key in measures ) {
    sTimes += escape(key) + "=" + measures[key] + "&";
  }
  
  if ( sTimes.length > 1 ) {
    sTimes = sTimes.substr(0, sTimes.length - 1);

    // Add user's params
    if ( params ) {
      for (var key in params) {
        if ( params.hasOwnProperty(key) ) {
          sTimes += "&" + escape(key) + "=" + escape(params[key]);
        }
      }
    }

    TBRUM.img_beacon = new Image();
    TBRUM.img_beacon.src = url + sTimes + "&v=" + TBRUM.version;
      return TBRUM.img_beacon.src;
  }

    return "";
};


// Use various techniques to determine the time at which this page started.
TBRUM.findStartTime = function() {
  var startTime = TBRUM.findStartWebTiming() || TBRUM.findStartGToolbar() || TBRUM.findStartCookie();
  if ( !startTime && TBRUM.marks['firstbyte'] ) {
    startTime = TBRUM.marks['firstbyte'];
    TBRUM.src = 'inline';
  }
  
  if ( startTime ) {
    TBRUM.mark("starttime", startTime);
  }
};


// Find the start time from the Web Timing "performance" object.
// http://test.w3.org/webperf/specs/NavigationTiming/
// http://blog.chromium.org/2010/07/do-you-know-how-slow-your-web-page-is.html
TBRUM.findStartWebTiming = function() {
  var startTime = undefined;

  // Don't trust Firefox: http://calendar.perfplanet.com/2011/stop-waisting-your-time-using-the-google-analytics-site-speed-report/
  if ( navigator.userAgent.match( /Firefox/i ) )
    return false;
  
  var performance = window.performance || window.mozPerformance || window.msPerformance || window.webkitPerformance;
 
  if ( "undefined" != typeof(performance) && "undefined" != typeof(performance.timing) && "undefined" != typeof(performance.timing["navigationStart"]) ) {
    TBRUM.perf_obj = true;
    startTime = performance.timing["navigationStart"];
    TBRUM.src = 'nav';
  }

  return startTime;
};


// Find the start time from the Google Toolbar.
// http://ecmanaut.blogspot.com/2010/06/google-bom-feature-ms-since-pageload.html
TBRUM.findStartGToolbar = function() {
  var startTime = undefined;

  if ( "undefined" != typeof(window.external) && "undefined" != typeof(window.external.pageT) ) {
    startTime = (new Date().getTime()) - window.external.pageT;
  }
  else if ( "undefined" != typeof(window.gtbExternal) && "undefined" != typeof(window.gtbExternal.pageT) ) {
    startTime = (new Date().getTime()) - window.gtbExternal.pageT();
  }
  else if ( "undefined" != typeof(window.chrome) && "undefined" != typeof(window.chrome.csi) ) {
    startTime = (new Date().getTime()) - window.chrome.csi().pageT;
  }

  if ( startTime )
    TBRUM.src = 'gt';
    
  return startTime;
};


// Find the start time based on a cookie set by TBRUM in the unload handler.
TBRUM.findStartCookie = function() {
  var aCookies = document.cookie.split(' ');
  for ( var i = 0; i < aCookies.length; i++ ) {
    if ( 0 === aCookies[i].indexOf("TBRUM=") ) {
      var aSubCookies = aCookies[i].substring("TBRUM=".length).split('&');
      var startTime, bReferrerMatch;
      for ( var j = 0; j < aSubCookies.length; j++ ) {
        if ( 0 === aSubCookies[j].indexOf("s=") ) {
          startTime = aSubCookies[j].substring(2);
        }
        else if ( 0 === aSubCookies[j].indexOf("r=") ) {
          var startPage = aSubCookies[j].substring(2);
          bReferrerMatch = ( escape(document.referrer) == startPage );
        }
      }
      if ( bReferrerMatch && startTime ) {
        TBRUM.src = 'cook';
        return startTime;
      }
    }
  }

  return undefined;
};

TBRUM.getCookie = function(name) {
        var dc = document.cookie;
        var begin = dc.indexOf(name);
        var end = (dc.indexOf(";", begin) == -1) ? dc.length : dc.indexOf(";", begin);
  if ( begin == -1 )
    return "";
        return unescape(dc.substring((begin + (name.length + 1)), end));
}

TBRUM.setCookie = function(name, value, expire) {
  if (!name || !value) { return 0; }

  if ( expire ) {
    var tomorrow = new Date( (new Date()).getTime() + (new Date()).getTimezoneOffset() * 60000 + 24 * 60 * 60 * 1000 );
    var expr_str = ";expires=" + (new Date( tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate() )).toUTCString().replace( / [0-9]+\:/, " 00:" );
  } else {
    var expr_str = '';
  }
  document.cookie = name + "=" + value + expr_str + ";path=/;";
}

// Set a cookie when the page unloads. Consume this cookie on the next page to get a "start time".
// Doesn't work in some browsers (Opera).
TBRUM.beforeUnload = function(e) {
  TBRUM.setCookie( 'TBRUM', "s=" + Number(new Date()) + "&r=" + escape(document.location) );
};

// When the page is done do final wrap-up.
TBRUM.onload = function(e) {
  TBRUM.mark("onload", new Date().getTime());

  if ( TBRUM.autorun ) {
    TBRUM.done();
  }
};

// Wrapper for addEventListener and attachEvent.
TBRUM.addEventListener = function(sType, callback, bCapture) {
  if ( "undefined" != typeof(window.attachEvent) ) {
    return window.attachEvent("on" + sType, callback);
  }
  else if ( window.addEventListener ){
    return window.addEventListener(sType, callback, bCapture);
  }
};

TBRUM.init();
TBRUM.mark("script-done",new Date().getTime());
