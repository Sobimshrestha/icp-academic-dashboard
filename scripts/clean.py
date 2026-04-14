import json
import re
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
js_file = os.path.join(base_dir, "schedule_data.js")

with open(js_file, 'r', encoding='utf-8') as f:
    text = f.read()

# get json
json_str = text.replace('const SCHEDULE = ', '').strip().rstrip(';')
data = json.loads(json_str)

for idx, item in enumerate(data):
    r = item['room']
    r = r.replace('LONDON METROPOLITAN UNIVERSITY', '')
    r = r.replace('LT-04 Dipang', 'LT04- Dipang')
    r = r.replace('LT03-  Rupa', 'LT03- Rupa')
    r = r.strip()
    data[idx]['room'] = r

new_json_str = json.dumps(data)
new_text = "const SCHEDULE = " + new_json_str + ";"

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(new_text)

print("schedule_data.js has been cleaned!")
