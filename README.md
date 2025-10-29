# RJB TRANZ CRM - Desktop Application

A professional desktop application for currency exchange management, built with React and Electron.

## 🌟 Features

### Core CRM Features
- **Transaction Management**: Create, track, and manage currency exchange transactions
- **Client Management**: Maintain client profiles and transaction history
- **Invoice System**: Generate and manage invoices with automated workflows
- **Exchange Rates**: Live exchange rate monitoring for 70+ currencies with real-time status indicators
- **Analytics Dashboard**: Comprehensive business analytics and reporting with dynamic currency conversion
- **Receipt Printing**: Thermal printer integration for transaction receipts

### Advanced Features
- **Super Admin Panel**: Complete user management system with real-time approval/denial
- **User Activity Tracking**: "Active now" and "last active X time ago" status indicators
- **Real-time Status**: Live user online/offline status monitoring
- **API Optimization**: Cost-effective exchange rate API usage with pinned countries only
- **Enhanced Security**: Multi-layer authorization with super admin verification
- **Dynamic Analytics**: Currency-aware analytics with base currency conversion

### Desktop-Specific Features
- **Native Desktop Experience**: Full-featured desktop application
- **Automatic Updates**: Seamless updates via GitHub releases
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
- **Menu Bar Integration**: Native menu with common actions
- **File Operations**: Native file dialogs for import/export
- **System Notifications**: Desktop notifications for important events
- **Offline Capability**: Works without internet connection
- **Multi-Platform**: Windows, macOS, and Linux support

## 🚀 Quick Start

### For Developers

1. **Clone and Install**
   ```bash
   git clone https://github.com/irocky-stack/Rjb-tranz-.git
   cd Rjb-tranz-
   npm install
   ```

2. **Development Mode**
   ```bash
   npm run electron-dev
   ```

3. **Build for Production**
   ```bash
   npm run dist
   ```

### For End Users

Download the latest release from the [Releases page](https://github.com/irocky-stack/Rjb-tranz-/releases):

- **Windows**: Download `.exe` installer or portable version
- **macOS**: Download `.dmg` file
- **Linux**: Download `.AppImage`, `.deb`, or `.rpm` package

## 📋 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Display**: 1024x768 minimum resolution

### Recommended
- **OS**: Windows 11, macOS 12+, or Linux (Ubuntu 20.04+)
- **RAM**: 8GB or more
- **Storage**: 1GB free space
- **Display**: 1920x1080 or higher

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run electron-dev

# Build for production
npm run build
npm run dist
```

### Available Scripts

#### Development
- `npm run dev` - Start web development server
- `npm run electron-dev` - Start Electron in development mode
- `npm run dev-desktop` - Enhanced development script

#### Building
- `npm run build` - Build web application
- `npm run electron-build` - Run built app in Electron
- `npm run dist` - Build desktop installers for current platform
- `npm run dist-win` - Build for Windows
- `npm run dist-mac` - Build for macOS  
- `npm run dist-linux` - Build for Linux

## 🔄 Auto-Updates

The application includes automatic update functionality:

1. **Automatic Checks**: App checks for updates on startup
2. **Background Downloads**: Updates download automatically
3. **User Notification**: Users are notified when updates are ready
4. **One-Click Install**: Simple restart to apply updates

### For Developers
Set up auto-updates by configuring GitHub releases:

1. Set `GH_TOKEN` environment variable
2. Update repository URL in `package.json`
3. Run `npm run dist` to build and publish

## ⌨️ Keyboard Shortcuts

### Navigation
- `Ctrl/Cmd + 1` - Dashboard
- `Ctrl/Cmd + 2` - Transactions  
- `Ctrl/Cmd + 3` - Invoices
- `Ctrl/Cmd + 4` - Countries

### Actions
- `Ctrl/Cmd + N` - New Transaction
- `Ctrl/Cmd + E` - Export Data
- `Ctrl/Cmd + R` - Refresh Data
- `Ctrl/Cmd + ,` - Settings
- `F11` - Toggle Fullscreen

### System
- `Ctrl/Cmd + Q` - Quit Application
- `Ctrl/Cmd + W` - Close Window
- `Ctrl/Cmd + M` - Minimize Window

## 📊 Data Management

### Local Storage
- All data stored locally using encrypted storage
- No internet required for core functionality
- Automatic backup capabilities

### Export/Import
- CSV export for all data types
- JSON backup format
- Excel-compatible exports

### Cloud Sync (Optional)
- Supabase integration available
- Real-time data synchronization
- Multi-device access
- User management and approval system
- Activity tracking and monitoring

## 🔒 Security

### Data Protection
- Local data encryption
- Secure context isolation
- No remote code execution

### Privacy
- No telemetry or tracking
- Local-first architecture
- Optional cloud features

## 🎨 Customization

### Themes
- Light and dark themes
- System theme detection
- Customizable color schemes

### Layout
- Responsive design
- Mobile-friendly interface
- Customizable dashboard

## 🐛 Troubleshooting

### Common Issues

**App won't start**
- Check system requirements
- Try running as administrator (Windows)
- Check antivirus software

**Auto-updates not working**
- Check internet connection
- Verify GitHub repository access
- Look for error messages in console

**Print issues**  
- Verify printer connection
- Check printer driver installation
- Test print from other applications

### Getting Help

1. Check the [Issues page](https://github.com/irocky-stack/Rjb-tranz-/issues)
2. Review the [Setup Guide](DESKTOP_SETUP.md)
3. Enable debug mode for detailed logs

## 📈 Roadmap

### Upcoming Features
- [ ] Multi-currency wallet integration
- [ ] Advanced reporting features
- [ ] Mobile companion app
- [ ] API integrations
- [ ] Advanced security features

### Version History
- **v1.1.0** - Super admin panel, real-time user activity tracking, API optimization
- **v1.0.0** - Initial desktop release with core CRM features
- **v0.9.0** - Beta release with analytics and exchange rates
- **v0.8.0** - Alpha release for testing

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support:
- **Email**: support@rjbtranz.com
- **Issues**: GitHub Issues page
- **Documentation**: [Desktop Setup Guide](DESKTOP_SETUP.md)

## 🙏 Acknowledgments

Built with:
- [Electron](https://electronjs.org/) - Desktop app framework
- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://radix-ui.com/) - UI components

---

**RJB TRANZ CRM Desktop** - Professional currency exchange management made simple.