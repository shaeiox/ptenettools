# PTE Net Tools

A modern, responsive login interface for Pishgaman Tosee Ertebatat (PTE) Net Tools application. This application features an animated background, phone number validation, and a clean, user-friendly interface.

## Table of Contents

1. [Project Structure](#project-structure)
2. [File Details](#file-details)
   - [HTML Structure](#html-structure)
   - [JavaScript Functionality](#javascript-functionality)
   - [CSS Styling](#css-styling)
3. [Features](#features)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Customization](#customization)

## Project Structure

The project consists of three main files:

```
PTE Net Tools/
│
├── index.html          # Main HTML document
├── script.js           # JavaScript functionality
└── styles.css          # CSS styling and animations
```

Additional assets:
- `pishgaman.png` - Company logo
- `5g.png` - 5G logo

## File Details

### HTML Structure

**File: `index.html`**

The HTML file defines the structure of the login page with the following components:

- **Document Head**:
  - Meta tags for character encoding and responsive design
  - Title: "PTE Net Tools"
  - Links to external resources (Font Awesome, Google Fonts)
  - Link to local stylesheet

- **Body**:
  - Animated background with floating elements (`<ul class="circles">`)
  - Login container (`<div class="insert-box">`)
    - Company branding (logos and title)
    - Phone number input field with validation
    - Login button with glow effect
    - Help link

- **Scripts**:
  - Link to main JavaScript file
  - Electron-specific code (conditional, for desktop application support)

### JavaScript Functionality

**File: `script.js`**

The JavaScript file manages user interactions, animations, and validation with the following structure:

- **Initialization Functions**:
  - `initUI()` - Sets up initial UI state, focusing on input field
  - `initIntroAnimation()` - Handles intro animation sequence
  - `setupEventListeners()` - Attaches event listeners to interactive elements

- **Validation Functions**:
  - `isValidPhoneNumber(input)` - Validates phone number format (10-12 digits)
  - `showValidationError(message)` - Displays error messages with animation
  - `clearValidationError()` - Clears error state

- **Login Handling**:
  - `handleLogin()` - Main login function with validation logic
  - Supports both browser and Electron (desktop) environments
  - Redirects to homepage on successful validation

- **Window Management** (for multi-window applications):
  - `showWindow1()` and `showWindow2()` - Switches between application windows

### CSS Styling

**File: `styles.css`**

The CSS file defines the visual appearance and animations with the following structure:

- **Base Styles**:
  - CSS imports (Google Fonts)
  - CSS reset and box-sizing
  - CSS variables (color palette)
  - Body styles

- **Background Animation**:
  - `.area` - Main background with gradient
  - `.circles` - Animated floating elements
  - Animation keyframes

- **Form Elements**:
  - `.insert-box` - Main container with glassmorphism effect
  - `.input-field` - Input styling with focus states
  - `.input-with-icon` - Input fields with icon prefixes
  - `.glow-on-hover` - Button with gradient and glow effects

- **Animation Keyframes**:
  - `fadeInUp`, `fadeIn`, `scaleIn` - Intro animations
  - `shake` - Validation error animations
  - `glowing` - Button glow animation
  - `gradientShift` - Background gradient animation

- **Responsive Design**:
  - Media queries for smaller screens

## Features

1. **Animated Background**:
   - Gradient background with animation
   - Floating elements with blur effect

2. **Modern UI Elements**:
   - Glassmorphism effect for containers
   - Gradient text and buttons
   - Icon integration with input fields

3. **Form Validation**:
   - Phone number validation (10-12 digits)
   - Visual feedback for invalid input
   - Animation for validation errors

4. **Responsive Design**:
   - Adapts to different screen sizes
   - Mobile-friendly interface

5. **Electron Support**:
   - Compatible with desktop environments
   - IPC communication for multi-window applications

## Installation

1. Clone or download the repository
2. Ensure all files are in the same directory
3. Open `index.html` in a web browser

For Electron (desktop) application:
1. Install Electron dependencies
2. Configure main process to load the HTML file
3. Build according to Electron guidelines

## Usage

The application serves as a login interface for the PTE Net Tools platform:

1. Enter your phone number in the input field
2. The application validates the input (must be 10-12 digits)
3. Click "Login" or press Enter to submit
4. On successful validation, redirects to the main application

## Customization

### Changing Colors

Modify the CSS variables in the `:root` selector in `styles.css`:

```css
:root {
    --primary-color: #6C63FF;    /* Primary accent color */
    --secondary-color: #4E54C8;  /* Secondary accent color */
    --accent-color: #F57D1F;     /* Highlight color */
    --text-color: #E0FBFC;       /* Main text color */
    --dark-bg: #111126;          /* Dark background */
    --light-text: #F7F7F9;       /* Light text color */
}
```

### Modifying Animations

Animation timing and effects can be adjusted in the keyframe definitions in `styles.css`:

- Background animation: `@keyframes gradientShift`
- Floating elements: `@keyframes animate`
- Button glow: `@keyframes glowing`
- Form animations: `@keyframes fadeInUp`, `@keyframes fadeIn`, `@keyframes scaleIn`

### Changing Validation Rules

To modify phone number validation requirements, update the regex pattern in the `isValidPhoneNumber()` function in `script.js`:

```javascript
function isValidPhoneNumber(input) {
    const cleanedInput = input.replace(/\D/g, '');
    // Modify this regex to change validation rules
    return /^\d{10,12}$/.test(cleanedInput);
}
```