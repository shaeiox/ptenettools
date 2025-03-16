# Firstpage - Service Selection Page

This folder contains the files for the first page of the PTE Net Tools application, which serves as the entry point for users to select internet service types (ADSL, LTE, FTTH) before proceeding to the login page.

## File Structure

- **index.html** - Page structure and content
- **script.js** - Interactive functionality
- **styles.css** - Visual styling

## Page Overview

The Firstpage is the initial landing page where users select which internet service they want to access. It features a modern design with three service boxes, each representing a different internet service offering. The page is designed with RTL (right-to-left) support for Farsi/Persian language and includes animated backgrounds and interactive elements.

## HTML Structure (index.html)

The HTML file is organized as follows:

- **Document Setup**
  - RTL direction for Persian language support
  - Meta tags and font loading
  
- **Loading Animation** (Lines 14-16)
  - Spinner shown while the page loads

- **Floating Particles** (Line 19)
  - Background animation elements

- **Main Container** (Lines 22-67)
  - Service Boxes for three internet service types:
    1. **ADSL Service Box** (Lines 24-35)
    2. **LTE Service Box** (Lines 38-49)
    3. **FTTH Service Box** (Lines 52-63)
  
  - Each service box contains:
    - Icon (SVG)
    - Title
    - Description
    - "Login" button (leading to Loginpage)

## JavaScript Functionality (script.js)

The JavaScript file handles all interactive elements and animations:

- **Initialization Functions**
  - `initPage()` (Line 8) - Main entry point that calls all setup functions
  - `handleLoading()` (Line 23) - Controls the loading animation
  - `createParticles()` (Line 47) - Generates floating background particles
  - `initServiceBoxes()` (Line 80) - Sets up hover animations for service boxes
  - `initButtonEffects()` (Line 111) - Adds glowing effects to buttons

- **User Interface Enhancement**
  - Service box hover animations and transitions
  - Loading screen management
  - Background particle system with physics simulation

- **Navigation**
  - Handling transitions to the Loginpage
  - Error page redirection for unavailable services

- **Additional Utilities**
  - `updateDateTime()` (Line 282) - Updates the current date/time display
  - `startClock()` (Line 299) - Initializes a running clock

## CSS Styling (styles.css)

The CSS file controls the visual appearance and animations:

- **Base Styles and Variables** (Lines 1-21)
  - Color scheme using CSS variables
  - Gradients for each service type:
    - ADSL: Green gradient
    - LTE: Blue gradient
    - FTTH: Yellow/orange gradient

- **Layout and Container Styles** (Lines 58-68)
  - Flex layout for the service boxes
  - Responsive design adjustments

- **Service Box Styling** (Lines 69-88)
  - Glass-morphism effect using backdrop filters
  - Hover animations and transitions
  - Before/after pseudo-elements for backgrounds

- **Animation Definitions**
  - Loading spinner animation (`@keyframes spin`, Line 365)
  - Floating particles animation (`@keyframes float`, Line 390)
  - Fade-in animation (`@keyframes fadeIn`, Line 308)

- **Responsive Design** (Lines 290-307)
  - Tablet layout (max-width: 1024px)
  - Mobile layout (max-width: 768px)
  - Stacked service boxes for narrow screens

## Customization Guide

### Changing Service Colors

To modify the color scheme for each service type:

1. Edit the gradient variables in `:root` (Lines 8-11):
   ```css
   --adsl-gradient: linear-gradient(135deg, #00c853, #009624);
   --lte-gradient: linear-gradient(135deg, #0091ea, #0064b7);
   --ftth-gradient: linear-gradient(135deg, #ffd600, #ffab00);
   ```

### Adding New Service Types

To add a new service box:

1. Copy an existing service box HTML structure (Lines 24-35)
2. Add a new gradient variable in `:root` (styles.css)
3. Add corresponding styling for the new service box
4. Update navigation in the button href attribute

### Modifying Background Effects

To adjust the background particles:

1. Change particle count and properties in `createParticles()` (script.js, Line 47)
2. Modify particle styles in styles.css (Lines 372-389)

### Changing Loading Animation

To customize the loading animation:

1. Modify the spinner styles in styles.css (Lines 337-364)
2. Adjust timing in `handleLoading()` (script.js, Line 23)

## Connection to Other Pages

The Firstpage connects to:

- **Loginpage**: When users click "Login" on the ADSL service box
- **Error Page**: When users click services that are not yet implemented 