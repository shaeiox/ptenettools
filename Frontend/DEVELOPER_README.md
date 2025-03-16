# PTE Net Tools - Developer Guide

This technical guide explains the architecture of the PTE Net Tools Electron application, helping you locate and modify different components of the codebase.

## Application Architecture

The application follows a multi-page Electron structure with the following flow:

1. **Main Process** (`main.js`): Controls the application lifecycle and determines which page to load
2. **Firstpage**: Entry point for new users to select services
3. **Loginpage**: Collects and saves username information
4. **Homepage**: Main dashboard displayed to users with established usernames

## File Structure Overview

```
Frontend/
├── main.js                   # Main Electron process
├── package.json              # Project dependencies and scripts
├── Firstpage/                # Service selection page
│   ├── index.html            # Page structure
│   ├── script.js             # Page behavior
│   └── styles.css            # Page styling
├── Loginpage/                # Username input page
│   ├── index.html            # Page structure
│   ├── script.js             # Page behavior
│   └── styles.css            # Page styling
├── Homepage/                 # Main dashboard
│   ├── index.html            # Page structure
│   ├── script.js             # Page behavior
│   └── styles.css            # Page styling
└── ... (other directories)
```

## Main Process (`main.js`)

The main Electron process handles:

- **Window creation**: `createWindow()` (line ~12)
- **Page routing logic**: `loadStartPage()` (line ~37)
- **User data storage**: `saveUserData()` (line ~61)
- **IPC communication**:
  - `save-username` (saves username and routes to Homepage)
  - `get-username` (retrieves saved username)
  - `update-username` (updates existing username)
  - `remove-username` (removes username data entirely)

## Username Management

Username is stored locally in the user's application data folder without need for a server:

1. **Storage location**: `userDataPath` defined in `main.js`
2. **Save mechanism**: 
   - In `Loginpage/script.js` via `handleLogin()` function (line ~121)
   - In `Homepage/script.js` via `saveNewUsername()` function (line ~982)
3. **Retrieval**: `get-username` IPC handler in `main.js`
4. **Display**: `loadUsername()` function in `Homepage/script.js` (line ~967)
5. **Removal**: 
   - In `Homepage/script.js` via `removeUsername()` function (line ~326)
   - Removes the username data file entirely via the `remove-username` IPC channel
   - Includes a confirmation dialog and removal animation

## Page-specific Logic

### Firstpage

- Entry point for users without a username
- Navigation to Loginpage is already implemented

### Loginpage (`Loginpage/script.js`)

- **UI Initialization**: `initUI()` (line ~14)
- **Event Handlers**: `setupEventListeners()` (line ~44)
- **Form Validation**: `isValidPhoneNumber()` (line ~67)
- **Login Handler**: `handleLogin()` (line ~121)
  - This saves the username using Electron IPC

### Homepage (`Homepage/script.js`)

- **User Profile Management**:
  - Initialize: `initUserProfile()` (line ~911)
  - Load username: `loadUsername()` (line ~967)
  - Update username: `saveNewUsername()` (line ~982)
  - Remove username: `removeUsername()` (line ~326)
- **UI Components**:
  - Theme switching
  - Time display
  - Cards and animations
  - System stats

## Common Modification Scenarios

### 1. Changing the Username Format

Modify the validation in `Loginpage/script.js`:
```javascript
function isValidPhoneNumber(input) {
    // Edit this function to change validation rules
    const cleanedInput = input.replace(/\D/g, '');
    return /^\d{10,12}$/.test(cleanedInput);
}
```

### 2. Adding More User Data

To store additional user data beyond just the username:

1. Update the object structure in `saveUserData()` in `main.js`
2. Add relevant IPC handlers for the new data fields
3. Update UI components to display/edit the new fields

### 3. Changing the Starting Page Logic

To modify when to start from Homepage vs Firstpage:

```javascript
// In main.js, modify the loadStartPage() function
function loadStartPage() {
    let userData = { username: null };
    
    try {
        if (fs.existsSync(userDataPath)) {
            const data = fs.readFileSync(userDataPath, 'utf8');
            userData = JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading user data:', error);
    }

    // Modify this logic to change when to start from Homepage vs Firstpage
    if (userData.username) {
        mainWindow.loadFile(path.join(__dirname, 'Homepage', 'index.html'));
    } else {
        mainWindow.loadFile(path.join(__dirname, 'Firstpage', 'index.html'));
    }
}
```

### 4. Adding UI Elements to Username Modal

To add fields to the username edit modal:

1. Modify `Homepage/index.html` to add new form fields in the modal
2. Update the CSS styles in `Homepage/styles.css` for new elements
3. Add behavior in `saveNewUsername()` function in `Homepage/script.js`

### 5. Modifying the Username Removal Process

To change the username removal functionality:

1. Edit the delete confirmation dialog in `Homepage/index.html`
2. Modify the `removeUsername()` function in `Homepage/script.js`
3. Adjust the removal animation in `Homepage/styles.css` (`.user-profile-card.removing` class)
4. Update the IPC handler for `remove-username` in `main.js` if server-side behavior needs to change

## CSS Styling Reference

All styling is defined in respective `styles.css` files:

- **User Profile**: `.user-profile` (line ~1050 in Homepage/styles.css)
- **Edit Modal**: `.modal` and related classes (line ~1109 in Homepage/styles.css)
- **Delete Confirmation**: `.delete-confirmation` (line ~1699 in Homepage/styles.css)
- **Theme-specific styles**: Via `[data-theme="light"]` selector

## Debugging Tips

1. **Enable DevTools**: Uncomment this line in `main.js` to show developer tools:
   ```javascript
   // mainWindow.webContents.openDevTools();
   ```

2. **Check User Data File**: Look in the app's user data directory to inspect saved data:
   - Windows: `%APPDATA%\pte-net-tools\user-preferences.json`
   - macOS: `~/Library/Application Support/pte-net-tools/user-preferences.json`
   - Linux: `~/.config/pte-net-tools/user-preferences.json`

3. **IPC Debugging**: Add console logs to trace IPC messages:
   ```javascript
   // In main.js
   ipcMain.on('save-username', (event, username) => {
     console.log('Saving username:', username);
     // ...
   });
   ```

4. **Test Username Removal**: To debug the username removal process:
   ```javascript
   // In Homepage/script.js
   console.log('Removing username started');
   ipcRenderer.send('remove-username');
   ```

## Build Configuration

The build configuration is defined in `package.json` under the `build` key. Modify these settings to customize how the application is packaged. 