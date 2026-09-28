// Minimal static server for one directory, with HTTP Range support (Safari/iOS need 206 for MP4).
// Usage: node serve.cjs <dir> <port>   (binds 127.0.0.1 only; expose via a tunnel)
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || '.'), port = Number(process.argv[3] || 8791);
const types = { '.html': 'text/html; charset=utf-8', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.vtt': 'text/vtt', '.srt': 'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const p = path.join(root, rel);
  if (!p.startsWith(root + path.sep) || rel.split('/').some(s => s.startsWith('.')) || !fs.existsSync(p) || !fs.statSync(p).isFile()) {
    res.writeHead(404).end('not found'); return;
  }
  const size = fs.statSync(p).size, type = types[path.extname(p).toLowerCase()] || 'application/octet-stream';
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (m && (m[1] || m[2])) {
    const start = m[1] ? +m[1] : size - +m[2], end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
    if (start >= size || start > end || start < 0) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return; }
    res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    fs.createReadStream(p, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size });
    fs.createReadStream(p).pipe(res);
  }
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} on 127.0.0.1:${port}`));
