import os
import glob

html_files = glob.glob('**/*.html', recursive=True)
exceptions = ['node_modules', 'dist', '.wrangler', 'blog/templates']

for filepath in html_files:
    if any(ex in filepath for ex in exceptions):
        continue
    
    if os.path.basename(filepath) == 'works.html':
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    if any('href="/works.html"' in line for line in lines):
        print(f"Skipping {filepath}, already contains works.html")
        continue
        
    new_lines = []
    i = 0
    modified = False
    while i < len(lines):
        line = lines[i]
        
        # 1. PC Menu
        if 'href="/blog/"' in line and 'hover:text-primary' in line:
            li_idx = i
            while li_idx >= 0 and '<li' not in lines[li_idx]:
                li_idx -= 1
            indent = len(lines[li_idx]) - len(lines[li_idx].lstrip())
            ind = ' ' * indent
            works_pc = [
                f'{ind}<li>\n',
                f'{ind}  <a href="/works.html" class="text-text-secondary hover:text-primary transition-colors font-medium">\n',
                f'{ind}    <span class="block text-sm font-bold">WORKS</span>\n',
                f'{ind}    <span class="block text-xs opacity-60">事例紹介</span>\n',
                f'{ind}  </a>\n',
                f'{ind}</li>\n'
            ]
            new_lines = new_lines[:len(new_lines) - (i - li_idx)]
            new_lines.extend(works_pc)
            for j in range(li_idx, i + 1):
                new_lines.append(lines[j])
            modified = True
            
        # 2. SP Menu
        elif 'href="/blog/"' in line and 'block text-text-primary' in line:
            li_idx = i
            while li_idx >= 0 and '<li' not in lines[li_idx]:
                li_idx -= 1
            indent = len(lines[li_idx]) - len(lines[li_idx].lstrip())
            ind = ' ' * indent
            works_sp = [
                f'{ind}<li>\n',
                f'{ind}  <a href="/works.html" class="block text-text-primary">\n',
                f'{ind}    <span class="block text-lg font-bold">WORKS</span>\n',
                f'{ind}    <span class="block text-sm text-text-secondary">事例紹介</span>\n',
                f'{ind}  </a>\n',
                f'{ind}</li>\n'
            ]
            new_lines = new_lines[:len(new_lines) - (i - li_idx)]
            new_lines.extend(works_sp)
            for j in range(li_idx, i + 1):
                new_lines.append(lines[j])
            modified = True
            
        # 3. Footer Menu
        elif 'href="/blog/"' in line and 'hover:text-white' in line:
            li_idx = i
            while li_idx >= 0 and '<li' not in lines[li_idx]:
                li_idx -= 1
            indent = len(lines[li_idx]) - len(lines[li_idx].lstrip())
            ind = ' ' * indent
            works_ft = [
                f'{ind}<li>\n',
                f'{ind}  <a href="/works.html" class="hover:text-white transition-colors">\n',
                f'{ind}    <span class="block font-semibold">WORKS</span>\n',
                f'{ind}    <span class="block text-sm opacity-70">事例紹介</span>\n',
                f'{ind}  </a>\n',
                f'{ind}</li>\n'
            ]
            new_lines = new_lines[:len(new_lines) - (i - li_idx)]
            new_lines.extend(works_ft)
            for j in range(li_idx, i + 1):
                new_lines.append(lines[j])
            modified = True
            
        else:
            new_lines.append(line)
        i += 1
        
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Updated {filepath}")

