import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import time
import os

st.set_page_config(page_title="Usage Dashboard", layout="wide", page_icon="💻📱")

# Auto-refresh every 60 seconds
st.markdown("""
<meta http-equiv="refresh" content="60">
""", unsafe_allow_html=True)

# Custom CSS
st.markdown("""
<style>
    .metric-card {
        background-color: #f0f2f6;
        padding: 20px;
        border-radius: 10px;
        margin: 10px 0;
    }
    .stMetric {
        background-color: #ffffff;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .device-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        margin-left: 8px;
    }
    .laptop-badge {
        background-color: #667eea;
        color: white;
    }
    .mobile-badge {
        background-color: #764ba2;
        color: white;
    }
</style>
""", unsafe_allow_html=True)

st.title("💻📱 Laptop & Mobile Usage Dashboard")

# Show last update time
last_update = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
st.caption(f"Last updated: {last_update} • Auto-refreshes every 60 seconds")

# -------- LOAD LAPTOP DATA --------
try:
    # Load raw data
    df = pd.read_csv("laptop_usage.csv")
    df["Date"] = pd.to_datetime(df["Date"])
    
    # Clean application names
    df["Application"] = df["Application"].str.strip()
    df["Application"] = df["Application"].str.replace("●", "", regex=False)
    df["Application"] = df["Application"].replace("", "Unknown")
    
    # Load aggregated reports
    daily = pd.read_csv("reports/daily_usage.csv", index_col=0)
    weekly = pd.read_csv("reports/weekly_usage.csv", index_col=0)
    app = pd.read_csv("reports/app_usage.csv", index_col=0).sort_values("Usage Minutes", ascending=False)
    low = pd.read_csv("reports/low_usage.csv", index_col=0)
    high = pd.read_csv("reports/high_usage.csv", index_col=0)
    
    # Calculate totals
    total_minutes = app["Usage Minutes"].sum()
    total_hours = total_minutes / 60
    total_apps = len(app)
    
    laptop_data_available = True
    
except FileNotFoundError:
    st.error("❌ Laptop data files not found! Please run `collect_usage.py` first to start tracking.")
    st.info("💡 Run: `python collect_usage.py` in the background to collect usage data")
    laptop_data_available = False

# -------- LOAD MOBILE DATA --------
mobile_data_available = False
mobile_low_data_available = False

# Try to load mobile data from downloaded CSV
if os.path.exists("mobile_usage.csv"):
    try:
        mobile_df = pd.read_csv("mobile_usage.csv")
        # Expected columns: Date, Device, Application, Usage Minutes, Period
        mobile_data_available = True
        
        # Calculate mobile stats
        mobile_total_minutes = mobile_df["Usage Minutes"].sum()
        mobile_total_hours = mobile_total_minutes / 60
        mobile_total_apps = len(mobile_df)
        
    except Exception as e:
        st.warning(f"⚠️ Error loading mobile_usage.csv: {e}")

# Try to load mobile low usage data
if os.path.exists("mobile_low_usage.csv"):
    try:
        mobile_low_df = pd.read_csv("mobile_low_usage.csv")
        # Expected columns: Date, Application, Usage Minutes
        mobile_low_data_available = True
    except Exception as e:
        st.warning(f"⚠️ Error loading mobile_low_usage.csv: {e}")

# -------- SUMMARY METRICS --------
st.header("📊 Summary")

col1, col2, col3, col4 = st.columns(4)

with col1:
    if laptop_data_available:
        st.metric("💻 Laptop Usage", f"{total_hours:.1f} hrs", f"{total_minutes:.0f} min")
    else:
        st.metric("💻 Laptop Usage", "No data", "0 min")

with col2:
    if mobile_data_available:
        st.metric("📱 Mobile Usage", f"{mobile_total_hours:.1f} hrs", f"{mobile_total_minutes:.0f} min")
    else:
        st.metric("📱 Mobile Usage", "No data", "0 min")

with col3:
    if laptop_data_available and mobile_data_available:
        combined_apps = total_apps + mobile_total_apps
        st.metric("Total Apps", combined_apps, f"L:{total_apps} M:{mobile_total_apps}")
    elif laptop_data_available:
        st.metric("Total Apps", total_apps, "Laptop only")
    elif mobile_data_available:
        st.metric("Total Apps", mobile_total_apps, "Mobile only")
    else:
        st.metric("Total Apps", 0)

with col4:
    if laptop_data_available:
        st.metric("Days Tracked", len(daily))
    else:
        st.metric("Days Tracked", 0)

st.divider()

# -------- SIDEBAR --------
st.sidebar.title("🧭 Navigation")
st.sidebar.info("💡 Dashboard auto-refreshes every 60 seconds")

option = st.sidebar.radio(
    "Select View",
    ["📊 Overview", "💻 Laptop Usage", "📱 Mobile Usage", "🔍 Comparison",
     "⚠️ Low Usage Apps", "📅 Daily/Weekly Trends", "📊 Detailed Charts"]
)

# Add refresh button
if st.sidebar.button("🔄 Refresh Now"):
    st.rerun()

st.sidebar.divider()

# Data status
st.sidebar.subheader("📁 Data Status")
if laptop_data_available:
    st.sidebar.success("✅ Laptop data loaded")
else:
    st.sidebar.error("❌ No laptop data")

if mobile_data_available:
    st.sidebar.success("✅ Mobile data loaded")
else:
    st.sidebar.warning("⚠️ No mobile data")

if not mobile_data_available:
    st.sidebar.info("💡 To add mobile data:\n1. Export CSV from Android app\n2. Save as mobile_usage.csv\n3. Place in dashboard folder")

# -------- OVERVIEW --------
if option == "📊 Overview":
    st.header("📊 Usage Overview - Both Devices")
    
    col1, col2 = st.columns(2)
    
    # LAPTOP TOP 5
    with col1:
        st.markdown("### 💻 Top 5 Laptop Apps")
        if laptop_data_available:
            top_5 = app.head(5)
            for i, (app_name, row) in enumerate(top_5.iterrows(), 1):
                minutes = row["Usage Minutes"]
                hours = minutes / 60
                percentage = (minutes / total_minutes) * 100
                st.metric(
                    f"{i}. {app_name}", 
                    f"{hours:.1f} hrs",
                    f"{percentage:.1f}%"
                )
        else:
            st.info("No laptop data available")
    
    # MOBILE TOP 5
    with col2:
        st.markdown("### 📱 Top 5 Mobile Apps")
        if mobile_data_available:
            mobile_sorted = mobile_df.sort_values("Usage Minutes", ascending=False).head(5)
            for i, row in enumerate(mobile_sorted.itertuples(), 1):
                minutes = row._4  # Usage Minutes column
                hours = minutes / 60
                percentage = (minutes / mobile_total_minutes) * 100
                st.metric(
                    f"{i}. {row.Application}",
                    f"{hours:.1f} hrs",
                    f"{percentage:.1f}%"
                )
        else:
            st.info("No mobile data available")
    
    st.divider()
    
    # PIE CHARTS
    col1, col2 = st.columns(2)
    
    with col1:
        if laptop_data_available:
            st.subheader("💻 Laptop Distribution")
            fig = px.pie(
                app.head(10), 
                values="Usage Minutes", 
                names=app.head(10).index,
                title="Top 10 Laptop Apps",
                color_discrete_sequence=px.colors.sequential.Blues_r
            )
            st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        if mobile_data_available:
            st.subheader("📱 Mobile Distribution")
            fig = px.pie(
                mobile_df.head(10),
                values="Usage Minutes",
                names="Application",
                title="Top 10 Mobile Apps",
                color_discrete_sequence=px.colors.sequential.Purples_r
            )
            st.plotly_chart(fig, use_container_width=True)

# -------- LAPTOP USAGE --------
elif option == "💻 Laptop Usage":
    if not laptop_data_available:
        st.error("❌ No laptop data available")
        st.stop()
    
    st.header("💻 Laptop Usage Analysis")
    
    # Stats
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Apps", total_apps)
    with col2:
        st.metric("High Usage Apps (≥10 min)", len(high))
    with col3:
        st.metric("Low Usage Apps (<10 min)", len(low))
    
    # Top apps chart
    st.subheader("Top Applications")
    top_n = st.slider("Show top N apps", 5, 20, 10)
    
    top_apps = app.head(top_n)
    fig = px.bar(
        top_apps,
        x="Usage Minutes",
        y=top_apps.index,
        orientation='h',
        title=f"Top {top_n} Laptop Applications",
        labels={"Usage Minutes": "Minutes", "index": "Application"}
    )
    fig.update_layout(yaxis={'categoryorder':'total ascending'})
    st.plotly_chart(fig, use_container_width=True)
    
    # Full table
    st.subheader("All Laptop Applications")
    app_display = app.copy()
    app_display["Hours"] = app_display["Usage Minutes"] / 60
    app_display["Percentage"] = (app_display["Usage Minutes"] / total_minutes) * 100
    st.dataframe(app_display, use_container_width=True)

# -------- MOBILE USAGE --------
elif option == "📱 Mobile Usage":
    if not mobile_data_available:
        st.error("❌ No mobile data available")
        st.info("""
        **To add mobile data:**
        1. Open your Android app
        2. Click 'Save Usage Data to CSV'
        3. Find the file in Downloads/UsageTrackerData/
        4. Copy mobile_usage.csv to your dashboard folder
        5. Refresh this dashboard
        """)
        st.stop()
    
    st.header("📱 Mobile Usage Analysis")
    
    # Stats
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Apps", mobile_total_apps)
    with col2:
        st.metric("Total Usage", f"{mobile_total_hours:.1f} hrs")
    with col3:
        avg_usage = mobile_df["Usage Minutes"].mean()
        st.metric("Avg per App", f"{avg_usage:.0f} min")
    
    # Top apps chart
    st.subheader("Top Mobile Applications")
    top_n = st.slider("Show top N apps", 5, 20, 10, key="mobile_slider")
    
    mobile_sorted = mobile_df.sort_values("Usage Minutes", ascending=False).head(top_n)
    fig = px.bar(
        mobile_sorted,
        x="Usage Minutes",
        y="Application",
        orientation='h',
        title=f"Top {top_n} Mobile Applications",
        color_discrete_sequence=['#764ba2']
    )
    fig.update_layout(yaxis={'categoryorder':'total ascending'})
    st.plotly_chart(fig, use_container_width=True)
    
    # Full table
    st.subheader("All Mobile Applications")
    mobile_display = mobile_df.copy()
    mobile_display["Hours"] = mobile_display["Usage Minutes"] / 60
    mobile_display["Percentage"] = (mobile_display["Usage Minutes"] / mobile_total_minutes) * 100
    st.dataframe(
        mobile_display.sort_values("Usage Minutes", ascending=False),
        use_container_width=True,
        hide_index=True
    )

# -------- COMPARISON --------
elif option == "🔍 Comparison":
    st.header("🔍 Laptop vs Mobile Comparison")
    
    if not laptop_data_available and not mobile_data_available:
        st.error("❌ No data available for comparison")
        st.stop()
    
    # Summary comparison
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.subheader("📊 Total Usage")
        if laptop_data_available:
            st.metric("💻 Laptop", f"{total_hours:.1f} hrs")
        if mobile_data_available:
            st.metric("📱 Mobile", f"{mobile_total_hours:.1f} hrs")
    
    with col2:
        st.subheader("📱 Total Apps")
        if laptop_data_available:
            st.metric("💻 Laptop", total_apps)
        if mobile_data_available:
            st.metric("📱 Mobile", mobile_total_apps)
    
    with col3:
        st.subheader("⏱️ Average Usage")
        if laptop_data_available:
            avg_laptop = app["Usage Minutes"].mean()
            st.metric("💻 Laptop", f"{avg_laptop:.0f} min")
        if mobile_data_available:
            avg_mobile = mobile_df["Usage Minutes"].mean()
            st.metric("📱 Mobile", f"{avg_mobile:.0f} min")
    
    st.divider()
    
    # Side by side top apps
    col1, col2 = st.columns(2)
    
    with col1:
        if laptop_data_available:
            st.subheader("💻 Laptop Top 10")
            top_laptop = app.head(10)
            fig = px.bar(
                top_laptop,
                x="Usage Minutes",
                y=top_laptop.index,
                orientation='h',
                color_discrete_sequence=['#667eea']
            )
            fig.update_layout(yaxis={'categoryorder':'total ascending'})
            st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        if mobile_data_available:
            st.subheader("📱 Mobile Top 10")
            mobile_sorted = mobile_df.sort_values("Usage Minutes", ascending=False).head(10)
            fig = px.bar(
                mobile_sorted,
                x="Usage Minutes",
                y="Application",
                orientation='h',
                color_discrete_sequence=['#764ba2']
            )
            fig.update_layout(yaxis={'categoryorder':'total ascending'})
            st.plotly_chart(fig, use_container_width=True)

# -------- LOW USAGE APPS --------
elif option == "⚠️ Low Usage Apps":
    st.header("⚠️ Low Usage Applications")
    
    col1, col2 = st.columns(2)
    
    # LAPTOP LOW USAGE
    with col1:
        st.subheader("💻 Laptop Low Usage (<10 min)")
        if laptop_data_available:
            st.metric("Count", len(low))
            if len(low) > 0:
                fig = px.bar(
                    low.sort_values("Usage Minutes"),
                    x="Usage Minutes",
                    y=low.sort_values("Usage Minutes").index,
                    orientation='h',
                    title="Laptop Low Usage Apps",
                    color_discrete_sequence=['orange']
                )
                st.plotly_chart(fig, use_container_width=True)
                st.dataframe(low.sort_values("Usage Minutes", ascending=False), use_container_width=True)
            else:
                st.info("No low usage apps")
        else:
            st.info("No laptop data")
    
    # MOBILE LOW USAGE
    with col2:
        st.subheader("📱 Mobile Low Usage")
        if mobile_low_data_available:
            st.metric("Count", len(mobile_low_df))
            if len(mobile_low_df) > 0:
                mobile_low_sorted = mobile_low_df.sort_values("Usage Minutes")
                fig = px.bar(
                    mobile_low_sorted,
                    x="Usage Minutes",
                    y="Application",
                    orientation='h',
                    title="Mobile Low Usage Apps",
                    color_discrete_sequence=['#ff6b6b']
                )
                st.plotly_chart(fig, use_container_width=True)
                st.dataframe(
                    mobile_low_df.sort_values("Usage Minutes", ascending=False),
                    use_container_width=True,
                    hide_index=True
                )
            else:
                st.info("No low usage apps")
        else:
            st.info("No mobile low usage data available")

# -------- DAILY/WEEKLY TRENDS --------
elif option == "📅 Daily/Weekly Trends":
    if not laptop_data_available:
        st.error("❌ No laptop data available for trends")
        st.stop()
    
    st.header("📅 Usage Trends")
    
    tab1, tab2 = st.tabs(["📅 Daily", "📈 Weekly"])
    
    with tab1:
        # Daily stats
        col1, col2, col3 = st.columns(3)
        
        with col1:
            avg_daily = daily["Usage Minutes"].mean()
            st.metric("Avg Daily", f"{avg_daily/60:.1f} hrs")
        
        with col2:
            max_daily = daily["Usage Minutes"].max()
            st.metric("Max Daily", f"{max_daily/60:.1f} hrs")
        
        with col3:
            today = datetime.now().strftime('%Y-%m-%d')
            if today in daily.index:
                today_usage = daily.loc[today, "Usage Minutes"]
                st.metric("Today", f"{today_usage/60:.1f} hrs")
            else:
                st.metric("Today", "0 hrs")
        
        # Daily chart
        fig = px.line(
            daily, 
            x=daily.index, 
            y="Usage Minutes",
            title="Daily Usage Over Time"
        )
        fig.update_traces(line_color='#1f77b4', line_width=2)
        st.plotly_chart(fig, use_container_width=True)
    
    with tab2:
        # Weekly chart
        fig = px.bar(
            weekly,
            x=weekly.index,
            y="Usage Minutes",
            title="Weekly Usage Over Time"
        )
        fig.update_traces(marker_color='steelblue')
        st.plotly_chart(fig, use_container_width=True)

# -------- DETAILED CHARTS --------
elif option == "📊 Detailed Charts":
    if not laptop_data_available:
        st.error("❌ No laptop data available")
        st.stop()
    
    st.header("📊 Detailed Usage Charts")
    
    # Hourly usage
    st.subheader("⏰ Usage by Hour of Day")
    df["Hour"] = pd.to_datetime(df["Time"], format='%H:%M:%S').dt.hour
    hourly_usage = df.groupby("Hour")["Usage Minutes"].sum()
    
    fig = px.bar(
        x=hourly_usage.index,
        y=hourly_usage.values,
        labels={"x": "Hour of Day", "y": "Usage Minutes"},
        title="Usage Distribution by Hour"
    )
    fig.update_traces(marker_color='teal')
    st.plotly_chart(fig, use_container_width=True)
    
    # Day of week
    st.subheader("📆 Usage by Day of Week")
    df["DayOfWeek"] = df["Date"].dt.day_name()
    day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    daily_usage = df.groupby("DayOfWeek")["Usage Minutes"].sum().reindex(day_order)
    
    fig = px.bar(
        x=daily_usage.index,
        y=daily_usage.values,
        labels={"x": "Day of Week", "y": "Usage Minutes"},
        title="Usage Distribution by Day of Week"
    )
    fig.update_traces(marker_color='purple')
    st.plotly_chart(fig, use_container_width=True)

# -------- FOOTER --------
st.divider()
st.caption("💡 **Tips:**")
st.caption("• Keep `collect_usage.py` running for laptop tracking")
st.caption("• Export mobile CSV from Android app regularly")
st.caption("• Dashboard auto-refreshes every 60 seconds")