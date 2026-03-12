import os
import shutil

source_root = r'f:\POS-APP\Final_Menu_Images_v3'
dest_dir = r'f:\POS-APP\uploads\products'

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

# Mapping of categories to their prefix or special handling
category_map = {
    "Pizza": "pizzalemon_{:02d}_{}.jpg",
    "Calzone": "pizzalemon_c{}_{}.jpg",
    "Pide": "pizzalemon_{:02d}_{}.jpg",
    "Lahmacun": "pizzalemon_{:02d}_{}.jpg",
    "Tellergerichte": "pizzalemon_{:02d}_{}.jpg",
    "Fingerfood": "pizzalemon_{:02d}_{}.jpg",
    "Salat": "pizzalemon_{:02d}_{}.jpg",
    "Dessert": "pizzalemon_{:02d}_{}.jpg",
    "Getränke": "pizzalemon_{:02d}_{}.jpg",
    "Bier": "pizzalemon_{:02d}_{}.jpg",
    "Alkohol": "pizzalemon_{:02d}_{}.jpg",
}

def slugify(name):
    name = name.lower()
    name = name.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')
    name = "".join([c if c.isalnum() else "_" for c in name])
    while "__" in name:
        name = name.replace("__", "_")
    return name.strip("_")

for folder in os.listdir(source_root):
    folder_path = os.path.join(source_root, folder)
    if not os.path.isdir(folder_path):
        continue
    
    print(f"Processing folder: {folder}")
    for file in os.listdir(folder_path):
        if not file.lower().endswith('_design.jpg'):
            continue
        
        # Extract number and name
        # Format usually: 01_NAME_design.jpg or C1_NAME_design.jpg
        parts = file.split('_')
        if len(parts) < 2:
            continue
            
        code = parts[0] # 01 or C1
        name_part = "_".join(parts[1:-1]) # Name
        
        slug = slugify(name_part)
        
        if folder == "Calzone":
            # C1 -> 1
            num = code[1:] if code.startswith('C') else code
            new_name = f"pizzalemon_c{num}_{slug}.jpg"
        else:
            try:
                num = int(code)
                new_name = f"pizzalemon_{num:02d}_{slug}.jpg"
            except ValueError:
                new_name = f"pizzalemon_{slug}.jpg"
        
        src_file = os.path.join(folder_path, file)
        dst_file = os.path.join(dest_dir, new_name)
        
        shutil.copy2(src_file, dst_file)
        print(f"Copied {file} -> {new_name}")

print("Image migration complete.")
