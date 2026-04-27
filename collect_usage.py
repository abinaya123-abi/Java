
import time
import csv
import os
from datetime import datetime
import platform

# Platform-specific imports
system = platform.system()

if system == "Windows":
    import win32gui
    import win32process
    import psutil
elif system == "Darwin":  # macOS
    from AppKit import NSWorkspace
elif system == "Linux":
    try:
        import subprocess
    except ImportError:
        print("subprocess module required for Linux")

CSV_FILE = "laptop_usage.csv"
CHECK_INTERVAL = 60  # Check every 60 seconds (1 minute)


def get_active_window_windows():
    """Get active window title and process name on Windows"""
    try:
        window = win32gui.GetForegroundWindow()
        window_title = win32gui.GetWindowText(window)
        _, pid = win32process.GetWindowThreadProcessId(window)
        process = psutil.Process(pid)
        app_name = process.name().replace('.exe', '')
        return app_name, window_title
    except:
        return "Unknown", "Unknown"


def get_active_window_macos():
    """Get active window on macOS"""
    try:
        active_app = NSWorkspace.sharedWorkspace().activeApplication()
        app_name = active_app['NSApplicationName']
        return app_name, app_name
    except:
        return "Unknown", "Unknown"


def get_active_window_linux():
    """Get active window on Linux (requires xdotool)"""
    try:
        # Get active window ID
        window_id = subprocess.check_output(['xdotool', 'getactivewindow']).decode().strip()
        # Get window name
        window_name = subprocess.check_output(['xdotool', 'getwindowname', window_id]).decode().strip()
        # Get process name
        pid = subprocess.check_output(['xdotool', 'getwindowpid', window_id]).decode().strip()
        process = psutil.Process(int(pid))
        app_name = process.name()
        return app_name, window_name
    except:
        return "Unknown", "Unknown"


def get_active_application():
    """Get currently active application based on OS"""
    if system == "Windows":
        return get_active_window_windows()
    elif system == "Darwin":
        return get_active_window_macos()
    elif system == "Linux":
        return get_active_window_linux()
    else:
        return "Unknown", "Unknown"


def initialize_csv():
    """Create CSV file with headers if it doesn't exist"""
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Date', 'Time', 'Application', 'Window Title', 'Usage Minutes'])
        print(f"✓ Created {CSV_FILE}")


def log_usage(app_name, window_title, minutes=1):
    """Log application usage to CSV"""
    current_date = datetime.now().strftime('%Y-%m-%d')
    current_time = datetime.now().strftime('%H:%M:%S')
    
    with open(CSV_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([current_date, current_time, app_name, window_title, minutes])


def main():
    """Main tracking loop"""
    print("=" * 50)
    print("🖥️  LAPTOP USAGE TRACKER STARTED")
    print("=" * 50)
    print(f"Platform: {system}")
    print(f"Logging to: {CSV_FILE}")
    print(f"Check interval: {CHECK_INTERVAL} seconds")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nPress Ctrl+C to stop tracking\n")
    
    initialize_csv()
    
    try:
        while True:
            app_name, window_title = get_active_application()
            
            # Log the usage
            log_usage(app_name, window_title, minutes=1)
            
            # Display current activity
            timestamp = datetime.now().strftime('%H:%M:%S')
            print(f"[{timestamp}] {app_name:30s} | {window_title[:40]}")
            
            # Wait for next check
            time.sleep(CHECK_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n" + "=" * 50)
        print("✓ Tracking stopped")
        print("=" * 50)
        print(f"Data saved to: {CSV_FILE}")


if __name__ == "__main__":
    # Check for required dependencies
    required_installed = True
    
    if system == "Windows":
        try:
            import win32gui
            import psutil
        except ImportError:
            print("⚠ Missing dependencies!")
            print("Install: pip install pywin32 psutil")
            required_installed = False
    elif system == "Darwin":
        try:
            from AppKit import NSWorkspace
        except ImportError:
            print("⚠ Missing dependencies!")
            print("Install: pip install pyobjc-framework-Cocoa")
            required_installed = False
    elif system == "Linux":
        try:
            import psutil
        except ImportError:
            print("⚠ Missing dependencies!")
            print("Install: pip install psutil")
            print("Also install: sudo apt-get install xdotool (for window tracking)")
            required_installed = False
    
    if required_installed:
        main()