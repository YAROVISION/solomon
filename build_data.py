import re
import json
import os
import glob

with open("ukr_proverbs.txt", "r", encoding="utf-8") as f:
    raw_content = f.read()

chapter_blocks = re.split(r"Глава\s+(\d+)", raw_content)
chapters_data = []

famous_quotes_ukr = [
    {"ch": 1, "v": 7, "text": "Початок мудрости — страх Господній; нерозумні тільки нехтують мудрість і наставляння.", "tag": "Мудрість"},
    {"ch": 3, "v": 5, "text": "Уповай на Господа всім серцем твоїм, і не покладайся на розум твій.", "tag": "Віра"},
    {"ch": 3, "v": 13, "text": "Блаженний муж, який здобув мудрість, і людина, яка придбала розум!", "tag": "Щастя"},
    {"ch": 4, "v": 23, "text": "Більше за все бережене зберігай серце твоє, тому що з нього джерела життя.", "tag": "Серце"},
    {"ch": 10, "v": 12, "text": "Ненависть збуджує розбрати, але любов покриває всі гріхи.", "tag": "Любов"},
    {"ch": 11, "v": 2, "text": "Прийде гордість, прийде і посоромлення; але зі смиренними — мудрість.", "tag": "Смирення"},
    {"ch": 15, "v": 1, "text": "Лагідна відповідь відвертає гнів, а образливе слово збуджує лють.", "tag": "Мир"},
    {"ch": 16, "v": 18, "text": "Погибелі передує гордість, і падінню — пихатість.", "tag": "Застереження"},
    {"ch": 17, "v": 22, "text": "Веселе серце доброчинне, як лікування, а сумовитий дух сушить кістки.", "tag": "Радість"},
    {"ch": 22, "v": 1, "text": "Добре ім’я краще за велике багатство, і добра слава краща за срібло і золото.", "tag": "Честь"},
    {"ch": 27, "v": 17, "text": "Як залізо гострить залізо, так людина гострить погляд друга свого.", "tag": "Дружба"},
    {"ch": 31, "v": 30, "text": "Миловидість оманлива і краса суєтна; але дружина, яка боїться Господа, гідна похвали.", "tag": "Чеснота"}
]

# Simple Markdown to HTML parser for commentary files
def md_to_html(md_text):
    lines = md_text.split("\n")
    html_lines = []
    in_list = False
    
    for line in lines:
        line_s = line.strip()
        
        # End list if not bullet
        if in_list and not line_s.startswith("* ") and not line_s.startswith("- "):
            html_lines.append("</ul>")
            in_list = False
            
        if not line_s:
            continue
            
        if line_s.startswith("# "):
            title = line_s[2:].strip()
            html_lines.append(f"<h2 class='commentary-title'>{title}</h2>")
        elif line_s.startswith("## "):
            title = line_s[3:].strip()
            html_lines.append(f"<h3 class='commentary-section-title'>{title}</h3>")
        elif line_s.startswith("### "):
            title = line_s[4:].strip()
            html_lines.append(f"<h4 class='commentary-subtitle'>{title}</h4>")
        elif line_s.startswith("> "):
            quote = line_s[2:].strip()
            # replace markdown inside quote
            quote = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", quote)
            quote = re.sub(r"\*(.*?)\*", r"<em>\1</em>", quote)
            html_lines.append(f"<blockquote class='commentary-quote'>{quote}</blockquote>")
        elif line_s == "---":
            html_lines.append("<div class='commentary-divider'></div>")
        elif line_s.startswith("* ") or line_s.startswith("- "):
            if not in_list:
                html_lines.append("<ul class='commentary-list'>")
                in_list = True
            item = line_s[2:].strip()
            item = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", item)
            item = re.sub(r"\*(.*?)\*", r"<em>\1</em>", item)
            html_lines.append(f"<li>{item}</li>")
        else:
            p = line_s
            p = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", p)
            p = re.sub(r"\*(.*?)\*", r"<em>\1</em>", p)
            html_lines.append(f"<p class='commentary-p'>{p}</p>")
            
    if in_list:
        html_lines.append("</ul>")
        
    return "\n".join(html_lines)

# Load commentary files from text/
commentaries = {}
for filepath in sorted(glob.glob("text/*.md")):
    filename = os.path.basename(filepath)
    # Match pattern: {num}_glava_{ch}_virsh_{v}.md
    m = re.search(r"glava_(\d+)_virsh_(\d+)", filename)
    if m:
        ch = int(m.group(1))
        v = int(m.group(2))
        key = f"{ch}-{v}"
        with open(filepath, "r", encoding="utf-8") as f_md:
            raw_md = f_md.read()
            html_content = md_to_html(raw_md)
            
            # Extract first heading for display title
            first_line = raw_md.strip().split("\n")[0]
            display_title = re.sub(r"^#\s*", "", first_line)
            
            commentaries[key] = {
                "chapter": ch,
                "verse": v,
                "title": display_title,
                "file": filename,
                "html": html_content
            }

for i in range(1, len(chapter_blocks), 2):
    ch_num = int(chapter_blocks[i])
    ch_body = chapter_blocks[i+1].strip()
    
    verse_matches = list(re.finditer(r"(?:^|\s+)(\d+)\s+", ch_body))
    verses = []
    
    filtered_matches = []
    expected_v = 1
    for m in verse_matches:
        v_val = int(m.group(1))
        if v_val == expected_v:
            filtered_matches.append(m)
            expected_v += 1
            
    for idx, match in enumerate(filtered_matches):
        v_num = int(match.group(1))
        start_pos = match.end()
        end_pos = filtered_matches[idx + 1].start() if idx + 1 < len(filtered_matches) else len(ch_body)
        v_text = ch_body[start_pos:end_pos].strip()
        v_text = re.sub(r"\s+", " ", v_text)
        has_comm = f"{ch_num}-{v_num}" in commentaries
        verses.append({
            "verse": v_num,
            "text": v_text,
            "hasCommentary": has_comm
        })
            
    chapters_data.append({
        "chapter": ch_num,
        "title": f"Глава {ch_num}",
        "versesCount": len(verses),
        "verses": verses
    })

js_content = f"// База даних: Книга Притч Соломонових (31 глава українською мовою та коментарі)\nwindow.SOLOMON_DATA = {{\n  chapters: {json.dumps(chapters_data, ensure_ascii=False, indent=2)},\n  famousQuotes: {json.dumps(famous_quotes_ukr, ensure_ascii=False, indent=2)},\n  commentaries: {json.dumps(commentaries, ensure_ascii=False, indent=2)}\n}};\n"

with open("data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"data.js written successfully! Total chapters: {len(chapters_data)}, Total commentaries: {len(commentaries)}")
