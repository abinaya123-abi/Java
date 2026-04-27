import pandas as pd
import matplotlib.pyplot as plt
import os

print("Loading usage data...")

# ---------- TRY TO LOAD DATA WITH ERROR HANDLING ----------
try:
    # First, try normal loading
    df = pd.read_csv("laptop_usage.csv")
    print(f"✓ Loaded {len(df)} records successfully")
    
except pd.errors.ParserError:
    print("⚠ CSV has inconsistent columns. Attempting to fix...")
    
    # Try loading with error handling
    try:
        df = pd.read_csv("laptop_usage.csv", on_bad_lines='skip')
        print(f"✓ Loaded {len(df)} records (skipped bad lines)")
    except:
        print("❌ Cannot parse CSV. Recreating file...")
        # Create fresh CSV with proper headers
        df = pd.DataFrame(columns=['Date', 'Time', 'Application', 'Window Title', 'Usage Minutes'])
        df.to_csv("laptop_usage.csv", index=False)
        print("✓ Created new laptop_usage.csv")
        print("⚠ Please run collect_usage.py to start collecting data")
        exit()

except FileNotFoundError:
    print("❌ laptop_usage.csv not found!")
    print("⚠ Please run collect_usage.py first to create the file")
    exit()

# ---------- VALIDATE REQUIRED COLUMNS ----------
required_columns = ['Date', 'Application', 'Usage Minutes']
missing_columns = [col for col in required_columns if col not in df.columns]

if missing_columns:
    print(f"❌ Missing required columns: {missing_columns}")
    print(f"Current columns: {list(df.columns)}")
    print("\n⚠ Your CSV file structure is incorrect.")
    print("Expected columns: Date, Time, Application, Window Title, Usage Minutes")
    print("\nPlease:")
    print("1. Delete or rename the old laptop_usage.csv")
    print("2. Run collect_usage.py to create a fresh file")
    exit()

# Check if data is empty
if len(df) == 0:
    print("⚠ CSV file is empty!")
    print("Please run collect_usage.py to start collecting data")
    exit()

# ---------- CLEAN DATA ----------
print("\nCleaning data...")

# Handle missing values
df["Application"] = df["Application"].fillna("Unknown")
df["Usage Minutes"] = pd.to_numeric(df["Usage Minutes"], errors='coerce').fillna(1)

# Clean application names
df["Application"] = df["Application"].astype(str).str.strip()
df["Application"] = df["Application"].str.replace("●", "", regex=False)
df["Application"] = df["Application"].replace("", "Unknown")

# Normalize common app names
df["Application"] = df["Application"].str.replace(
    r".*Visual Studio Code.*", "Visual Studio Code", regex=True, case=False
)
df["Application"] = df["Application"].str.replace(
    r".*Chrome.*", "Google Chrome", regex=True, case=False
)
df["Application"] = df["Application"].str.replace(
    r".*Firefox.*", "Firefox", regex=True, case=False
)
df["Application"] = df["Application"].str.replace(
    r".*Spotify.*", "Spotify", regex=True, case=False
)

# Convert date
try:
    df["Date"] = pd.to_datetime(df["Date"], errors='coerce')
    # Remove rows with invalid dates
    df = df.dropna(subset=['Date'])
except:
    print("⚠ Warning: Could not parse dates properly")

print(f"✓ Cleaned data: {len(df)} valid records")

# ---------- CALCULATIONS ----------
print("\nCalculating statistics...")

# Sum up all usage minutes for each date
daily_total = df.groupby("Date")["Usage Minutes"].sum().sort_index()

# Weekly totals
df['Week'] = df['Date'].dt.isocalendar().week
df['Year'] = df['Date'].dt.isocalendar().year
weekly_total = df.groupby(['Year', 'Week'])["Usage Minutes"].sum()
weekly_total.index = weekly_total.index.map(lambda x: f"{x[0]}-W{x[1]:02d}")

# Application usage - sum all minutes for each app
app_usage = df.groupby("Application")["Usage Minutes"].sum().sort_values(ascending=False)

# ---------- THRESHOLD ----------
THRESHOLD = 10   # minutes

low_usage = app_usage[app_usage < THRESHOLD]
high_usage = app_usage[app_usage >= THRESHOLD]

print(f"✓ Total applications tracked: {len(app_usage)}")
print(f"✓ High usage apps (≥{THRESHOLD} min): {len(high_usage)}")
print(f"✓ Low usage apps (<{THRESHOLD} min): {len(low_usage)}")
print(f"✓ Total usage time: {app_usage.sum():.1f} minutes ({app_usage.sum()/60:.1f} hours)")

# ---------- MENU ----------
print("\n" + "=" * 40)
print("===== USAGE TRACKER =====")
print("=" * 40)
print("1 → Daily usage")
print("2 → Weekly usage")
print("3 → App usage (all)")
print("4 → Low usage apps (<10 min)")
print("5 → High usage apps (>=10 min)")
print("6 → App usage graph")
print("7 → Top 10 apps")
print("8 → Show CSV info (debug)")
print("=" * 40)

choice = input("\nEnter choice (1-8): ")

# ---------- OPTIONS ----------
if choice == "1":
    print("\n📅 DAILY USAGE:")
    print("-" * 40)
    for date, minutes in daily_total.items():
        hours = minutes / 60
        print(f"{date.strftime('%Y-%m-%d')}: {minutes:6.1f} min ({hours:.1f} hrs)")
    print("-" * 40)
    print(f"Total: {daily_total.sum():.1f} minutes ({daily_total.sum()/60:.1f} hours)")

elif choice == "2":
    print("\n📊 WEEKLY USAGE:")
    print("-" * 40)
    for week, minutes in weekly_total.items():
        hours = minutes / 60
        print(f"{week}: {minutes:6.1f} min ({hours:.1f} hrs)")
    print("-" * 40)
    print(f"Total: {weekly_total.sum():.1f} minutes ({weekly_total.sum()/60:.1f} hours)")

elif choice == "3":
    print("\n📱 ALL APPLICATION USAGE:")
    print("-" * 40)
    for app, minutes in app_usage.items():
        hours = minutes / 60
        print(f"{app:30s}: {minutes:6.1f} min ({hours:.2f} hrs)")
    print("-" * 40)
    print(f"Total: {app_usage.sum():.1f} minutes")

elif choice == "4":
    print(f"\n⚠️  LOW USAGE APPS (< {THRESHOLD} minutes):")
    print("-" * 40)
    if low_usage.empty:
        print("No low usage apps found!")
    else:
        for app, minutes in low_usage.items():
            print(f"{app:30s}: {minutes:6.1f} min")
    print("-" * 40)
    print(f"Count: {len(low_usage)} apps")

elif choice == "5":
    print(f"\n🔥 HIGH USAGE APPS (≥ {THRESHOLD} minutes):")
    print("-" * 40)
    if high_usage.empty:
        print("No high usage apps found!")
    else:
        for app, minutes in high_usage.items():
            hours = minutes / 60
            print(f"{app:30s}: {minutes:6.1f} min ({hours:.2f} hrs)")
    print("-" * 40)
    print(f"Count: {len(high_usage)} apps")
    print(f"Total: {high_usage.sum():.1f} minutes ({high_usage.sum()/60:.1f} hours)")

elif choice == "6":
    print("\n📊 Generating graph...")
    
    # Show top apps or low usage apps
    if len(high_usage) > 0:
        top_10 = high_usage.head(10)
        
        plt.figure(figsize=(10, 6))
        top_10.sort_values().plot(kind="barh", color='steelblue')
        plt.xlabel("Usage Minutes")
        plt.title("Top 10 Applications by Usage Time")
        plt.tight_layout()
        
        os.makedirs("reports", exist_ok=True)
        plt.savefig("reports/app_usage_chart.png", dpi=150, bbox_inches='tight')
        print("✓ Chart saved to: reports/app_usage_chart.png")
        plt.show()
    else:
        print("No data to display!")

elif choice == "7":
    print("\n🏆 TOP 10 APPLICATIONS:")
    print("-" * 40)
    top_10 = app_usage.head(10)
    for i, (app, minutes) in enumerate(top_10.items(), 1):
        hours = minutes / 60
        percentage = (minutes / app_usage.sum()) * 100
        print(f"{i:2d}. {app:25s}: {minutes:6.1f} min ({hours:.2f} hrs) - {percentage:.1f}%")
    print("-" * 40)
    print(f"Top 10 total: {top_10.sum():.1f} min out of {app_usage.sum():.1f} min total")

elif choice == "8":
    print("\n🔍 CSV FILE DEBUG INFO:")
    print("-" * 40)
    print(f"Total rows: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    print(f"Date range: {df['Date'].min()} to {df['Date'].max()}")
    print("\nFirst 5 rows:")
    print(df.head())
    print("\nData types:")
    print(df.dtypes)

else:
    print("\n❌ Invalid choice. Please enter 1-8.")

# ---------- SAVE REPORTS ----------
print("\n💾 Saving reports...")
os.makedirs("reports", exist_ok=True)

daily_total.to_csv("reports/daily_usage.csv", header=['Usage Minutes'])
weekly_total.to_csv("reports/weekly_usage.csv", header=['Usage Minutes'])
app_usage.to_csv("reports/app_usage.csv", header=['Usage Minutes'])
low_usage.to_csv("reports/low_usage.csv", header=['Usage Minutes'])
high_usage.to_csv("reports/high_usage.csv", header=['Usage Minutes'])

print("✓ Reports saved to 'reports/' folder")
print("\n" + "=" * 40)
print("Analysis complete!")
print("=" * 40)