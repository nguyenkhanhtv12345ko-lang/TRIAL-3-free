const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = [
  { from: /bg-white/g, to: 'bg-tech-800' },
  { from: /bg-\[\#f1f5f9\]/g, to: 'bg-tech-900' },
  { from: /bg-\[\#f8fafc\]/g, to: 'bg-tech-900' },
  { from: /bg-slate-50\/50/g, to: 'bg-tech-900/50' },
  { from: /bg-slate-50/g, to: 'bg-tech-900' },
  { from: /bg-slate-100\/50/g, to: 'bg-tech-700/50' },
  { from: /bg-slate-100/g, to: 'bg-tech-700' },
  { from: /bg-slate-900\/60/g, to: 'bg-tech-900/80' },
  { from: /bg-slate-900/g, to: 'bg-tech-900' },
  { from: /border-slate-50/g, to: 'border-tech-border/50' },
  { from: /border-slate-100/g, to: 'border-tech-border' },
  { from: /border-slate-200/g, to: 'border-tech-border' },
  { from: /text-slate-900/g, to: 'text-white' },
  { from: /text-slate-800/g, to: 'text-white' },
  { from: /text-slate-700/g, to: 'text-white' },
  { from: /text-slate-600/g, to: 'text-tech-text' },
  { from: /text-slate-500/g, to: 'text-tech-muted' },
  { from: /text-slate-400/g, to: 'text-tech-muted/80' },
  { from: /text-slate-300/g, to: 'text-tech-muted/60' },
  { from: /text-slate-200/g, to: 'text-tech-muted/40' },
  { from: /text-indigo-600/g, to: 'text-tech-cyan' },
  { from: /text-indigo-500/g, to: 'text-tech-cyan' },
  { from: /text-indigo-400/g, to: 'text-tech-cyan' },
  { from: /bg-indigo-600/g, to: 'bg-tech-cyan text-tech-900' },
  { from: /bg-indigo-500\/25/g, to: 'bg-tech-cyan/20' },
  { from: /bg-indigo-500\/45/g, to: 'bg-tech-cyan/40' },
  { from: /bg-indigo-500/g, to: 'bg-tech-cyan' },
  { from: /bg-indigo-50\/30/g, to: 'bg-tech-cyan/10' },
  { from: /bg-indigo-50/g, to: 'bg-tech-cyan/10' },
  { from: /bg-indigo-100/g, to: 'bg-tech-cyan/20' },
  { from: /ring-indigo-100/g, to: 'ring-tech-cyan/20' },
  { from: /ring-indigo-500/g, to: 'ring-tech-cyan/50' },
  { from: /border-indigo-100/g, to: 'border-tech-cyan/20' },
  { from: /border-indigo-200/g, to: 'border-tech-cyan/30' },
  { from: /border-indigo-400/g, to: 'border-tech-cyan/50' },
  { from: /border-indigo-300/g, to: 'border-tech-cyan/40' },
  { from: /bg-emerald-50/g, to: 'bg-emerald-500/10' },
  { from: /border-emerald-100/g, to: 'border-emerald-500/30' },
  { from: /bg-rose-50/g, to: 'bg-rose-500/10' },
  { from: /border-rose-100/g, to: 'border-rose-500/30' },
  { from: /bg-amber-50/g, to: 'bg-amber-500/10' },
  { from: /border-amber-200/g, to: 'border-amber-500/30' },
  { from: /text-tech-cyan text-white/g, to: 'text-white' }, // fix double text colors
  { from: /bg-tech-cyan text-tech-900 text-white/g, to: 'bg-tech-cyan text-tech-900' }, // fix double text colors
  { from: /text-tech-cyan font-black text-center py-5 bg-tech-900/g, to: 'text-tech-cyan font-black text-center py-5 bg-tech-900' }
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  // Custom font fix
  content = content.replace(/font-sans/g, 'font-mono');
  content = content.replace(/rounded-\[40px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[36px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl');
  content = content.replace(/rounded-\[28px\]/g, 'rounded-xl');
  content = content.replace(/rounded-\[24px\]/g, 'rounded-xl');
  
  // Specific fixes
  content = content.replace(/text-tech-cyan text-tech-900/g, 'bg-tech-cyan text-tech-900'); // sometimes bg-indigo gets replaced but leaves adjacent colors
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Done replacing colors.');
