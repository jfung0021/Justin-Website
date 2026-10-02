import katex from 'katex';
export const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function videoSource(value){
 if(/^\/uploads\/[a-f0-9-]+\.(mp4|webm|ogg)$/.test(value))return {src:value,embed:false};
 const url=new URL(value);if(url.protocol!=='https:')throw Error('Use an HTTPS video link.');
 if(['www.youtube.com','youtube.com','youtu.be'].includes(url.hostname)){const id=url.hostname==='youtu.be'?url.pathname.slice(1):url.searchParams.get('v')||url.pathname.split('/').pop();if(!/^[\w-]{11}$/.test(id||''))throw Error('Use a valid YouTube video link.');return {src:`https://www.youtube-nocookie.com/embed/${id}`,embed:true};}
 if(['vimeo.com','www.vimeo.com'].includes(url.hostname)){const id=url.pathname.split('/').pop();if(!/^\d+$/.test(id||''))throw Error('Use a valid Vimeo video link.');return {src:`https://player.vimeo.com/video/${id}`,embed:true};}
 if(!/\.(mp4|webm|ogg)$/i.test(url.pathname))throw Error('Use a YouTube, Vimeo, or direct MP4/WebM/OGG video link.');
 return {src:url.href,embed:false};
}
export function renderBlock(language,text){
 if(language==='notebook-math')return `<div class="equation-block">${katex.renderToString(text,{displayMode:true,throwOnError:true,trust:false,strict:'ignore'})}</div>`;
 if(language==='notebook-image'){const data=JSON.parse(text);let src=data.src;if(!/^\/uploads\/[a-f0-9-]+\.(png|jpg|jpeg|gif|webp)$/.test(src)){const url=new URL(src);if(url.protocol!=='https:')throw Error('Use an HTTPS image link.');src=url.href;}const width=Number(data.width??100);if(!Number.isFinite(width)||width<20||width>100)throw Error('Image width must be between 20% and 100%.');const align=data.align||'center';if(!['left','center','right'].includes(align))throw Error('Choose an image alignment.');const margin=align==='left'?'0 auto 0 0':align==='right'?'0 0 0 auto':'0 auto';return `<figure class="image-block" style="width:${width}%;margin:${margin}"><img src="${escapeHtml(src)}" alt="${escapeHtml(data.caption||'')}" loading="lazy" style="width:100%;height:auto"/></figure>`;}
 if(language==='notebook-video'){const data=JSON.parse(text);const {src,embed}=videoSource(data.src);const title=escapeHtml(data.caption||'Video');return `<figure class="video-block">${embed?`<iframe src="${escapeHtml(src)}" title="${title}" loading="lazy" allowfullscreen></iframe>`:`<video controls preload="metadata" src="${escapeHtml(src)}" aria-label="${title}">Your browser does not support this video. <a href="${escapeHtml(src)}">Open video</a></video>`}${data.caption?`<figcaption>${escapeHtml(data.caption)}</figcaption>`:''}</figure>`;}
 return null;
}
