(function () {
  var timeout;
  var last_fix;

  var resetLastFix = function() {
    last_fix = {
      fix: 0,
      alt: 0,
      lat: 0,
      lon: 0,
      speed: 0,
      time: 0,
      course: 0,
      satellites: 0
    };
  };
  
  var formatTime = function(now) {
    try {
      var fd = now.toUTCString().split(" ");
      return fd[4];
    } catch (e) {
      return "00:00:00";
    }
  };

  var onGPS = function(fix) {
    console.log(fix);
    last_fix.time = fix.time;

    // we got a fix
    if (fix.fix) {
      last_fix = fix;
      // cancel the timeout, if not already timed out
      if (this.timeout) {
	clearTimeout(timeout);
	this.timeout = undefined;
      }
      // power off the GPS
      Bangle.setGPSPower(0,"clkinfo");
      // power on the GPS again in 3 minutes
      timeout = setTimeout(function() {
	timeout = undefined;
	Bangle.setGPSPower(1,"clkinfo");
      }, 180000);
    }
    info.items[0].emit("redraw"); 
  };

  var gpsText = function() {
    if (last_fix === undefined)
      return '----- , -----';

    if (!last_fix.fix) 
      return formatTime(last_fix.time);
    
    // use basic lat,lon for now
    return last_fix.lat.toFixed(3) + ' , ' + last_fix.lon.toFixed(3);
  };
  
  var info = {
    name: "Gps",
    items: [
      {
        name: "gridref",
        get: function () { return ({
          text: gpsText()
        }); },
	run : function() {
          Bangle.setGPSPower(1,"clkinfo");
          /* turn off after 5 minutes, sooner if we get a fix */
          this.timeout = setTimeout(function() {
            this.timeout = undefined;
            Bangle.setGPSPower(0,"clkinfo");
          }, 300000);
	},
        show: function () {
          resetLastFix();
	  Bangle.on("GPS",onGPS);
	  this.run();
        },
        hide: function() {
          Bangle.setGPSPower(0,"clkinfo");
          Bangle.removeListener("GPS", onGPS);
          if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
          }
          resetLastFix();
        }
      }
    ]
  };

  return info;
});
