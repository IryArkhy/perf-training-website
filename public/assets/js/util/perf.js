// field data performance agent

(function (ready) {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    ready();
  } else {
    document.addEventListener("readystatechange", function() {
      if (document.readyState === "complete") {
        ready();
      }
    });
  }
})(function perf() { /* the document is now complete. */

  var data = {
    url: window.location.href, // from what page url you're gonna get metrics
    dcl: 0, // DOM content loaded
    load: 0, // when the load evemt occured
    fcp: 0,
    lcp: 0,
    cls: 0,
    fid: 0
  };

  // ----- 1 ------

  var fcpObserver = new PerformanceObserver(function handleFCP(entryList) {
    var entries = entryList.getEntries() || []; // array of paint entries
    entries.forEach(function(entry) {
      if (entry.name === "first-contentful-paint") {
        data.fcp = entry.startTime; // capture the value of this entry
        console.log("Recorded FCP Performance: " + data.fcp);
      }
    });
  }).observe({ type: "paint", buffered: true });

  // bufferd option explanation
  // some relevant for me events might have already happen (before my fcpObserver function loadead and run by browser)
  // it says to give this events to me anyway (give me these historical (past) events). It means that my function will not be run until the document is ready. So the fucntion asks for the events
  // that happened before the function itself started running

  // type:
  // is the type of event we are listening to


  // ----- 2 ------

  // this will go off multiple times
  // every time there is a paint event and it is the largest one so far in the process, the contentful-paint event will go of again

  // we need to measure: is the start time of  entry we've just got is bigger than of those we've captured before and if it is - we update it

  // because the first contentful paint is by definition is the largest contentful paint when it happens and every
  // subsequented paint will be measured if it's bigger that the one before

  var lcpObserver = new PerformanceObserver(function handleLCP(entryList) {
    var entries = entryList.getEntries() || [];
    entries.forEach(function(entry) {
      if (entry.startTime > data.lcp) {
        data.lcp = entry.startTime;
        console.log("Recorded LCP Performance: " + data.lcp);
      }
    });
  }).observe({ type: "largest-contentful-paint", buffered: true });

  // ----- 3 ------

  // it's not a paint event it's when the page is pushed around
  // every time when elements are shifted on the page we're gonna listen to the  "layout-shift" event

  var clsObserver = new PerformanceObserver(function handleCLS(entryList) {
    var entries = entryList.getEntries() || [];
    entries.forEach(function(entry) {
      if (!entry.hadRecentInput) { // make sure that this shift was not expected (expected means drop-down element - it is suposed to expand, loading image that shifts page down - is not expected). So ig there was a click event and the immidiate event loop proceding this layout shift, it will be flagged and we do not want to capture that.
        data.cls += entry.value;
        console.log("Increased CLS Performance: " + data.cls);
      }
    });
  }).observe({ type: "layout-shift", buffered: true });

   // ----- 4 ------

  // when did i start first calling events?
  // calling events in response to this click events? vs When does this click event actualy happen? That's the dalay between actual click and response to that click (processing our event handler based on it)

  // this matrics is only possible when the pesron does something on the page
  // if the user comes and leaves - there won't be any metrics

  var fidObserver = new PerformanceObserver(function handleFID(entryList) {
    var entries = entryList.getEntries() || [];
    entries.forEach(function(entry) {
      data.fid = entry.processingStart - entry.startTime;
      console.log("Recorded FID Performance: " + data.fid);
    });
  }).observe({ type: "first-input", buffered: true });

  window.addEventListener("beforeunload", function() {
    var navEntry = performance.getEntriesByType("navigation")[0];
    data.dcl = navEntry.domContentLoadedEventStart;
    data.load = navEntry.loadEventStart;

    var payload = JSON.stringify(data);
    navigator.sendBeacon("/api/perf", payload);
    console.log("Sending performance:", payload);
  });

});

// library - web vitals for this stuff

// YOU also need the bussiness analytics - bounce rate and session time
