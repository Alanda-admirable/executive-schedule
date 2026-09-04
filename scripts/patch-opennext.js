const fs = require('fs');
const path = require('path');

// 1. Patch copyTracedFiles for Windows junction/copy
const target = path.join(__dirname, '..', 'node_modules', '@opennextjs', 'aws', 'dist', 'build', 'copyTracedFiles.js');
if (fs.existsSync(target)) {
  let content = fs.readFileSync(target, 'utf8');
  if (!content.includes('junction')) {
    content = content.replace(
      'symlinkSync(symlink, to);',
      `symlinkSync(symlink, to, "junction");`
    );
    content = content.replace(
      'if (e.code !== "EEXIST") {',
      `if (e.code === "EPERM" || e.code === "UNKNOWN") {\n                    try { cpSync(from, to, { recursive: true }); } catch (err) {}\n                } else if (e.code !== "EEXIST") {`
    );
    fs.writeFileSync(target, content, 'utf8');
    console.log('[patch-opennext] Applied Windows junction/copy patch to copyTracedFiles.js');
  }
}

// 2. Patch Prisma Client to use static wasm loader for Cloudflare Workers
const prismaTarget = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'index.js');
if (fs.existsSync(prismaTarget)) {
  let pContent = fs.readFileSync(prismaTarget, 'utf8');
  if (!pContent.includes('#wasm-compiler-loader')) {
    pContent = pContent.replace(
      /getQueryCompilerWasmModule:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?return new WebAssembly\.Module\(queryCompilerWasmFileBytes\)[\s\S]*?\}/,
      `getQueryCompilerWasmModule: async () => {\n        const loader = (await import('#wasm-compiler-loader')).default;\n        return (await loader).default;\n      }`
    );
    fs.writeFileSync(prismaTarget, pContent, 'utf8');
    console.log('[patch-opennext] Applied Prisma wasm loader patch');
  }
}
