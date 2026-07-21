import { readdirSync, readFileSync } from 'node:fs';
export function parseFlatYaml(t){const r={};for(const l of t.split('\n')){const m=l.match(/^([a-z_]+):\s*(.*)$/);if(!m)continue;let v=m[2].trim();if(v.startsWith('"')){try{v=JSON.parse(v);}catch{}}r[m[1]]=v;}return r;}
export function loadMembers(dir='data/members'){return readdirSync(dir).filter(f=>f.endsWith('.yml')).map(f=>parseFlatYaml(readFileSync(`${dir}/${f}`,'utf8'))).sort((a,b)=>a.name.localeCompare(b.name));}
