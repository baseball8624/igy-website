import re

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

with open('works.html', 'r', encoding='utf-8') as f:
    works_html = f.read()

# Extract from index.html
header_pattern = re.compile(r'(<!-- ========== HEADER ========== -->.*?)</header>', re.DOTALL)
mobile_menu_pattern = re.compile(r'(<!-- Mobile Menu \(moved outside header to avoid backdrop-filter inheritance\) -->.*?</div>\s*</div>)', re.DOTALL)
# For index.html mobile menu, wait let's just use regex for <div id="mobile-menu" ...> ... </div>
# In index.html it's:
#   <div id="mobile-menu" class="mobile-menu fixed inset-y-0 right-0 w-72 md:w-64 bg-white shadow-2xl md:hidden">
#     <div class="p-6">
# ...
#       </ul>
#     </div>
#   </div>

mobile_menu_pattern_index = re.compile(r'(<div id="mobile-menu" class="mobile-menu[^>]*>.*?</ul>\n\s*</div>\n\s*</div>)', re.DOTALL)
footer_pattern_index = re.compile(r'(<!-- ========== FOOTER ========== -->.*?</footer>)', re.DOTALL)

header_match = header_pattern.search(index_html)
mobile_match = mobile_menu_pattern_index.search(index_html)
footer_match = footer_pattern_index.search(index_html)

if not header_match or not mobile_match or not footer_match:
    print("Could not find patterns in index.html")
    exit(1)

new_header = header_match.group(1) + '</header>'
new_mobile = mobile_match.group(1)
new_footer = footer_match.group(1)

# Now replace in works.html
works_header_pattern = re.compile(r'<!-- ========== HEADER ========== -->.*?</header>', re.DOTALL)
works_mobile_pattern = re.compile(r'<!-- Mobile Menu -->.*?</nav>\s*</div>\s*</header>\s*<!-- Mobile Menu -->.*?</ul>\n\s*</div>\n\s*</div>', re.DOTALL)
works_mobile_pattern_alt = re.compile(r'<div id="mobile-menu" class="mobile-menu[^>]*>.*?</ul>\n\s*</div>\n\s*</div>', re.DOTALL)
works_footer_pattern = re.compile(r'<!-- ========== FOOTER ========== -->.*?</footer>', re.DOTALL)

works_html = works_header_pattern.sub(new_header, works_html)
works_html = works_mobile_pattern_alt.sub(new_mobile, works_html)
works_html = works_footer_pattern.sub(new_footer, works_html)

# Let's fix the <!-- Mobile Menu --> comment to match index.html if it was there
works_html = works_html.replace('<!-- Mobile Menu -->', '<!-- Mobile Menu (moved outside header to avoid backdrop-filter inheritance) -->')

with open('works.html', 'w', encoding='utf-8') as f:
    f.write(works_html)

print("Replaced header, mobile menu, and footer in works.html")
