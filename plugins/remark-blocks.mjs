import {fromHtml} from 'hast-util-from-html';
import {renderBlock} from '../editor/blocks.mjs';
export default function notebookBlocks(){return tree=>{function visit(node){if(node.type==='code'&&['notebook-video','notebook-math','notebook-image'].includes(node.lang)){const children=fromHtml(renderBlock(node.lang,node.value),{fragment:true}).children;node.type='notebookEmbed';node.data={hName:'div',hChildren:children};delete node.value;delete node.lang;delete node.meta;}if(node.children)node.children.forEach(visit);}visit(tree);};}
