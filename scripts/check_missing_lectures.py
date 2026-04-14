import re
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
input_txt = os.path.join(base_dir, "data", "extracted_txt", "extracted_text.txt")
raw_lines = open(input_txt, "r", encoding="utf-8").readlines()

pattern = re.compile(
    r'^(SUN|MON|TUE|WED|THU|FRI)\s+'
    r'(\d{2}:\d{2}\s*[AP]M)\s*-\s*(\d{2}:\d{2}\s*[AP]M)\s+'
    r'(Lecture|Tutorial|Lab)\s+'
    r'(\d+)\s+'  # Year
    r'BIT\s+A\d+\s+'
    r'(\S+)\s+'  # Module Code
    r'(.+?)\s+'  # Module Title (greedy but will be trimmed)
    r'((?:Mr\.|Ms\.|Mrs\.)\s+\S+(?:\s+\S+)?)\s+'  # Lecturer
    r'(C[0-9+C]+)\s+'  # Group
    r'(Nepal|UK)\s+'  # Block
    r'(.+)$'  # Room
)

missing = []
for line in raw_lines:
    if 'Lecture' in line and not line.startswith('Day Time'):
        line = line.strip()
        m = pattern.match(line)
        if not m:
            missing.append(line)

print(f"Missing {len(missing)} lectures:")
for m in missing[:10]:
    print(m)
