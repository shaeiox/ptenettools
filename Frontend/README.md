# PTE Net Tools Electron Application

This is an Electron-based desktop application for PTE Net Tools that manages user flow based on username status.

## Flow Logic

- If a username exists, the application starts from the Homepage
- If no username exists, the application starts from the Firstpage where users can select services
- The Loginpage is used to set a username, which is saved locally
- Users can edit their username later if needed

## Installation

1. Make sure you have Node.js and npm installed on your system
2. Clone or download this repository
3. Open a terminal in the project directory
4. Install dependencies:

```
npm install
```

## Running the Application

To run the application in development mode:

```
npm start
```

## Building the Application

To build the application for distribution:

```
npm run build
```

This will create distributable files in the `dist` directory.

## Username Storage

The application stores the username locally in the user's app data folder without requiring any server or database. The username is stored in a JSON file and persists between application restarts.

## Customization

You can customize the application by modifying the following files:
- `main.js` - Main Electron application file
- `/Homepage` - Files for the main application interface
- `/Firstpage` - Files for the service selection page
- `/Loginpage` - Files for setting the username 