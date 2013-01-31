var urlParse = require('url').parse;

function handler(req, res) {
  console.log(req.method + " " + req.url);

  var pathname = urlParse(req.url).pathname;
  if (req.method === "GET" && pathname === "/") {
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Content-Length": 12
    });
    res.end("Hello World\n");
  }
  else {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.end("Not Found\n");
  }
}

////////////////////////////////////////////////////////////////////////////////

var http = require('http');

var server = http.createServer(handler);

server.listen(8080, function () {
  console.log("Server listening at", server.address());
});
