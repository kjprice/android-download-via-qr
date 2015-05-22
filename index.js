var qr = require('qr-image');
var fs = require('fs');
var os = require('os');
var http = require('http');
var express = require('express');
var open = require('open');
var parseString = require('xml2js').parseString;
var Finder = require('findit');
var app = module.exports.app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

var ip, url, cordovaDirectory, opts, userSocket;
var port = '4324';

module.exports = function(directory, options, callback) {
  opts = options || {};
  cordovaDirectory = directory;
  init(callback);
};

io.on('connection', function (socket) {
  if (!userSocket)
    userSocket = socket;
});

function createQrImage(callback) {
  url = ip + ':' + port + '/download.apk';
  var code = qr.imageSync(url, {
    type: 'svg'
  });
  callback && callback(code);
}

function createServer(apk, onScan) {
  app.use(express.static(__dirname + '/public'));
  
  app.get('/qr', function(req, res) {
    createQrImage(function (content) {
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml'
      });
      res.end(content, 'utf-8');
    });
    
  });
  
  app.get('/download.apk', function(req, res) {
    res.download(apk, 'application/vnd.android.package-archive', function (err){
      if (err) { return console.log(err); }
      onScan();
      process.exit();
    });
    userSocket.emit('userScanned');
  });
  
  
  server.listen(port, function() {
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
