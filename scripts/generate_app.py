import json, re, os

# Parse the extracted text into structured data
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
input_txt = os.path.join(base_dir, "data", "extracted_txt", "extracted_text.txt")
raw_lines = open(input_txt, "r", encoding="utf-8").readlines()

schedule = []
for line in raw_lines:
    line = line.strip()
    # Match: DAY HH:MM AM/PM - HH:MM AM/PM ClassType Year ...
    m = re.match(
        r'^(SUN|MON|TUE|WED|THU|FRI)\s+'
        r'(\d{2}:\d{2}\s*[AP]M)\s*-\s*(\d{2}:\d{2}\s*[AP]M)\s+'
        r'(Lecture|Tutorial|Lab)\s+'
        r'(\d+)\s+'  # Year
        r'BIT\s+A\d+\s+'
        r'(\S+)\s+'  # Module Code
        r'(.+?)\s+'  # Module Title (greedy but will be trimmed)
        r'((?:Mr\.|Ms\.|Mrs\.|Dr\.)\s+.*?)\s+'  # Lecturer
        r'(C[0-9+C]+)\s+'  # Group
        r'(Nepal|UK)\s+'  # Block
        r'(.+)$',  # Room
        line
    )
    if m:
        schedule.append({
            "day": m.group(1),
            "start": m.group(2).strip(),
            "end": m.group(3).strip(),
            "type": m.group(4),
            "year": int(m.group(5)),
            "code": m.group(6),
            "module": m.group(7).strip(),
            "lecturer": m.group(8).strip(),
            "group": m.group(9),
            "block": m.group(10),
            "room": m.group(11).replace('LONDON METROPOLITAN UNIVERSITY', '').replace('LT-04 Dipang', 'LT04- Dipang').replace('LT03-  Rupa', 'LT03- Rupa').strip()
        })

# Get unique rooms
rooms = sorted(set(e["room"] for e in schedule))
print(f"Parsed {len(schedule)} schedule entries across {len(rooms)} rooms")
print("Rooms:", rooms)

# Write the JS data layer
schedule_json = json.dumps(schedule)

js_content = f"const SCHEDULE = {schedule_json};"

output_js = os.path.join(base_dir, "schedule_data.js")
with open(output_js, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"\n[SUCCESS] Generated schedule_data.js with {len(schedule)} schedule entries and {len(rooms)} rooms!")
