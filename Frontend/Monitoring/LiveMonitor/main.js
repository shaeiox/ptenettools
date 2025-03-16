const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow, secondWindow;

// تابع ایجاد پنجره‌ها
function createWindow() {
    // پنجره اول
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 700,
      frame: false, // حذف تایتل بار
      webPreferences: {
        nodeIntegration: true
      }
    });

    // بارگذاری فایل HTML پنجره اول
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // پنجره دوم
    secondWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false, // پنجره دوم به‌طور پیش‌فرض مخفی باشد
      webPreferences: {
        nodeIntegration: true,
      },
    });

    // بارگذاری فایل HTML پنجره دوم
    secondWindow.loadFile(path.join(__dirname, 'index2.html'));
}

// هنگامی که اپلیکیشن آماده شد پنجره‌ها ایجاد شوند
app.whenReady().then(createWindow);

// اگر پنجره‌ها بسته شوند، برنامه را می‌بندیم (مخصوص سیستم‌های غیر از macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ارتباط بین پنجره‌ها با استفاده از ipcMain
ipcMain.on('show-window-2', () => {
  mainWindow.hide(); // مخفی کردن پنجره اول
  secondWindow.show(); // نمایش پنجره دوم
});

ipcMain.on('show-window-1', () => {
  secondWindow.hide(); // مخفی کردن پنجره دوم
  mainWindow.show(); // نمایش پنجره اول
});
