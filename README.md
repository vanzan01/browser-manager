# Browser Storage Manager

A powerful browser extension for developers and privacy-conscious users to manage, analyze, and clean browser storage data.

## Quick Start

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in your browser:
   - Chrome/Brave: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the `dist` folder
   - Firefox: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", and select any file in the `dist` folder
   - Edge: Go to `edge://extensions/`, enable "Developer mode", click "Load unpacked", and select the `dist` folder

## Development

### Icon Management
The extension includes both SVG source files and PNG files for icons:
- `public/icons/*.svg` - Source files that can be modified
- `public/icons/*.png` - Generated files used by the extension

If you modify any SVG files, regenerate the PNGs:
```bash
npm run convert-icons
```

### Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build the extension
- `npm run preview` - Preview the build
- `npm run lint` - Run ESLint to check for code quality
- `npm run test` - Run unit tests with Vitest
- `npm run convert-icons` - Convert SVG icons to PNG

### Extension Features

#### 🧭 Storage Dashboard
- Visualize total browser storage usage
- Identify the largest domains consuming space
- Intuitive cards for each domain showing storage breakdown

#### 🔍 Domain-Level Insights
- Detailed view for each domain showing:
  - History entries
  - Cache size
  - Cookie data
  - Local storage usage
- Page-specific breakdowns within each domain

#### 📊 Advanced Analytics
- Timeline charts showing storage growth over time (7/30/90 days)
- Storage type distribution visualization
- Customizable filters to sort domains by different metrics:
  - Total storage
  - History size
  - Cache volume
  - Cookie data
  - LocalStorage usage

#### 🧹 Selective Cleaning Tools
- Clear all data for specific domains
- Clear individual pages within domains
- Bulk actions for clearing specific types of data:
  - All history
  - All cache
  - All cookies
  - All localStorage

### Background Operation
The extension operates in the background to:
1. Monitor visited sites
2. Track storage usage
3. Automatically clean history based on your settings

The background script is implemented in TypeScript and is compiled as part of the build process. Settings persist even when the browser is closed, and automatic cleaning continues to work in the background.

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

## Privacy & Security

This extension:
- Works entirely locally - no data is sent to external servers
- Requires permissions only for the features it provides
- Is open source and transparent about its operation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE) 