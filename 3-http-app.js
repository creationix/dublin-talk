var urlParse = require('url').parse;

function handler(req, res) {
  var pathname = urlParse(req.url).pathname;
  if (req.method === "GET" && pathname === "/") {
    log(req, 200);
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Content-Length": 12
    });
    res.end("Hello World\n");
  }
  else {
    log(req, 404);
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.end("Not Found\n");
  }
}

function log(req, code) {
  console.log(req.method + " " + req.url + " " + code);
}

////////////////////////////////////////////////////////////////////////////////

var http = require('http');

var server = http.createServer(handler);

server.listen(8080, function () {
  console.log("Server listening at", server.address());
});
