var qr = require('qr-image');
var fs = require('fs');
var os = require('os');
var express = require('express');
var open = require('open');
var parseString = require('xml2js').parseString;
var finder = require('findit');
var app = express();

var ip, url, appName, cordovaDirectory, opts;
var port = '4324';


module.exports = function(directory, options, callback) {
  opts = options || {};
  cordovaDirectory = directory;
  init(callback);
};

function getAppName(configFile, callback) {
	try {
		var configXML = fs.readFileSync(configFile, {
			encoding: 'utf8'
		});

		parseString(configXML, function(err, config) {
			appName = config.widget.name[0];
            callback(null, appName);
		});
	}
    catch (e) {
        callback(e);
    }
}

function createQrImage() {
  url = ip + ':' + port + '/' + appName + '.apk';
  var code = qr.imageSync(url, {
    type: 'svg'
  });
  fs.writeFileSync('download.svg', code);
}

function deliverFile(fileName, res, type) {
  fs.readFile(fileName, function(err, content) {
    if (err) {
      console.log(err);
      res.writeHead(500);
      res.end();
    } else {
      res.writeHead(200, {
        'Content-Type': type
      });
      res.end(content, 'utf-8');
    }
  });
}

function createServer(onScan) {
  app.get('/qr', function(req, res) {
    deliverFile('download.svg', res, 'image/svg+xml');
  });
  
  app.get('/' + appName + '.apk', function(req, res) {
    console.log('scanned');
    deliverFile(cordovaDirectory + 'platforms/android/ant-build/' + appName + '-debug-unaligned.apk', res, 'application/vnd.android.package-archive');
    server.close();
    onScan();
  });
  
  var server = app.listen(port, function() {
    var runningURL = 'http://127.0.0.1:' + port + '/qr';
    if (!opts.dontOpen) {
      open(runningURL, function(err) {
        if (err) {
          console.log('View the QR in a browser at ' + runningURL);
        }
      });
    } else {
      console.log('View the QR in a browser at ' + runningURL);
    }
  });
}

function getIpAddress() {
  var ifaces = os.networkInterfaces();
  var ip;
  for (var i in ifaces) {
    var dev = ifaces[i];
    for (var n = 0, l = dev.length; n < l; n++) {
      var details = dev[n];
      if (details.family === 'IPv4' && !details.internal && details.address !=='127.0.0.1') {
        console.log('Your physal IP address is ' + details.address);
        ip = details.address;
        return ip;
      }
    }
  }
}

function init(callback) {
  findConfig(cordovaDirectory, function (err, config) {
    if (err) return callback(err);
    
    getAppName(config, function (err, appName) {
      if (err) return callback(err);
      
      ip = getIpAddress();
      createQrImage();
      createServer(callback);
    });

  });
}

function findConfig(directory, callback) {
  finder = finder(directory || '.');
    
  var configs = [];
  var config;
  
  finder.on('file', function (file, stat) {
  	if (file.match(/config\.xml$/)) {
  		config = file;
  		finder.stop();
          callback(null, file);
  	}
  });
  finder.on('end', function () {
  	if (configs.length === 0) return callback(new Error('No config file found!'));
  });
}
