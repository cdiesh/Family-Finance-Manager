from PIL import Image
import os

def remove_white_bg(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check if pixel is white (or close to white)
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                newData.append((255, 255, 255, 0)) # Make Transparent
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Saved to {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

base_path = r"C:\Users\charl\.gemini\antigravity\brain\7bbc6d42-2457-4c50-bbb4-eb12fd6b8da9"
target_path = r"C:\Users\charl\Family-Finance-Manager\frontend\src\assets"

files = [
    ("ben_franklin_base_white_bg_1769836184755.png", "ben_franklin_normal_final.png"),
    ("ben_franklin_wink_final_raw_1769836206523.png", "ben_franklin_wink_final.png")
]

for input_file, output_file in files:
    input_full_path = os.path.join(base_path, input_file)
    output_full_path = os.path.join(target_path, output_file)
    remove_white_bg(input_full_path, output_full_path)
