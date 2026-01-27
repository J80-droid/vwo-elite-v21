import os
import shutil

def move_views():
    views_dir = 'src/components/views'
    pages_dir = 'src/pages'
    
    if not os.path.exists(views_dir):
        print(f"{views_dir} not found.")
        return

    for item in os.listdir(views_dir):
        item_path = os.path.join(views_dir, item)
        if os.path.isfile(item_path) and item.endswith('.tsx'):
            # dashboard.tsx -> src/pages/dashboard/ui/dashboard.tsx
            page_name = item.replace('.tsx', '').lower()
            # Special case for UltimateDashboard which is already moved
            if page_name == 'ultimatedashboard': continue
            
            target_dir = os.path.join(pages_dir, page_name, 'ui')
            os.makedirs(target_dir, exist_ok=True)
            shutil.move(item_path, os.path.join(target_dir, item))
            
            # Check for same-named CSS
            css_path = item_path.replace('.tsx', '.css')
            if os.path.exists(css_path):
                shutil.move(css_path, os.path.join(target_dir, os.path.basename(css_path)))
        
        elif os.path.isdir(item_path):
            # If it's a directory (like CodeLab/), move it as a slice
            page_name = item.lower()
            target_dir = os.path.join(pages_dir, page_name)
            if os.path.exists(target_dir):
                # Merge or something? Let's just move it if it doesn't exist
                print(f"Directory {target_dir} already exists, skipping {item}")
                continue
            shutil.move(item_path, target_dir)

def move_layouts():
    layout_dir = 'src/components/layout'
    widgets_dir = 'src/widgets/layout/ui'
    os.makedirs(widgets_dir, exist_ok=True)
    
    if os.path.exists(layout_dir):
        for item in os.listdir(layout_dir):
            shutil.move(os.path.join(layout_dir, item), os.path.join(widgets_dir, item))

def move_common():
    common_dir = 'src/components/common'
    shared_ui_dir = 'src/shared/ui'
    
    if os.path.exists(common_dir):
        for item in os.listdir(common_dir):
            shutil.move(os.path.join(common_dir, item), os.path.join(shared_ui_dir, item))

if __name__ == "__main__":
    move_views()
    move_layouts()
    move_common()
    print("Done moving components.")
