"""
Package X-Shield Chrome Extension into a clean zip distribution file.
"""
import os
import zipfile

def package_extension():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dist_dir = os.path.join(base_dir, "dist")
    os.makedirs(dist_dir, exist_ok=True)
    zip_path = os.path.join(dist_dir, "x-shield-v1.0.0.zip")

    include_dirs = ["icons", "popup", "content", "background", "filters"]
    include_files = ["manifest.json", "test-demo.html", "README.md", "PRIVACY_POLICY.md"]

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file_name in include_files:
            file_path = os.path.join(base_dir, file_name)
            if os.path.exists(file_path):
                zipf.write(file_path, file_name)

        for folder in include_dirs:
            folder_path = os.path.join(base_dir, folder)
            if os.path.exists(folder_path):
                for root, _, files in os.walk(folder_path):
                    for file in files:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, base_dir)
                        zipf.write(full_path, rel_path)

    print(f"X-Shield packaged successfully -> {zip_path}")

if __name__ == "__main__":
    package_extension()
