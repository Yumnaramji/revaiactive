import re, os

base = os.path.dirname(os.path.abspath(__file__))

# (file, old_price, new_price, product_id) — uniqueness guaranteed by product id
fixes_collections = [
    ('running-leggings-w', 5000, 5500),
    ('flared-leggings-w',  5000, 5500),
    ('high-impact-bra',    4500, 4950),
    ('low-impact-bra',     4500, 4950),
    ('jacket-w',           7000, 7700),
    ('tshirt-w',           4000, 4400),
    ('tshirt-m',           4000, 4400),
    ('quarter-zip-m',      5000, 5500),
    ('shorts-m',           5500, 6050),
    ('training-pants-m',   6000, 6600),
    ('crew-socks',          500,  550),
    ('no-show-socks',       500,  550),
    ('lifestyle-cap',      4000, 4400),
    ('gym-bag',            8000, 8800),
]

def patch(path, fixes):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    total = 0
    for pid, old, new in fixes:
        # match: addToBag('pid','name',OLD)  -> capture the name, swap price
        pattern = re.compile(r"(addToBag\('" + re.escape(pid) + r"',\s*'[^']+'\s*,\s*)" + str(old) + r"(\))")
        new_content, n = pattern.subn(r"\g<1>" + str(new) + r"\g<2>", content)
        if n:
            content = new_content
            total += n
            print(f'  {pid}: {old} -> {new}  ({n}x)')
        else:
            print(f'  {pid}: NO MATCH (old={old})')
    if total:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
    return total

print('collections.html')
n = patch(os.path.join(base, 'collections.html'), fixes_collections)
print(f'Total patches: {n}')
