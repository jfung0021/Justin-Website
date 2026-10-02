import { withBase } from '../src/lib/base-path.mjs';

// Runs after notebook blocks are rendered, without changing stored editor content.
export default function basePaths({ base }) {
  return tree => {
    function visit(node) {
      if (node.type === 'raw') {
        node.value = node.value.replace(/(\b(?:href|src|poster|action)\s*=\s*)(["'])(\/[^"']*)\2/gi, (_, attribute, quote, path) => attribute + quote + withBase(path, base) + quote);
      }
      if (node.properties) {
        for (const key of ['href', 'src', 'poster', 'action']) {
          if (typeof node.properties[key] === 'string') {
            node.properties[key] = withBase(node.properties[key], base);
          }
        }
        if (typeof node.properties.srcSet === 'string') {
          node.properties.srcSet = node.properties.srcSet.replace(/(^|,\s*)(\/[^\s,]+)/g, (_, separator, path) => separator + withBase(path, base));
        }
      }
      if (node.children) {
        node.children.forEach(visit);
      }
    }
    visit(tree);
  };
}
