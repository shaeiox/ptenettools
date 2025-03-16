const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { spawn } = require('child_process');

// Path to store user data
const userDataPath = path.join(app.getPath('userData'), 'user-preferences.json');

// Global window object to prevent garbage collection
let mainWindow;

// Global reference to the Python process
let pythonProcess = null;

// Function to start the Python server
function startPythonServer() {
  // Get the absolute path to the Python script
  const scriptPath = path.join(__dirname, '..', 'Backend', 'live_monitor.py');
  
  // Check if the file exists
  if (!fs.existsSync(scriptPath)) {
    console.error(`Python script not found at: ${scriptPath}`);
    return;
  }
  
  console.log(`Starting Python server from: ${scriptPath}`);
  
  // Determine the Python executable based on platform
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
  
  // Spawn the Python process
  pythonProcess = spawn(pythonExecutable, [scriptPath], {
    // Use detached mode to keep the process running independently
    detached: process.platform !== 'win32',
    // Inherit stdio to see output in the console
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Handle stdout
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
  });
  
  // Handle stderr
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });
  
  // Handle process exit
  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    pythonProcess = null;
  });
  
  // Handle process error
  pythonProcess.on('error', (err) => {
    console.error(`Failed to start Python process: ${err}`);
    pythonProcess = null;
  });
  
  // On non-Windows platforms, we need to unref to allow the child to run independently
  if (process.platform !== 'win32' && pythonProcess.unref) {
    pythonProcess.unref();
  }
  
  return pythonProcess;
}

// Start Python server immediately when the app is ready
app.whenReady().then(() => {
  // Set application menu to null to remove the default menu
  Menu.setApplicationMenu(null);
  
  // Start the Python server first thing
  startPythonServer();
  
  // Then create the window
  createWindow();
});

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false, // Allow loading local resources
      allowRunningInsecureContent: true // Allow running insecure content
    },
    // Remove the menu bar from the window
    autoHideMenuBar: true
  });

  // Load the appropriate starting page based on whether username exists
  loadStartPage();

  // Reset sidebar state when app starts
  mainWindow.webContents.on('did-finish-load', () => {
    // Clear the sidebar state to ensure it starts in the default state
    mainWindow.webContents.executeJavaScript(`
      localStorage.removeItem('sidebarExpanded');
      if (document.querySelector('.sidebar')) {
        document.querySelector('.sidebar').classList.remove('active');
      }
    `);
  });

  // Open DevTools in development mode for debugging
  // Uncomment this line to help debug issues
  // mainWindow.webContents.openDevTools();

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Check if the URL is from an internal link that should be opened within the app
    // This is a fallback in case the event listener in script.js doesn't catch it
    if ((url.includes('pishgaman.net/category') && 
         url.includes('%d9%85%d9%82%d8%a7%d9%84%d8%a7%d8%aa-%d8%a2%d9%85%d9%88%d8%b2%d8%b4%db%8c')) || 
        (url.includes('pishgaman.net') && 
         url.includes('%d8%b1%d8%a7%d9%87%d9%86%d9%85%d8%a7%db%8c-%d8%a7%d8%b3%d8%aa%d9%81%d8%a7%d8%af%d9%87-%d8%a7%d8%b2-%d9%be%d9%86%d9%84-%da%a9%d8%a7%d8%b1%d8%a8%d8%b1%db%8c')) ||
        url.includes('speedtest.pishgaman.net')) {
      // Allow opening within the Electron window
      return { action: 'allow' };
    }
    
    // Open other external URLs in the default browser
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    
    return { action: 'allow' };
  });
}

// Check if user data exists and load appropriate page
function loadStartPage() {
  let userData = { username: null };
  
  // Try to read existing user data
  try {
    if (fs.existsSync(userDataPath)) {
      const data = fs.readFileSync(userDataPath, 'utf8');
      userData = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading user data:', error);
  }

  // Determine which page to load
  if (userData.username) {
    // If username exists, load Homepage
    mainWindow.loadFile(path.join(__dirname, 'Homepage', 'index.html'));
  } else {
    // If no username, load Firstpage
    mainWindow.loadFile(path.join(__dirname, 'Firstpage', 'index.html'));
  }
}

// Save user data to file
function saveUserData(userData) {
  try {
    fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2), 'utf8');
    console.log('User data saved successfully');
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Kill the Python process when the app is closed
  if (pythonProcess) {
    console.log('Terminating Python process...');
    
    // Use different termination methods based on platform
    if (process.platform === 'win32') {
      // On Windows, we need to use taskkill to ensure child processes are also terminated
      spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t']);
    } else {
      // On Unix-like systems, we can just kill the process group
      process.kill(-pythonProcess.pid);
    }
    
    pythonProcess = null;
  }
  
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Add a new IPC handler to check if the Python server is running
ipcMain.handle('check-python-server', async (event) => {
  return { running: pythonProcess !== null };
});

// Add a new IPC handler to restart the Python server if needed
ipcMain.handle('restart-python-server', async (event) => {
  if (pythonProcess) {
    // Kill the existing process
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t']);
    } else {
      process.kill(-pythonProcess.pid);
    }
    pythonProcess = null;
  }
  
  // Start a new process
  startPythonServer();
  
  return { success: true };
});

// Existing IPC Handlers
ipcMain.on('save-username', (event, username) => {
  saveUserData({ username });
  mainWindow.loadFile(path.join(__dirname, 'Homepage', 'index.html'));
});

ipcMain.on('get-username', (event) => {
  try {
    if (fs.existsSync(userDataPath)) {
      const data = fs.readFileSync(userDataPath, 'utf8');
      const userData = JSON.parse(data);
      event.returnValue = userData.username || null;
    } else {
      event.returnValue = null;
    }
  } catch (error) {
    console.error('Error reading username:', error);
    event.returnValue = null;
  }
});

ipcMain.on('update-username', (event, username) => {
  saveUserData({ username });
  event.reply('username-updated');
});

// Add handler for opening User Panel in a new BrowserWindow
ipcMain.on('open-user-panel-window', (event, options) => {
  try {
    // Create a new browser window for the user panel
    const userPanelWindow = new BrowserWindow({
      width: options.width || 1200,
      height: options.height || 800,
      center: true, // Center the window on the screen
      title: 'پنل کاربری پیشگامان',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true
      }
    });

    // Load the URL
    userPanelWindow.loadURL(options.url);
    
    // Remove the menu bar for a cleaner look
    userPanelWindow.setMenuBarVisibility(false);
    
    // Handle window close
    userPanelWindow.on('closed', () => {
      // Clean up references
    });

    event.reply('user-panel-window-opened', { success: true });
  } catch (error) {
    console.error('Error opening User Panel window:', error);
    event.reply('user-panel-window-opened', { success: false, error: error.message });
    
    // Fallback to external browser if BrowserWindow fails
    try {
      shell.openExternal(options.url);
    } catch (shellError) {
      console.error('Error opening in external browser:', shellError);
    }
  }
});

// Keep the existing open-user-panel handler for backward compatibility
ipcMain.on('open-user-panel', (event, options) => {
  try {
    // Use shell.openExternal to open URL in default browser
    shell.openExternal(options.url);
    event.reply('user-panel-opened', { success: true });
  } catch (error) {
    console.error('Error opening User Panel:', error);
    event.reply('user-panel-opened', { success: false, error: error.message });
  }
});

// Add handler for removing username
ipcMain.on('remove-username', (event) => {
  try {
    // Delete the user data file if it exists
    if (fs.existsSync(userDataPath)) {
      fs.unlinkSync(userDataPath);
      console.log('User data deleted successfully');
    }
    
    // You can add a reply if needed
    // event.reply('username-removed');
  } catch (error) {
    console.error('Error removing user data:', error);
  }
});

// Add a new IPC handler for opening educational articles
ipcMain.on('open-educational-articles', (event, options) => {
  try {
    // Check if we should open in a new window or in the main window
    if (options.newWindow) {
      // Create a new browser window for the educational articles
      const articlesWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        center: true,
        title: 'مقالات آموزشی',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true
        }
      });

      // Load the URL
      articlesWindow.loadURL(options.url);
      
      // Remove the menu bar for a cleaner look
      articlesWindow.setMenuBarVisibility(false);
      
      event.reply('educational-articles-opened', { success: true });
    } else {
      // Use the main window to navigate
      mainWindow.loadURL(options.url);
      event.reply('educational-articles-opened', { success: true });
    }
  } catch (error) {
    console.error('Error opening educational articles:', error);
    event.reply('educational-articles-opened', { success: false, error: error.message });
  }
}); 