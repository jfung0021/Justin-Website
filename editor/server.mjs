import {publishing} from './publishing.mjs';
import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {readFile,writeFile,readdir,mkdir,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import matter from 'gray-matter';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
process.env.ASTRO_TELEMETRY_DISABLED='1';
const postsDir=path.join(root,'src/content/posts');
const publication=publishing(root);
const token=randomBytes(32).toString('hex');
const identity=createHash('sha256').update(root).digest('hex');
const port=4318, origin=`http://127.0.0.1:${port}`;
const categories=['Markets & Trades','Research & Models','Learning Notes','Thinking'];
const types=['Note','Research','Trade Review','Essay','Working Paper'];
let siteUrl=null,siteError=null,astroServer=null,saving=false;
const hash=text=>createHash('sha256').update(text).digest('hex');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const validId=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]*\.(md|mdx)$/.test(id);
const openBrowser=()=>{ const child=spawn('explorer.exe',[origin],{windowsHide:true,stdio:'ignore'});child.on('error',()=>{});child.unref(); };
function send(res,status,value,type='application/json'){
 res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'});
 res.end(type==='application/json'?JSON.stringify(value):value);
}
async function readJson(req){let value='';for await(const chunk of req){value+=chunk;if(Buffer.byteLength(value)>2_000_000)throw fail(413,'This post is too large.');}try{return JSON.parse(value)}catch{throw fail(400,'Could not read this save request.');}}
const server=http.createServer(async(req,res)=>{
 try{
  if(req.headers.host!==`127.0.0.1:${port}`)throw fail(403,'Use the local editor address.');
  if(req.headers.origin&&req.headers.origin!==origin)throw fail(403,'This request did not come from the editor.');
  const url=new URL(req.url,origin);
  if(req.method==='GET'&&url.pathname==='/health')return send(res,200,{identity});
  if(req.method==='GET'&&url.pathname==='/'){
   const html=(await readFile(path.join(root,'editor/index.html'),'utf8')).replace('__SESSION_TOKEN__',token);
   return send(res,200,html,'text/html; charset=utf-8');
  }
  const assets={'/fonts/InterVariable.woff2':['public/fonts/InterVariable.woff2','font/woff2'],'/fonts/InterVariable-Italic.woff2':['public/fonts/InterVariable-Italic.woff2','font/woff2'],'/fonts/fonts.css':['public/fonts/fonts.css','text/css'],'/media.js':['editor/media.js','text/javascript'],'/vendor/katex.css':['node_modules/katex/dist/katex.min.css','text/css'],'/editor.js':['editor/app.js','text/javascript'],'/editor.css':['editor/style.css','text/css'],'/vendor/editor.js':['editor/vendor.js','text/javascript'],'/vendor/editor.css':['node_modules/@toast-ui/editor/dist/toastui-editor.css','text/css']};
  if(req.method==='GET'&&assets[url.pathname]){const [file,type]=assets[url.pathname];return send(res,200,await readFile(path.join(root,file)),type);}
  if(req.method==='GET'&&/^\/vendor\/fonts\/[A-Za-z0-9_-]+\.(woff2?|ttf)$/.test(url.pathname))return send(res,200,await readFile(path.join(root,'node_modules/katex/dist/fonts',path.basename(url.pathname))),url.pathname.endsWith('.woff2')?'font/woff2':'font/woff');
  if(req.method==='GET'&&/^\/uploads\/[a-f0-9-]+\.(png|jpg|jpeg|gif|webp|mp4|webm|ogg)$/.test(url.pathname)){
   const file=path.join(root,'public',url.pathname.slice(1));const info=await stat(file);const ext=path.extname(file).slice(1);const mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',mp4:'video/mp4',webm:'video/webm',ogg:'video/ogg'}[ext];let start=0,end=info.size-1;const range=req.headers.range;
   if(range){const match=/^bytes=(\d+)-(\d*)$/.exec(range);if(!match)throw fail(416,'Invalid range.');start=Number(match[1]);end=match[2]?Number(match[2]):end;if(start>end||end>=info.size)throw fail(416,'Invalid range.');}
   res.writeHead(range?206:200,{'Content-Type':mime,'Accept-Ranges':'bytes','Content-Length':end-start+1,...(range?{'Content-Range':`bytes ${start}-${end}/${info.size}`}:{})});createReadStream(file,{start,end}).pipe(res);return;
  }
  if(url.pathname.startsWith('/api/')&&req.headers['x-editor-token']!==token)throw fail(403,'Reload the editor and try again.');
  if(req.method==='GET'&&url.pathname==='/api/status')return send(res,200,{siteUrl,siteError});
  if(req.method==='GET'&&url.pathname==='/api/posts'){
   const items=await publication.list();
   return send(res,200,items.sort((a,b)=>b.date.localeCompare(a.date)));
  }
  if(req.method==='POST'&&url.pathname==='/api/upload'){
   let name;try{name=decodeURIComponent(req.headers['x-file-name']||'');}catch{throw fail(400,'Invalid filename.');}const ext=path.extname(name).toLowerCase();if(!['.png','.jpg','.jpeg','.gif','.webp','.mp4','.webm','.ogg'].includes(ext))throw fail(400,'Choose PNG, JPG, GIF, WebP, MP4, WebM, or OGG.');
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>100*1024*1024)throw fail(413,'Choose a file smaller than 100 MB.');chunks.push(chunk);}const bytes=Buffer.concat(chunks);const magic=bytes.subarray(0,16);const valid={'.png':magic.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'.jpg':magic[0]===255&&magic[1]===216,'.jpeg':magic[0]===255&&magic[1]===216,'.gif':magic.toString('ascii',0,3)==='GIF','.webp':magic.toString('ascii',0,4)==='RIFF'&&magic.toString('ascii',8,12)==='WEBP','.mp4':magic.toString('ascii',4,8)==='ftyp','.webm':magic.subarray(0,4).equals(Buffer.from([26,69,223,163])),'.ogg':magic.toString('ascii',0,4)==='OggS'}[ext];if(!valid)throw fail(400,'The file content does not match its format.');await mkdir(path.join(root,'public/uploads'),{recursive:true});const filename=randomBytes(16).toString('hex')+ext;await writeFile(path.join(root,'public/uploads',filename),bytes,{flag:'wx'});return send(res,200,{url:'/uploads/'+filename});
  }
  if(req.method==='POST'&&url.pathname==='/api/save'){
   if(saving)throw fail(409,'Another save is in progress. Please try again.');saving=true;
   try{return send(res,200,await publication.save(await readJson(req)));}finally{saving=false;}
  }
  if(req.method==='GET'&&url.pathname==='/api/appearance')return send(res,200,JSON.parse(await readFile(path.join(root,'src/data/appearance.json'),'utf8')));
  if(req.method==='POST'&&url.pathname==='/api/appearance'){
   const data=await readJson(req);if(!['Inter','Arial','Segoe UI'].includes(data.font)||!Number.isInteger(data.size)||data.size<16||data.size>26)throw fail(400,'Choose an available font and a size between 16 and 26.');
   const file=path.join(root,'src/data/appearance.json');const old=await readFile(file,'utf8');await mkdir(path.join(root,'.editor-backups'),{recursive:true});await writeFile(path.join(root,'.editor-backups',Date.now()+'-appearance.json'),old);const tmp=file+'.tmp';await writeFile(tmp,JSON.stringify({font:data.font,size:data.size}));await rename(tmp,file);return send(res,200,data);
  }
  if(req.method==='POST'&&url.pathname==='/api/stop'){send(res,200,{ok:true});setTimeout(async()=>{await astroServer?.stop();server.close(()=>process.exit(0));},150);return;}
  throw fail(404,'Not found.');
 }catch(error){console.error(error);send(res,error.status||(error.code==='ENOENT'?404:500),{error:error.status?error.message:'Could not complete the request. Your changes have not been discarded.'});}
});
server.on('error',async error=>{
 if(error.code==='EADDRINUSE'){try{const response=await fetch(origin+'/health');if((await response.json()).identity===identity){if(process.argv.includes('--open'))openBrowser();process.exit(0);}}catch{}}
 console.error('Editor could not start:',error);process.exit(1);
});
server.listen(port,'127.0.0.1',async()=>{
 console.log(`Editor ready: ${origin}`);if(process.argv.includes('--open'))openBrowser();
 try{const {dev}=await import('astro');astroServer=await dev({cacheDir:'./.editor-runtime/astro-cache',vite:{cacheDir:'.editor-runtime/vite-cache'},server:{host:'127.0.0.1',port:4322},devToolbar:{enabled:false}});siteUrl=`http://127.0.0.1:${astroServer.address.port}`;console.log(`Website ready: ${siteUrl}`);}catch(error){siteError='The website preview could not start. You can still edit and save posts. See .editor-runtime/server.log for details.';console.error(error);}
});


