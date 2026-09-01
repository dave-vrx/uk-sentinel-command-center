import {writeFile,mkdir} from 'node:fs/promises';
const build=new Date().toISOString();
await mkdir(new URL('../public/',import.meta.url),{recursive:true});
await writeFile(new URL('../public/version.json',import.meta.url),JSON.stringify({build})+'\n');
