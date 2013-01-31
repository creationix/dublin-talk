
function stack(/*layers*/) {
  var error = stack.errorHandler,
      handle = error;
  Array.prototype.slice.call(arguments).reverse().forEach(function (layer) {
    var child = handle;
    handle = function (req, res) {
      try {
        layer(req, res, function (err) {
          if (err) { return error(req, res, err); }
          child(req, res);
        });
      } catch (err) {
        error(req, res, err);
      }
    };
  });
  return handle;
}

stack.errorHandler = function error(req, res, err) {
  if (err) {
    console.error(err.stack);
    res.writeHead(500, {"Content-Type": "text/plain"});
    res.end(err.stack + "\n");
    return;
  }
  res.writeHead(404, {"Content-Type": "text/plain"});
  res.end("Not Found\n");
};

////////////////////////////////////////////////////////////////////////////////

var urlParse = require('url').parse;

function greeter() {
  return function (req, res, next) {
    var pathname = urlParse(req.url).pathname;
    if (!(req.method === "GET" && pathname === "/")) return next();
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Content-Length": 12
    });
    res.end("Hello World\n");
  };
}

function logger() {
  return function (req, res, next) {
    console.log(req.method + " " + req.url);
    next();
  };
}

var handler = stack(logger(), greeter());

////////////////////////////////////////////////////////////////////////////////

var http = require('http');

var server = http.createServer(handler);

server.listen(8080, function () {
  console.log("Server listening at", server.address());
});
