









////////////////////////////////////////////////////////////////////////////////
//
//                  C O N T I N U A B L E    S T R E A M
//
////////////////////////////////////////////////////////////////////////////////





// Streams based around continuable async functions.
// WARNING: This API is in heavy experimentation flux!



















////////////////////////////////////////////////////////////////////////////////
// Creating a readable node stream

function MyReadable() {
  Stream.call(this);
  // We need to emit "data", "end", "error", and "close" events.
}
util.inherits(MyReadable, Stream);
MyReadable.prototype.readable = true;
MyReadable.prototype.pause = function () {
  // Implement pausing.
};
MyReadable.prototype.resume = function () {
  // Implement resuming.
};
MyReadable.prototype.destroy = function () {
  // Implement destroying.
};
MyReadable.prototype.setEncoding = function (encoding) {
  // Implement setting encoding.
};
var readable = new MyReadable();







////////////////////////////////////////////////////////////////////////////////
// Creating a writable node stream

function MyWritable() {
  Stream.call(this);
  // We need to emit "drain", "error", "close", and "pipe" events.
}
util.inherits(MyWritable, Stream);
MyWritable.prototype.writable = true;
MyWritable.prototype.write = function (stringOrBuffer, encoding) {
  // Write the string or buffer
  // return `false` if the writer needs to pause.
};
MyWritable.prototype.end = function (stringOrBuffer, encoding) {
  // Write the string or buffer if there is one
  // close the stream
};
MyWritable.prototype.destroy = function () {
  // Destroy your stream now
};
MyWritable.prototype.destroySoon = function () {
  // Destroy your stream after the pending operations are done.
};
var writable = new MyWritable();








////////////////////////////////////////////////////////////////////////////////
// Piping from a readable node stream to a writable stream


var readable = fs.createReadStream("/path/to/file");
var writable = fs.createWriteStream("/path/to/copy");
readable.pipe(writable);



// But what does .pipe() do and what if I need to modify it slightly?!

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (this.listeners('error').length === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};













////////////////////////////////////////////////////////////////////////////////
// Creating a continuable readable stream.

var stream = {
  read: function (encoding) { return function (onDone, onError) {
    // Encoding is optional.
    // get data and then call onDone when the chunk is ready.
    // call onDone with nothing to signify EOS
    // or call onError if there is a problem.
  }}
}















////////////////////////////////////////////////////////////////////////////////
// Creating a continuable writable stream.

var stream = {
  write: function (data, encoding) { return function (onDone, onError) {
    // Write data to stream.
    // null data means end of stream.
    // Encoding is optional.
    // call onDone when you're ready to receive more writes.  Can be as soon
    // as nextTick if the queue is not full.
    // or call onError if there is a problem.
  }}
}





































////////////////////////////////////////////////////////////////////////////////
// Piping from a readable continuable stream to a writable stream without
// generators.


var readable = fs.createReadStream("/path/to/file");
var writable = fs.createWriteStream("/path/to/copy");

pipe(readable, writable)(function () {
  console.log("Write finished");
});




function pipe(readable, writable) { return (onDone, onError) {
  readable.read()(onRead, onError);

  function onRead(chunk) {
    writable.write(chunk)(chunk ? onWrite : onDone, onError);
  }

  function onWrite() {
    readable.read()(onRead, onError);
  }
}}












////////////////////////////////////////////////////////////////////////////////
// Piping from a readable continuable stream to a writable stream with generators

var readable = fs.createReadStream("/path/to/file");
var writable = fs.createWriteStream("/path/to/copy");

do {
  var chunk = await(readable.read());
  await(writable.write(chunk));
} while (chunk);

console.log("Write finished");
