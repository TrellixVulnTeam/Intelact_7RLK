'use strict'

const express = require('express');
const app = express();
const router = express.Router();

app.use(express.static(__dirname + '/public'));
app.use('/',require('./router.js'))


app.get("/", function(req, res) {
    res.sendFile('public/index.html')
 });

if(module == require.main) {
	const server = app.listen(8080, () => {
		const port = server.address().port;
		console.log('App listening on port ' + port);
	});
}

module.exports = app;


