import {readFile,writeFile,readdir,mkdir,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import matter from 'gray-matter';
const hash=s=>createHash('sha256').update(s).digest('hex');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const valid=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]*\.(md|mdx)$/.test(id);
const optional=async file=>{try{return await readFile(file,'utf8')}catch(e){if(e.code==='ENOENT')return null;throw e;}};
export function publishing(root){
 const liveDir=path.join(root,'src/content/posts'),draftDir=path.join(root,'.editor-drafts');
 async function files(dir){try{return (await readdir(dir)).filter(valid)}catch(e){if(e.code==='ENOENT')return [];throw e;}}
 async function state(id){if(!valid(id))throw fail(400,'Invalid post name.');const live=await optional(path.join(liveDir,id)),draft=await optional(path.join(draftDir,id));return {live,draft,revision:hash(JSON.stringify([live,draft]))};}
 async function get(id){const s=await state(id);if(!s.live&&!s.draft)throw fail(404,'Post not found.');const parsed=matter(s.draft??s.live);const {_publishedRevision,...data}=parsed.data;return {...data,id,date:new Date(data.date).toISOString().slice(0,10),body:parsed.content.trimStart(),revision:s.revision,published:Boolean(s.live),hasDraft:Boolean(s.draft)};}
 async function list(){const ids=[...new Set([...(await files(liveDir)),...(await files(draftDir))])];return (await Promise.all(ids.map(get))).sort((a,b)=>b.date.localeCompare(a.date));}
 async function atomic(dir,id,text){await mkdir(dir,{recursive:true});const tmp=path.join(dir,`.save-${randomBytes(8).toString('hex')}.tmp`);await writeFile(tmp,text,{flag:'wx'});await rename(tmp,path.join(dir,id));}
 async function backup(id,text){if(text===null)return;const dir=path.join(root,'.editor-backups');await mkdir(dir,{recursive:true});await writeFile(path.join(dir,`${Date.now()}-${randomBytes(4).toString('hex')}-${id}`),text,{flag:'wx'});}
 async function save(data){
  if(!['draft','publish','update'].includes(data.action))throw fail(400,'Choose Save draft, Publish, or Update post.');
  if(typeof data.title!=='string'||data.title.length>200)throw fail(400,'Keep the title under 200 characters.');
  if(typeof data.description!=='string'||data.description.length>1000)throw fail(400,'Keep the description under 1,000 characters.');
  if(typeof data.body!=='string')throw fail(400,'Invalid post text.');
  if(data.action!=='draft'&&(!data.title.trim()||!data.description.trim()||!data.body.trim()))throw fail(400,'Add a title, description, and body before publishing.');
  if(!['Markets & Trades','Research & Models','Learning Notes','Thinking'].includes(data.category)||!['Note','Research','Trade Review','Essay','Working Paper'].includes(data.type))throw fail(400,'Choose a category and label.');
  if(typeof data.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||!Number.isFinite(Date.parse(data.date))||new Date(data.date).toISOString().slice(0,10)!==data.date)throw fail(400,'Choose a valid date.');
  if(!Array.isArray(data.tags)||data.tags.length>15||data.tags.some(t=>typeof t!=='string'||t.trim().length>40))throw fail(400,'Use up to 15 tags, each under 40 characters.');
  let id=data.id;
  if(!id){const stem=data.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'untitled';id=stem+'.md';const names=[...(await files(liveDir)),...(await files(draftDir))];let n=2;while(names.includes(id)||names.includes(id.replace(/\.md$/,'.mdx')))id=`${stem}-${n++}.md`;}
  const s=await state(id);if(data.id&&s.revision!==data.revision)throw fail(409,'This post changed elsewhere. Copy your unsaved text before reloading to review the other version.');
  if(data.action==='publish'&&s.live)throw fail(409,'This post is already published. Use Update post.');
  if(data.action==='update'&&!s.live)throw fail(409,'This post has not been published. Use Publish.');
  const previous=matter(s.draft??s.live??'').data;
  if(data.action!=='draft'&&s.draft&&previous._publishedRevision!==hash(s.live||''))throw fail(409,'The published post changed after this draft was created. Review the published file before updating. Your draft is safe.');
  const {_publishedRevision,...rest}=previous;
  const metadata={...rest,title:data.title.trim()||'Untitled draft',date:data.date,category:data.category,description:data.description.trim(),type:data.type,example:Boolean(data.example),showToc:data.showToc!==false,tags:[...new Set(data.tags.map(t=>t.trim()).filter(Boolean))]};
  if(data.action==='draft'){
   metadata._publishedRevision=_publishedRevision??hash(s.live||'');
   await backup(id,s.draft);await atomic(draftDir,id,matter.stringify(data.body,metadata));
  }else{
   await backup(id,s.live);await atomic(liveDir,id,matter.stringify(data.body,metadata));
   if(s.draft)await unlink(path.join(draftDir,id));
  }
  return get(id);
 }
 return {get,list,save};
}
