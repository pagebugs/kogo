import os
import zipfile
import subprocess
import sys
from urllib.request import urlopen
from time import sleep

# Configuration
HOST = "kogha.co.kr"
SFTP_HOST = "146.56.175.219"
USER = "kogha0000"
BRIDGE_URL = f"http://{HOST}/bridge.php"
TOKEN = "KoghaDeploy2026"

# Determine paths relative to this script file
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(SCRIPT_DIR, "..")  # project01/
BRIDGE_FILE = os.path.join(SCRIPT_DIR, "bridge.php")
ZIP_NAME = "deploy_pkg.zip"
ZIP_PATH = os.path.join(SCRIPT_DIR, ZIP_NAME)

# Folders/files to INCLUDE in deployment
INCLUDE_LIST = ["touch", "assets", "inc", "nav"]

# Folders/files to EXCLUDE
EXCLUDE_LIST = ["beta", ".git", ".github", ".env", "tools", "prompt", ".agent", "__pycache__", ".DS_Store"]

def log(msg):
    print(f"[Deploy] {msg}")

def check_bridge_ready(password):
    log(f"Uploading bridge.php from {BRIDGE_FILE}...")
    
    if not os.path.exists(BRIDGE_FILE):
        log(f"Error: bridge.php not found at {BRIDGE_FILE}")
        return False

    cmd = [
        "curl", "-k", "-u", f"{USER}:{password}",
        "-T", BRIDGE_FILE,
        f"sftp://{SFTP_HOST}/~/bridge.php"
    ]
    ret = subprocess.run(cmd, capture_output=True)
    if ret.returncode != 0:
        log(f"Error uploading bridge.php: {ret.stderr.decode()}")
        return False
    
    try:
        with urlopen(f"{BRIDGE_URL}?token={TOKEN}&action=check") as response:
            body = response.read().decode()
            log(f"Bridge Response: {body}")
            return "Ready" in body
    except Exception as e:
        log(f"Bridge HTTP Check fail: {e}")
        return False

def make_zip():
    log(f"Compressing project to '{ZIP_PATH}'...")
    if os.path.exists(ZIP_PATH):
        os.remove(ZIP_PATH)
    
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for include_folder in INCLUDE_LIST:
            folder_path = os.path.join(PROJECT_ROOT, include_folder)
            if not os.path.exists(folder_path):
                log(f"Warning: {include_folder} not found, skipping...")
                continue
            
            for root, dirs, files in os.walk(folder_path):
                # Filter out excluded directories
                dirs[:] = [d for d in dirs if d not in EXCLUDE_LIST]
                
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, PROJECT_ROOT)
                    
                    # Skip excluded files
                    skip = False
                    for excl in EXCLUDE_LIST:
                        if excl in arcname:
                            skip = True
                            break
                    if skip:
                        continue
                    
                    zipf.write(file_path, arcname)
    
    log("Compression done.")

def upload_zip(password):
    log(f"Uploading deployment package {ZIP_PATH}...")
    cmd = [
        "curl", "-k", "-u", f"{USER}:{password}",
        "-T", ZIP_PATH,
        f"sftp://{SFTP_HOST}/~/{ZIP_NAME}"
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = proc.communicate()
    if proc.returncode != 0:
        log(f"Upload failed: {err.decode()}")
        sys.exit(1)
    log("Upload complete.")

def trigger_server_action(action):
    log(f"Triggering server action: {action}...")
    url = f"{BRIDGE_URL}?token={TOKEN}&action={action}"
    try:
        with urlopen(url) as response:
            log(f"Result: {response.read().decode()}")
    except Exception as e:
        log(f"Trigger failed: {e}")

def main():
    print("=== KOGO Web-Based Deployer ===")
    print("(Deploys: touch, assets, inc, nav)")
    
    if len(sys.argv) > 1:
        password = sys.argv[1]
    else:
        password = input(f"Enter SFTP Password for {USER}: ")
    
    make_zip()
    
    if not check_bridge_ready(password):
        log("Failed to initialize bridge. Check SFTP password and Web accessibility.")
        sys.exit(1)
    
    trigger_server_action("backup")
    upload_zip(password)
    trigger_server_action("unzip")
    
    log("Deployment Finished! Check http://kogha.co.kr/touch/")

if __name__ == "__main__":
    main()
