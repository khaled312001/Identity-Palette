import re

with open(r"f:\POS-APP\server\templates\restaurant-store.html", "r", encoding="utf-8") as f:
    content = f.read()

# Fix spacing in var definitions:
content = re.sub(r'--P:\s*\{\s*\{\s*PRIMARY_COLOR\s*\}\s*\}\s*;', '--P: {{PRIMARY_COLOR}};', content)
content = re.sub(r'--A:\s*\{\s*\{\s*ACCENT_COLOR\s*\}\s*\}\s*;', '--A: {{ACCENT_COLOR}};', content)

style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
if style_match:
    css_content = style_match.group(1)
    
    # Require class names to start with a letter (or underscore/hyphen followed by letter)
    class_selectors = re.findall(r'\.([a-zA-Z_-][a-zA-Z0-9_-]*)', css_content)
    
    classes = set()
    for c in class_selectors:
        if c.isdigit(): continue
        if c.startswith('fa-'): continue
        classes.add(c)
    
    classes = sorted(list(classes), key=len, reverse=True)
    
    for c in classes:
        css_content = re.sub(r'(?<![a-zA-Z0-9_-])\.' + re.escape(c) + r'(?![a-zA-Z0-9_-])', '.rs-' + c, css_content)
    
    content = content[:style_match.start(1)] + css_content + content[style_match.end(1):]
    
    def replace_html_classes(match):
        quote = match.group(1)
        class_str = match.group(2)
        original_classes = class_str.split()
        new_classes = []
        for cls in original_classes:
            if cls in classes:
                new_classes.append('rs-' + cls)
            else:
                new_classes.append(cls)
        return 'class=' + quote + ' '.join(new_classes) + quote

    content = re.sub(r'class=(["\'])(.*?)\1', replace_html_classes, content)
    
    js_match = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
    if js_match:
        js = js_match.group(1)
        for c in classes:
            # classList uses
            js = re.sub(r'(classList\.(?:add|remove|toggle|contains)\()([\'"])' + re.escape(c) + r'\2', r'\1\2rs-' + c + r'\2', js)
            
            # literal string class names like '.active'
            js = re.sub(r'([\'"])(?<![a-zA-Z0-9_-])\.' + re.escape(c) + r'(?![a-zA-Z0-9_-])', r'\1.rs-' + c, js)
            
        content = content[:js_match.start(1)] + js + content[js_match.end(1):]

    with open(r"f:\POS-APP\server\templates\restaurant-store.html", "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Renamed {len(classes)} classes successfully.")
