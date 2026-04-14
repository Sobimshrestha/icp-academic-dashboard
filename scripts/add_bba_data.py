import json
import re
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
txt_dir = os.path.join(base_dir, "data", "extracted_txt")
js_file = os.path.join(base_dir, "schedule_data.js")

bba_files = [
    os.path.join(txt_dir, 'BBA_first_year_extracted.txt'),
    os.path.join(txt_dir, 'BBA_second_year_extracted.txt')
]

pattern = re.compile(
    r"^(?P<day>[A-Z]{3})\s+(?P<start>\d{2}:\d{2}\s+[AP]M)\s+-\s+(?P<end>\d{2}:\d{2}\s+[AP]M)\s+"
    r"(?P<type>Lecture|Lab|Tutorial)\s+(?P<year>\d+)\s+(?P<course>\w+)\s+(?P<intake>\w+)\s+"
    r"(?P<code_val>\w+)\s+(?P<module>.*?)\s+(?P<lecturer>(?:Mr\.|Ms\.|Dr\.)\s+.*?)\s+"
    r"(?P<group>[A-Z0-9\+]+)\s+(?P<block>Nepal|UK)\s+(?P<room>.*?)$"
)

# Load existing data
with open(js_file, 'r', encoding='utf-8') as f:
    text = f.read()

json_str = text.replace('const SCHEDULE = ', '').strip().rstrip(';')
data = json.loads(json_str)

# Extract new BBA entries
new_entries = []
for file in bba_files:
    with open(file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for idx, line in enumerate(lines):
        line = line.strip()
        if not line or line.startswith('LONDON') or line.startswith('YEAR') or line.startswith('Day'):
            continue
        
        m = pattern.match(line)
        if m:
            entry = {
                "day": m.group('day'),
                "start": m.group('start'),
                "end": m.group('end'),
                "type": m.group('type'),
                "year": int(m.group('year')),
                "course": m.group('course'),
                "intake": m.group('intake'),
                "code": m.group('code_val'),
                "module": m.group('module'),
                "lecturer": m.group('lecturer'),
                "group": m.group('group'),
                "block": m.group('block'),
                "room": m.group('room').strip()
            }
            new_entries.append(entry)
        else:
            print(f"Failed to match in {file} line {idx + 1}: {line}")

# Check if BBA entries already exist to avoid duplication
existing_bba_codes = set()
for d in data:
    if "course" in d and d["course"] == "BBA":
        # we might have already added them, but let's check
        pass
    # We can identify BBA courses by their intake or course field, or simply group starting with 'B'.
    if 'group' in d and ('B1' in d['group'] or 'B2' in d['group'] or 'A25' in d.get('intake', '')):
        existing_bba_codes.add(d['code'])

# Let's filter out any existing BBA items to prevent duplicates
bba_groups = ['B1', 'B2', 'B1+B2']
data = [d for d in data if not (d['group'] in bba_groups or d.get('course') == 'BBA')]

data.extend(new_entries)

new_json_str = json.dumps(data)
new_text = "const SCHEDULE = " + new_json_str + ";"

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(new_text)

print(f"Added {len(new_entries)} BBA entries. Total entries now: {len(data)}")
