# Browser Storage Manager

A powerful browser extension for developers and privacy-conscious users to manage, analyze, and clean browser storage data.

## Repository

Official GitHub repository: [https://github.com/vanzan01/browser-manager](https://github.com/vanzan01/browser-manager)

## Purpose

Originally built to solve a common web development challenge: cleaning test sites between sessions. As developers, we often need pristine environments to test our applications, but manually clearing cookies, cache, and other storage for specific domains is tedious and error-prone.

This extension started as a simple tool but evolved into a comprehensive storage management solution with powerful analytics and selective cleaning capabilities.

## Key Features

### 🧭 Storage Dashboard
- Visualize total browser storage usage
- Identify the largest domains consuming space
- Intuitive cards for each domain showing storage breakdown

### 🔍 Domain-Level Insights
- Detailed view for each domain showing:
  - History entries
  - Cache size
  - Cookie data
  - Local storage usage
- Page-specific breakdowns within each domain

### 📊 Advanced Analytics
- Timeline charts showing storage growth over time (7/30/90 days)
- Storage type distribution visualization
- Customizable filters to sort domains by different metrics:
  - Total storage
  - History size
  - Cache volume
  - Cookie data
  - LocalStorage usage

### 🧹 Selective Cleaning Tools
- Clear all data for specific domains
- Clear individual pages within domains
- Bulk actions for clearing specific types of data:
  - All history
  - All cache
  - All cookies
  - All localStorage

## Use Cases

### 👩‍💻 Web Development
- Reset test environments between sessions
- Verify that your application properly manages storage
- Track how your web applications consume browser storage
- Debug storage-related issues

### 🔒 Privacy Protection
- Identify which sites store excessive data
- Selectively remove data from specific sites without affecting others
- Regular maintenance to minimize digital footprint

### 💻 Shared Computer Scenarios
- Clean up personal browsing data without affecting shared accounts
- Target specific domains before lending your computer to someone
- Prepare public or shared computers for the next user

### 📱 Performance Optimization
- Identify and clear bloated cache to improve browser speed
- See which domains are consuming disproportionate resources
- Monitor storage growth over time

## Installation

1. Download the extension from the Chrome Web Store / Firefox Add-ons / Edge Add-ons (links coming soon)
2. Or install manually:
   - Clone this repository
   - Run `npm install` followed by `npm run build`
   - Load the extension in your browser:
     - Chrome/Brave: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the `dist` folder
     - Firefox: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", and select any file in the `dist` folder
     - Edge: Go to `edge://extensions/`, enable "Developer mode", click "Load unpacked", and select the `dist` folder

## How to Use

### Storage Dashboard
The main view shows an overview of your browser's storage usage, listing domains by storage size. Click on any domain to see detailed information.

### Domain Details
View and manage storage for a specific domain, including:
- Storage metrics breakdown
- List of individual pages
- Option to clear all data for this domain
- Page-specific cleaning options

### Advanced Analytics
Access advanced visualization and filtering:
- Switch between time ranges (7/30/90 days)
- View storage distribution by type
- Sort top domains by different metrics
- Access bulk cleaning actions

## Privacy & Security

This extension:
- Works entirely locally - no data is sent to external servers
- Requires permissions only for the features it provides
- Is open source and transparent about its operation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE) 