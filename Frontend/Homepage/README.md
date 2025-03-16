# ARKK Menu

ARKK Menu is a modern, responsive dashboard interface that provides users with an elegant, animated UI experience. This application features a sleek design with theme switching capabilities, user profile management, interactive cards, and a dynamic sidebar.

## Table of Contents

1. [Project Structure](#project-structure)
2. [File Details](#file-details)
   - [HTML Structure](#html-structure)
   - [JavaScript Functionality](#javascript-functionality)
   - [CSS Styling](#css-styling)
3. [Features](#features)
4. [Components](#components)
5. [Animation Effects](#animation-effects)
6. [Theme System](#theme-system)
7. [Customization Guide](#customization-guide)
8. [Known Issues](#known-issues)
9. [Electron Integration](#electron-integration)

## Project Structure

The project consists of three main files:

```
ARKK Menu/
│
├── index.html          # Main HTML document and UI structure
├── script.js           # JavaScript functionality and interactivity
├── styles.css          # CSS styling and animations
└── pishgaman.png       # Logo image
```

## File Details

### HTML Structure

**File: `index.html`**

The HTML file defines the structure of the dashboard with the following key components:

- **Document Head**:
  - Meta tags for character encoding and responsive design
  - Title: "ARKK Menu"
  - External resources (Font Awesome, Three.js)
  - Link to local stylesheet

- **Theme Switcher**:
  - Light/dark mode toggle buttons with icons

- **User Profile Section**:
  - Avatar with animated ripple effect
  - Username display with edit and delete functionality
  - Status indicator

- **Sidebar**:
  - Collapsible menu with hamburger icon
  - Navigation links

- **Main Content**:
  - Background elements and animations
  - Header with time display and logo
  - Welcome section with RTL text support
  - Card containers for main functionality options

- **System Stats**:
  - Hover-activated stats display for system metrics
  - Visual indicators for CPU, memory, storage, and network

- **Notification System**:
  - Animated notification with progress indicator

- **Modals**:
  - Username edit modal with form controls
  - Username deletion confirmation dialog

### JavaScript Functionality

**File: `script.js`**

The JavaScript file manages the application's behavior with these key sections:

- **Initialization Functions**:
  - `DOMContentLoaded` event handlers for various components
  - Sidebar functionality and state persistence
  - Three.js scene initialization for background effects

- **UI Components**:
  - `createContentModal()` - Creates dynamic modal windows for content
  - `setupTimeDisplay()` - Sets up Persian date and time display
  - `updateTimeElements()` - Updates time elements without page refresh
  - `setupStatsButton()` - Initializes system stats hover card

- **User Profile Management**:
  - `initUserProfile()` - Sets up user profile functionality
  - `loadUsername()` - Loads username from storage
  - `saveNewUsername()` - Saves changes to username
  - `removeUsername()` - Handles username deletion and redirection

- **Theme Management**:
  - Theme switching logic
  - Local storage persistence for user preferences

- **Event Handlers**:
  - Card click animations and modal triggers
  - Sidebar toggle and state persistence
  - Notification display timing

- **Electron Integration**:
  - IPC communication for desktop app features
  - Fallbacks for browser environments

### CSS Styling

**File: `styles.css`**

The CSS file defines the visual appearance with these major sections:

- **Theme Variables**:
  - CSS variables for dark and light themes
  - Color palette definitions

- **Layout Components**:
  - Body and main container styles
  - Responsive design adjustments

- **Sidebar Styling**:
  - Collapsible sidebar with animations
  - Menu item hover effects
  - State transitions

- **Card Components**:
  - Card container and individual card styles
  - Hover animations and transforms
  - Icon styling and effects

- **Background Effects**:
  - Gradient overlays
  - Animated floating elements
  - Three.js canvas container

- **User Profile Card**:
  - Avatar and user details styling
  - Status indicator
  - Edit and delete buttons
  - Hover animations and particles

- **Modal Dialogs**:
  - Modal overlay and content styles
  - Form elements and validation
  - Confirmation dialog styling

- **Animation Keyframes**:
  - Detailed animation definitions for various UI elements
  - Entrance animations
  - Hover effects
  - State transitions

## Features

### 1. Responsive Design
- Adapts to different screen sizes
- Mobile-friendly interface elements
- Flexible layout with CSS Grid and Flexbox

### 2. Theme System
- Built-in light and dark themes
- Persistent theme selection via localStorage
- Smooth transition between themes

### 3. User Profile Management
- Username display and editing
- Profile deletion with confirmation
- Visual feedback and animations

### 4. Interactive UI Elements
- Cards with hover effects and animations
- Dynamic modals for content display
- Animated notifications

### 5. System Status Display
- Real-time system metrics visualization
- Animated progress bars
- Hover-activated display

### 6. Sidebar Navigation
- Collapsible sidebar with animation
- State persistence across page loads
- Smooth transitions and hover effects

### 7. Background Effects
- Animated gradient background
- Three.js particles
- Floating elements

### 8. Electron Integration
- Designed to work in both browser and desktop contexts
- IPC communication for desktop features
- Graceful fallbacks for browser environment

## Components

### Sidebar
The sidebar provides navigation through a collapsible menu that persists its state across page reloads using localStorage. It features a hamburger toggle button and animated transitions.

```javascript
// Key sidebar functions:
// - initSidebar() - Initializes sidebar state from localStorage
// - Sidebar toggle event listeners
// - localStorage interaction for state persistence
```

### Content Cards
Interactive cards serve as entry points to different application features. Each card includes an icon, title, and description with hover animations and click effects.

```javascript
// Card interaction code:
// - Event listeners for mousedown, mouseup, mouseleave
// - Click handlers for modal creation
```

### Modal System
The application features a sophisticated modal system for displaying content windows with custom UI controls that mimic desktop application windows.

```javascript
// Key modal function:
// createContentModal(title, contentSrc, iconClass)
// - Creates a modal with window controls (minimize, maximize, close)
// - Supports iframe content loading
// - Features animated transitions and effects
```

### User Profile
The user profile section displays the current user with editing capabilities and visual feedback.

```javascript
// User profile functions:
// - initUserProfile() - Sets up the profile card and interactions
// - loadUsername() - Retrieves username from storage
// - saveNewUsername() - Validates and saves username changes
// - removeUsername() - Handles profile deletion with animation
```

### System Stats
A hoverable button that displays system metrics with animated charts.

```javascript
// Stats functionality:
// - setupStatsButton() - Initializes the stats display
// - updateStatsWithRandomValues() - Updates the displayed metrics
// - Hover event handlers for display and updates
```

### Time Display
Displays current time and date in Persian (Jalali) calendar format with live updates.

```javascript
// Time functions:
// - setupTimeDisplay() - Creates separate elements for time parts
// - updateTimeElements() - Updates only changing elements
// - gregorianToJalali() - Converts dates to Persian calendar
```

## Animation Effects

The application features numerous animation effects for enhanced user experience:

### Entrance Animations
- Card entrance with 3D perspective
- Profile card entrance animation
- Notification slide-in

### Hover Effects
- Cards: scaling, shadow enhancement, gradient movement
- Profile card: 3D rotation, particle effects, color transitions
- Buttons: color changes, icon animations, glow effects

### State Transitions
- Sidebar expansion/collapse
- Modal open/close
- Theme switching
- Notification progress

### Background Animations
- Floating elements
- Three.js particle system
- Gradient shifts

## Theme System

The application uses a CSS variable-based theming system with two predefined themes:

### Dark Theme (Default)
- Dark backgrounds with blue accents
- Light text
- Glowing elements and highlights

### Light Theme
- Light backgrounds with teal accents
- Dark text
- Subtle shadows and highlights

Theme selection persists via localStorage and applies throughout the interface.

## Customization Guide

### Changing Colors
To modify the color scheme, adjust the CSS variables in the `:root` selector in `styles.css`:

```css
:root {
    /* Dark theme colors */
    --dark-bg: #0f111e;
    --dark-sidebar-bg: #141726d1;
    --dark-card-bg: #131832;
    --dark-text: #fff;
    --dark-text-secondary: #8f9bb3;
    --dark-border: #252848;
    --dark-accent: #36f1cd;
    --dark-accent-transparent: rgba(54, 241, 205, 0.2);
    
    /* Light theme colors */
    --light-bg: #f5f7fa;
    --light-sidebar-bg: rgba(255, 255, 255, 0.95);
    --light-card-bg: #ffffff;
    --light-text: #1a1f36;
    --light-text-secondary: #4a5568;
    --light-border: #e2e8f0;
    --light-accent: #0891b2;
    --light-accent-transparent: rgba(8, 145, 178, 0.2);
}
```

### Adding New Cards
To add a new card to the dashboard:

1. Copy an existing card structure in `index.html`
2. Update the icon, title, and description
3. Add a click event handler in `script.js`

```html
<div class="card" id="new-feature-card">
    <div class="card-icon">
        <i class="fas fa-your-icon"></i>
    </div>
    <h3 class="rtl-text">عنوان جدید</h3>
    <p class="rtl-text">توضیحات مربوط به این بخش</p>
</div>
```

### Modifying the Sidebar
To add new menu items to the sidebar:

1. Find the `<ul>` element within the sidebar in `index.html`
2. Add new `<li>` elements with links

```html
<li><a href="#">New Menu Item</a></li>
```

### Adjusting Animations
Animation timing and effects can be modified in the keyframe definitions in `styles.css`:

```css
@keyframes cardEntrance {
    /* Modify timing values and transforms here */
}
```

## Known Issues

1. **Three.js Performance**: The Three.js background may affect performance on older devices. Consider disabling it for better performance on low-end hardware.

2. **RTL Text Support**: While the application supports RTL (right-to-left) text direction, some edge cases might require additional styling.

3. **Browser Compatibility**: Some advanced CSS features might not work in older browsers. Consider adding appropriate fallbacks if targeting legacy browsers.

## Electron Integration

The application is designed to work both as a web application and as an Electron desktop application. Electron-specific functionality includes:

### IPC Communication
- Username storage and retrieval
- Window management
- Profile settings persistence

### Conditional Logic
The code includes conditional checks for Electron availability:

```javascript
// Initialize Electron IPC functionality if available
let ipcRenderer;
try {
    if (typeof require !== 'undefined') {
        ipcRenderer = require('electron').ipcRenderer;
    }
} catch (error) {
    console.error('Electron IPC not available:', error);
}
```

### Fallbacks
When Electron is not available (browser environment), the code falls back to alternative implementations:

```javascript
if (ipcRenderer) {
    // Electron-specific code
} else {
    // Browser fallback
}
```