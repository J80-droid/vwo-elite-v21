import os
import shutil

def standardize_features():
    features_dir = 'src/features'
    if not os.path.exists(features_dir):
        return

    for feature in os.listdir(features_dir):
        feature_path = os.path.join(features_dir, feature)
        if not os.path.isdir(feature_path): continue
        
        comp_dir = os.path.join(feature_path, 'components')
        ui_dir = os.path.join(feature_path, 'ui')
        
        if os.path.exists(comp_dir):
            if os.path.exists(ui_dir):
                print(f"Merging {comp_dir} into {ui_dir}...")
                for item in os.listdir(comp_dir):
                    shutil.move(os.path.join(comp_dir, item), os.path.join(ui_dir, item))
                os.rmdir(comp_dir)
            else:
                print(f"Renaming {comp_dir} to {ui_dir}...")
                os.rename(comp_dir, ui_dir)

if __name__ == "__main__":
    standardize_features()
