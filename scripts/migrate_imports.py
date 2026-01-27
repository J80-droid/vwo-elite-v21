import os
import re

# Definiëer de vervangingen
# We gebruiken een lijst met (pattern, replacement, description)
replacements = [
    # 1. Alias-based replacements (@/ -> new aliases or @alias -> new aliases)
    (re.compile(r'from\s+[\'"]@\/?components\/ui\/([^\'"]+)[\'"]'), r'from "@shared/ui/\1"', "Alias UI"),
    (re.compile(r'from\s+[\'"]@\/?components\/common\/([^\'"]+)[\'"]'), r'from "@shared/ui/\1"', "Alias Common"),
    (re.compile(r'from\s+[\'"]@\/?utils\/([^\'"]+)[\'"]'), r'from "@shared/lib/\1"', "Alias Utils"),
    (re.compile(r'from\s+[\'"]@\/?lib\/([^\'"]+)[\'"]'), r'from "@shared/lib/\1"', "Alias Lib"),
    (re.compile(r'from\s+[\'"]@\/?hooks\/([^\'"]+)[\'"]'), r'from "@shared/hooks/\1"', "Alias Hooks"),
    (re.compile(r'from\s+[\'"]@\/?types\/([^\'"]+)[\'"]'), r'from "@shared/types/\1"', "Alias Types"),
    (re.compile(r'from\s+[\'"]@\/?services\/([^\'"]+)[\'"]'), r'from "@shared/api/\1"', "Alias Services"),
    (re.compile(r'from\s+[\'"]@\/?stores\/([^\'"]+)[\'"]'), r'from "@shared/model/\1"', "Alias Stores"),
    (re.compile(r'from\s+[\'"]@\/?contexts\/([^\'"]+)[\'"]'), r'from "@shared/lib/contexts/\1"', "Alias Contexts"),
    (re.compile(r'from\s+[\'"]@\/?locales\/([^\'"]+)[\'"]'), r'from "@shared/assets/locales/\1"', "Alias Locales"),
    (re.compile(r'from\s+[\'"]@\/?data\/([^\'"]+)[\'"]'), r'from "@shared/assets/data/\1"', "Alias Data"),
    
    # 2. Relative-based replacements
    (re.compile(r'from\s+[\'"](\.\.\/)+components\/ui\/([^\'"]+)[\'"]'), r'from "@shared/ui/\2"', "Relative UI"),
    (re.compile(r'from\s+[\'"](\.\.\/)+components\/common\/([^\'"]+)[\'"]'), r'from "@shared/ui/\2"', "Relative Common"),
    (re.compile(r'from\s+[\'"](\.\.\/)+utils\/([^\'"]+)[\'"]'), r'from "@shared/lib/\2"', "Relative Utils"),
    (re.compile(r'from\s+[\'"](\.\.\/)+lib\/([^\'"]+)[\'"]'), r'from "@shared/lib/\2"', "Relative Lib"),
    (re.compile(r'from\s+[\'"](\.\.\/)+hooks\/([^\'"]+)[\'"]'), r'from "@shared/hooks/\2"', "Relative Hooks"),
    (re.compile(r'from\s+[\'"](\.\.\/)+types\/([^\'"]+)[\'"]'), r'from "@shared/types/\2"', "Relative Types"),
    (re.compile(r'from\s+[\'"](\.\.\/)+services\/([^\'"]+)[\'"]'), r'from "@shared/api/\2"', "Relative Services"),
    (re.compile(r'from\s+[\'"](\.\.\/)+stores\/([^\'"]+)[\'"]'), r'from "@shared/model/\2"', "Relative Stores"),
    (re.compile(r'from\s+[\'"](\.\.\/)+contexts\/([^\'"]+)[\'"]'), r'from "@shared/lib/contexts/\2"', "Relative Contexts"),
    (re.compile(r'from\s+[\'"](\.\.\/)+locales\/([^\'"]+)[\'"]'), r'from "@shared/assets/locales/\2"', "Relative Locales"),

    # 3. Handle features internal components -> ui
    (re.compile(r'import\s+([^{}\n]+)\s+from\s+[\'"](\.\.?\/)+components\/([^\'"]+)[\'"]'), r'import \1 from "../ui/\3"', "Feature Local UI"),
    (re.compile(r'import\s+\{\s*([^{}\n]+)\s*\}\s+from\s+[\'"](\.\.?\/)+components\/([^\'"]+)[\'"]'), r'import { \1 } from "../ui/\3"', "Feature Local UI {}"),
    
    # 4. Handle lazy imports (import(...))
    (re.compile(r'import\([\'"](\.\.?\/)+components\/ui\/([^\'"]+)[\'"]\)'), r'import("@shared/ui/\2")', "Lazy UI"),
    (re.compile(r'import\([\'"](\.\.?\/)+components\/common\/([^\'"]+)[\'"]\)'), r'import("@shared/ui/\2")', "Lazy Common"),
    (re.compile(r'import\([\'"](\.\.?\/)+components\/views\/([^\'"]+)[\'"]\)'), r'import("@pages/\2")', "Lazy Views"),
    
    # 5. Handle specific entities
    (re.compile(r'"@shared/types/user"'), r'"@entities/user/model/user"', "Entity User"),
    (re.compile(r'"@shared/types/planner\.types"'), r'"@entities/planner/model/task"', "Entity Planner"),
    
    # 6. Cleanup trailing extensions
    (re.compile(r'(@app\/[^\'"]+)\.tsx?'), r'\1', "Cleanup Ext App"),
    (re.compile(r'(@pages\/[^\'"]+)\.tsx?'), r'\1', "Cleanup Ext Pages"),
    (re.compile(r'(@widgets\/[^\'"]+)\.tsx?'), r'\1', "Cleanup Ext Widgets"),
    (re.compile(r'(@features\/[^\'"]+)\.tsx?'), r'\1', "Cleanup Ext Features"),
    (re.compile(r'(@entities\/[^\'"]+)\.tsx?'), r'\1', "Cleanup Ext Entities"),
    (re.compile(r'(@shared\/[^\'"]+)\.tsx?'), r'\1', "Cleanup Ext Shared"),
]

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        # print(f"Error reading {file_path}: {e}")
        return False

    new_content = content
    for pattern, replacement, desc in replacements:
        new_content = pattern.sub(replacement, new_content)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    src_dir = 'src'
    count = 0
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.css')):
                if process_file(os.path.join(root, file)):
                    count += 1

    print(f"Total files updated: {count}")

if __name__ == "__main__":
    main()
