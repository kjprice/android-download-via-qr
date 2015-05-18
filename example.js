var qr = require('./index');

qr('cordova/',{dontOpen:false}, function(err) {
	if (err) return console.log(err);
	
	console.log('Great Success!');
});