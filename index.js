var express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	fs = require('fs'),
	favicon = require('serve-favicon'),
	Hashids = require('hashids'),
	hashids = new Hashids('', 8, 'abcdefghjkmnpqrstuvwxyz23456789'),
	low = require('lowdb'),
	db = low('db.json');

var default_conf = '[{"step":64,"red":{"from":255,"to":0},"green":{"from":0,"to":255},"blue":{"from":0,"to":0}},{"step":64,"red":{"from":0,"to":0},"green":{"from":255,"to":0},"blue":{"from":0,"to":255}},{"step":64,"red":{"from":0,"to":255},"green":{"from":0,"to":0},"blue":{"from":255,"to":0}}]';

db.defaults({
	posts: [{
		id: 1,
		conf: default_conf,
		hash: hashids.encode(1),
		timestamp: Date.now()
	}]
}).value();

app.use('/public', express.static('public'));
app.use('/vendor', express.static('bower_components'));
app.use(favicon(__dirname + '/public/favicon/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.engine('nti', function(filePath, options, callback) {
	fs.readFile(filePath, function(err, content) {
		if (err) {
			return callback(new Error(err));
		}
		var rendered = content.toString(),
			data = options.data || {};
		for (var i in data) {
			rendered = rendered.split('#' + i + '#').join(data[i]);
		}
		return callback(null, rendered);
	});
});
app.set('views', './views');
app.set('view engine', 'nti');

app.get('/:hash?', function(req, res) {
	var hash = req.params.hash,
		post = db.get('posts').find({
			hash: hash
		}).value();

	if (hash && !post) {
		return res.redirect('/');
	}
	if (!post) {
		post = db.get('posts').first().value();
	}

	return res.render('index', {
		data: {
			conf: JSON.stringify(JSON.parse(post.conf), null, 4)
		}
	});
});

app.post('/', function(req, res) {
	var posts = db.get('posts'),
		hash;

	try {
		var conf = JSON.stringify(JSON.parse(req.body.config || '{}'));
	} catch (e) {
		return res.status(422).json({
			'config': 'Must be a JSON formatted string!'
		}).end();
	}

	var post = posts.find({
		conf: conf
	}).value();

	if (post) {
		hash = post.hash;
	} else {
		var id = posts.size() + 1;
		hash = hashids.encode(id);

		posts.push({
			id: id,
			conf: conf,
			hash: hash,
			timestamp: Date.now()
		}).value();
	}

	return res.json({
		hash: hash
	}).end();
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
	console.log('App listening on port ' + port + '!');
});