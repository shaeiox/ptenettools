import psutil
import os
import time
from collections import defaultdict
from adapter import get_network_interface_type
from flask import Flask, jsonify

app = Flask(__name__)

# ذخیره داده‌های پهنای باند
bandwidth_data = {
    "applications": [],
    "timestamp": 0
}


def monitor_bandwidth():
    app_bandwidth = defaultdict(lambda: {'download': 0, 'upload': 0})
    prev_counters = {}

    try:
        print("در حال مانیتورینگ پهنای باند... (برای خروج، Ctrl+C بزنید)")
        while True:
            time.sleep(1)

            # دریافت اطلاعات تمام پردازش‌ها
            for proc in psutil.process_iter(attrs=['pid', 'name']):
                try:
                    pid = proc.info['pid']
                    name = proc.info['name']
                    counters = proc.io_counters()

                    if pid not in prev_counters:
                        prev_counters[pid] = counters
                        continue

                    # میزان دانلود و آپلود واقعی پردازش
                    upload = counters.read_bytes - prev_counters[pid].read_bytes  # دانلود
                    download = counters.write_bytes - prev_counters[pid].write_bytes  # آپلود

                    prev_counters[pid] = counters  # به‌روزرسانی مقدار قبلی

                    if download > 0 or upload > 0:
                        app_bandwidth[name]['download'] += download
                        app_bandwidth[name]['upload'] += upload

                except (psutil.NoSuchProcess, psutil.AccessDenied, AttributeError):
                    continue

            # پاک نکردن کل صفحه، بلکه فقط نمایش داده‌های جدید
            print("\n" + "="*50)
            print("برنامه‌های فعال روی شبکه و میزان مصرف:")
            print("="*50)

            for app, usage in app_bandwidth.items():
                print(f"{app}: دانلود {usage['download'] / (1024 * 1024):.2f} MB | آپلود {usage['upload'] / (1024 * 1024):.2f} MB")


            # اضافه کردن کد جدید برای ذخیره داده برای وب API
            apps_list = []
            for app, usage in app_bandwidth.items():
                apps_list.append({
                    "name": app,
                    "download": round(usage['download'] / (1024 * 1024), 2),  # تبدیل به MB
                    "upload": round(usage['upload'] / (1024 * 1024), 2)  # تبدیل به MB
                })
            
            # مرتب‌سازی براساس مجموع دانلود و آپلود (نزولی)
            apps_list.sort(key=lambda x: x["download"] + x["upload"], reverse=True)
            
            # محدود کردن به 10 برنامه‌ای که بیشترین مصرف را دارند
            bandwidth_data["applications"] = apps_list[:10]
            bandwidth_data["timestamp"] = time.time()

    except KeyboardInterrupt:
        print("\nبرنامه متوقف شد.")
        exit(0)

@app.route('/api/bandwidth', methods=['GET'])
def get_bandwidth():
    return jsonify(bandwidth_data)

if __name__ == "__main__":
    # شروع مانیتورینگ در یک ترد جداگانه
    import threading
    bandwidth_thread = threading.Thread(target=monitor_bandwidth)
    bandwidth_thread.daemon = True
    bandwidth_thread.start()
    
    # شروع سرور Flask
    app.run(host='127.0.0.1', port=5000)