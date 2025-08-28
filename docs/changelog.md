# Changelog

All notable changes to the "Prevent Duplicate Tabs" Chrome extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1]

### 🔧 Changed
- **UI Layout Consistency**: Fixed inconsistent spacing between option groups in popup
- **Option Group Spacing**: Unified padding to 1.25rem for all popup option groups
- **Horizontal Layout**: Ensured Enable Extension toggle displays in single row layout
- **Visual Alignment**: Improved spacing from borders for consistent professional appearance

### 🐛 Fixed
- **Popup Layout Issues**: Resolved inconsistent spacing between different option sections
- **Option Group CSS**: Fixed flexbox properties for proper horizontal alignment
- **Spacing Uniformity**: All popup elements now have consistent border spacing

### 🏗️ Technical
- **CSS Refactoring**: Updated optionGroup.css for consistent popup styling
- **Flexbox Optimization**: Improved layout properties for better responsive design
- **Popup-Specific Styling**: Enhanced CSS overrides for consistent popup appearance

---

## [1.0.0]

### 🚀 Added
- **Duplicate Tab Prevention**: Core functionality to automatically detect and handle duplicate tabs
- **Whitelist Management**: Domain exclusion system for bypassing duplicate detection
- **Configurable Strategies**: Four different duplicate handling approaches
- **URL Sensitivity Options**: Configurable URL matching strictness
- **Extension Controls**: Enable/disable functionality with persistent settings
- **Settings Management**: Reset to defaults capability

### 🔧 Changed
- **UI Architecture**: Implemented modular component-based design
- **User Experience**: Enhanced popup and options page layouts
- **Responsive Design**: Mobile-first approach with cross-device compatibility

### 🐛 Fixed
- **Tab Management**: Reliable duplicate detection and handling
- **Storage Persistence**: Chrome storage sync for settings across devices
- **URL Processing**: Normalized URL comparison for accurate duplicate detection

### 🏗️ Technical
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background processing for tab monitoring
- **Storage API**: Persistent settings with Chrome storage sync
- **Tab API**: Efficient tab management and manipulation
- **Component System**: Reusable UI components with consistent styling

---

## Version History

- **1.0.1** - UI layout consistency fixes and spacing improvements
- **1.0.0** - Initial release with core duplicate prevention functionality
