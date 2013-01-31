









////////////////////////////////////////////////////////////////////////////////
//
//                        C O N T I N U A B L E S
//
////////////////////////////////////////////////////////////////////////////////





// Continuables are a middle ground between node style callbacks and bull-blown
// promises.
// WARNING: This API is in heavy experimentation











////////////////////////////////////////////////////////////////////////////////
// Serial async tasks using node-style callbacks.
// Closures and nesting make this easier, but it's still tangled.

function readFile(path, callback) {
  fs.open(path, "r", function (err, fd) {
    if (err) return callback(err);
    var offset = 0, parts = [];
    (function read() {
      fs.read(fd, offset, 1024, function (err, chunk) {
        if (err) return callback(err);
        if (chunk) {
          parts.push(chunk);
          offset += chunk.length;
          read();
        }
        else {
          fs.close(fd, function (err) {
            if (err) return callback(err);
            callback(null, Buffer.concat(parts, offset));
          });
        }
      });
    }());
  });
}




////////////////////////////////////////////////////////////////////////////////
// If the closure variables aren't needed, you can use named functions to
// flatten it some.

function readFile(path, callback) {
  var fd, offset = 0, parts = [];

  fs.open(path, "r", onOpen);

  function onOpen(err, result) {
    if (err) return callback(err);
    fd = result;
    fs.read(fd, offset, 1024, onRead);
  }

  function onRead(err, chunk) {
    if (err) return callback(err);
    if (!chunk) {
      fs.close(fd, onClose);
    } else {
      parts.push(chunk);
      offset += chunk.length;
      fs.read(fd, offset, 1024, onRead);
    }
  }

  function onClose(err) {
    if (err) return callback(err);
    callback(null, Buffer.concat(parts, offset));
  }
}


////////////////////////////////////////////////////////////////////////////////
// With a helper function we can abstract the error handling.
// But that's not really any better is it?

function readFile(path, callback) {
  var fd, offset = 0, parts = [];
  fs.open(path, "r", check(onOpen));

  function onOpen(result) {
    fd = result;
    fs.read(fd, offset, 1024, check(onRead));
  }

  function onRead(chunk) {
    if (!chunk) {
      fs.close(fd, check(onClose));
    } else {
      parts.push(chunk);
      offset += chunk.length;
      fs.read(fd, offset, 1024, check(onRead));
    }
  }

  function onClose(err) {
    callback(null, Buffer.concat(parts, offset));
  }

  function check(fn) { return function (err) {
    if (err) return callback(err);
    return fn.apply(this, Array.prototype.slice.call(arguments, 1));
  }}
}


////////////////////////////////////////////////////////////////////////////////
// With promises we add a new abstraction that helps a lot, but is there
// something in between promises and node callbacks.  Welcome to Continuables

function readFile(path) { return function (onDone, onError) {
  var fd, offset = 0, parts = [];

  fs.open(path, "r")(onOpen, onError);

  function onOpen(result) {
    fd = result;
    fs.read(fd, offset, 1024)(onRead, onError);
  }

  function onRead(chunk) {
    if (!chunk) {
      fs.close(fd)(onClose, onError);
    } else {
      parts.push(chunk);
      offset += chunk.length;
      fs.read(fd, offset, 1024)(onRead, onError);
    }
  }

  function onClose() {
    onDone(Buffer.concat(parts, offset));
  }
}}






/*
# Benefits

 - Optional args in function calls don't have to worry about callback at the end.
 - You can use the returned function as a value and pass it around.
 - Error handling can be delegated directly.
 - When the language gets coroutines or generators, we can do faux blocking!
 - Simpler than promises, but almost as good.
 - See http://howtonode.org/do-it-fast for ideas I had years ago on this.

*/

