const el=id=>document.getElementById(id);
export function mediaPlugin(){return {
 wysiwygCommands:{insertNotebookBlock(payload,state,dispatch){const node=state.schema.nodes.codeBlock.create({language:payload.language},state.schema.text(payload.text));dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());return true;}},
 wysiwygNodeViews:{image(node,view,getPos){const dom=document.createElement('span');dom.className='notebook-inline-image';dom.contentEditable='false';const img=document.createElement('img');img.src=node.attrs.imageUrl;img.alt=node.attrs.altText||'';const edit=document.createElement('button');edit.type='button';edit.textContent='Edit image';edit.onclick=()=>document.dispatchEvent(new CustomEvent('edit-notebook-block',{detail:{language:'notebook-image',text:JSON.stringify({src:node.attrs.imageUrl,caption:node.attrs.altText||'',width:100,align:'center'}),replace(text){const pos=getPos();const block=view.state.schema.nodes.codeBlock.create({language:'notebook-image'},view.state.schema.text(text));view.dispatch(view.state.tr.replaceRangeWith(pos,pos+node.nodeSize,block));}}}));dom.append(img,edit);return {dom,stopEvent:e=>e.target.closest('button')!==null,ignoreMutation:()=>true};},codeBlock(node,view,getPos){
  const custom=['notebook-video','notebook-math','notebook-image'].includes(node.attrs.language);
  if(!custom){const dom=document.createElement('pre'),contentDOM=document.createElement('code');dom.append(contentDOM);return {dom,contentDOM};}
  const dom=document.createElement('div');dom.className='notebook-embed';dom.contentEditable='false';
  const preview=document.createElement('div');try{preview.innerHTML=window.notebookBlocks.renderBlock(node.attrs.language,node.textContent);}catch{preview.textContent='This block needs a correction. Select Edit.';}
  const edit=document.createElement('button');edit.type='button';edit.textContent=node.attrs.language==='notebook-math'?'Edit equation':node.attrs.language==='notebook-image'?'Edit image':'Edit video';
  edit.onclick=()=>{document.dispatchEvent(new CustomEvent('edit-notebook-block',{detail:{language:node.attrs.language,text:node.textContent,replace(text){const pos=getPos();view.dispatch(view.state.tr.replaceWith(pos,pos+node.nodeSize,node.type.create(node.attrs,view.state.schema.text(text))));}}}));};
  dom.append(preview,edit);return {dom,stopEvent:e=>e.target.closest('button,video,iframe')!==null,ignoreMutation:()=>true};
 }}
};}
export function setupMedia({editor,getSourceMode,markBodyChanged,message,token}){
 let kind='image',selection=null,replace=null;
 const dialog=el('insert-dialog');
 function open(type,existing){kind=type;replace=existing?.replace||null;selection=getSourceMode()?[el('source').selectionStart,el('source').selectionEnd]:editor.getSelection();el('insert-title').textContent=`Insert ${type}`;el('media-fields').hidden=type==='equation';el('equation-fields').hidden=type!=='equation';el('image-options').hidden=type!=='image';el('image-width').value='100';el('image-width-label').textContent='100%';el('image-align').value='center';el('media-file').accept=type==='image'?'image/png,image/jpeg,image/gif,image/webp':'video/mp4,video/webm,video/ogg';el('media-file').value='';el('media-url').value='';el('media-caption').value='';el('latex').value='';el('insert-error').textContent='';el('math-preview').replaceChildren();if(existing){if(type==='equation')el('latex').value=existing.text;else {const data=JSON.parse(existing.text);el('media-url').value=data.src;el('media-caption').value=data.caption||'';el('image-width').value=data.width||100;el('image-width-label').textContent=(data.width||100)+'%';el('image-align').value=data.align||'center';}}dialog.showModal();(type==='equation'?el('latex'):el('media-url')).focus();previewMath();}
 for(const type of ['image','video','equation'])el(`insert-${type}`).onclick=()=>open(type);
 el('insert-cancel').onclick=()=>dialog.close();
 document.addEventListener('edit-notebook-block',e=>open(e.detail.language==='notebook-math'?'equation':e.detail.language==='notebook-image'?'image':'video',e.detail));
 function previewMath(){try{el('math-preview').innerHTML=window.notebookBlocks.renderBlock('notebook-math',el('latex').value||'x');el('insert-error').textContent='';}catch{el('math-preview').textContent='Check your LaTeX expression.';}}
 el('latex').oninput=previewMath;el('image-width').oninput=()=>{el('image-width-label').textContent=el('image-width').value+'%';};
 el('insert-form').onsubmit=async event=>{
  event.preventDefault();el('insert-confirm').disabled=true;el('insert-error').textContent='';
  try{
   let language,text,src=el('media-url').value.trim(),caption=el('media-caption').value.trim();
   if(kind==='equation'){text=el('latex').value.trim();if(!text)throw Error('Enter an equation.');window.notebookBlocks.renderBlock('notebook-math',text);language='notebook-math';}
   else {
    const file=el('media-file').files[0];
    if(file){if(file.size>100*1024*1024)throw Error('Choose a file smaller than 100 MB.');const r=await fetch('/api/upload',{method:'POST',headers:{'X-Editor-Token':token,'X-File-Name':encodeURIComponent(file.name)},body:file});const data=await r.json();if(!r.ok)throw Error(data.error);src=data.url;}
    if(!src)throw Error('Choose a file or paste a link.');
    if(kind==='video'){language='notebook-video';text=JSON.stringify({src,caption});window.notebookBlocks.renderBlock(language,text);}
    else {if(!/^\/uploads\/[a-f0-9-]+\.(png|jpg|jpeg|gif|webp)$/.test(src)){const url=new URL(src);if(url.protocol!=='https:')throw Error('Use an HTTPS image URL.');src=url.href;}if(!caption)throw Error('Add a short image description for readers.');}
   }
   if(kind==='image'){language='notebook-image';text=JSON.stringify({src,caption,width:Number(el('image-width').value),align:el('image-align').value});window.notebookBlocks.renderBlock(language,text);}
   if(replace)replace(text);
   else if(getSourceMode()){const input=el('source');const content=`\n\n\`\`\`${language}\n${text}\n\`\`\`\n\n`;input.setRangeText(content,selection[0],selection[1],'end');}
   else {editor.focus();editor.setSelection(...selection);editor.exec('insertNotebookBlock',{language,text});}
   markBodyChanged();dialog.close();message('Inserted. Save draft to keep working, or publish when ready.');
  }catch(error){el('insert-error').textContent=error.message;}finally{el('insert-confirm').disabled=false;}
 };
}

