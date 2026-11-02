// Minimal browser shim for zlib in mobile web bundle
module.exports = {
  gunzip: (buf, cb) => cb(new Error('gunzip not supported on mobile shim'), null),
  gzip: (buf, cb) => cb(new Error('gzip not supported on mobile shim'), null),
  deflate: (buf, cb) => cb(new Error('deflate not supported on mobile shim'), null),
  inflate: (buf, cb) => cb(new Error('inflate not supported on mobile shim'), null),
};
