import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
const root = new URL('.', import.meta.url).pathname;
const TYPES={'.json':'application/json','.webp':'image/webp'};
createServer((q,s)=>{
  const p=join(root, decodeURIComponent(q.url.split('?')[0]));
  s.setHeader('Access-Control-Allow-Origin','*');
  if(!p.startsWith(root)||!existsSync(p)||statSync(p).isDirectory()){s.writeHead(404);s.end('nf');return;}
  s.writeHead(200,{'content-type':TYPES[extname(p)]||'application/octet-stream'});
  s.end(readFileSync(p));
}).listen(8200,()=>console.log('badges data on :8200'));
