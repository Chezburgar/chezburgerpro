/*global Ultraviolet*/
// Ultraviolet config. Every path is derived from this service worker's own
// location, so the proxy keeps working under any base path (the site is served
// from /chezburgerpro/ on GitHub Pages, but from / in some local setups).
(() => {
  const dir = new URL('./', self.location.href).pathname;
  self.__uv$config = {
    prefix: dir + 'service/',
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: dir + 'uv.handler.js',
    client: dir + 'uv.client.js',
    bundle: dir + 'uv.bundle.js',
    config: dir + 'uv.config.js',
    sw: dir + 'uv.sw.js',
  };
})();
