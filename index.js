var qr = require('qr-image');
var fs = require('fs');
var os = require('os');
var express = require('express');
var open = require('open');
var parseString = require('xml2js').parseString;
var Finder = require('findit');
var app = express();

var ip, url, cordovaDirectory, opts;
var port = '4324';


module.exports = function(directory, options, callback) {
  opts = options || {};
  cordovaDirectory = directory;
  init(callback);
};

function createQrImage() {
  url = ip + ':' + port + '/download.apk';
  var code = qr.imageSync(url, {
    type: 'svg'
  });
  fs.writeFileSync('public/download.svg', code);
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

function createServer(apk, onScan) {
  app.use(express.static('public'));
  
  app.get('/qr', function(req, res) {
    deliverFile('public/download.svg', res, 'image/svg+xml');
  });
  
  app.get('/download.apk', function(req, res) {
    deliverFile(apk, res, 'application/vnd.android.package-archive');
    //server.close();
    onScan();
  });
  
  var server = app.listen(port, function() {
    var runningURL = 'http://127.0.0.1:' + port + '/download.html';
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
        console.log('Your physical IP address is ' + details.address);
        ip = details.address;
        return ip;
      }
    }
  }
}

function init(callback) {
  findApk(cordovaDirectory, function (err, apk) {
    if (err) return callback(err);
    
    ip = getIpAddress();
    createQrImage();
    createServer(apk, callback);
  });
}

function findApk(directory, callback) {
  var finder = Finder(directory || '.');
  var apk;
  
  finder.on('file', function (file, stat) {
  	if (file.match(/-debug-unaligned.apk$/)) {
  		apk = file;
		  finder.stop();
      callback(null, apk);
  	}
  });
  finder.on('end', function () {
    if (!apk) callback(new Error('No apk file found!'));
  });
}
