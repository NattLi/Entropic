# Processing Studio

<div align="center">

✨ **A Modern Processing IDE for Designers & Artists** ✨

![Processing Studio Banner](https://img.shields.io/badge/Processing-4.x-blue)
![Electron](https://img.shields.io/badge/Electron-Latest-47848F)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

*Empowering creative coding with a beautiful, modern interface*

</div>

## 🎨 Features

- **🚀 Modern UI**: Clean, responsive interface built with React and Monaco Editor
- **⚡ Fast Compilation**: Direct Java compilation with Processing core libraries
- **💻 Cross-Platform**: Works on Windows, macOS, and Linux
- **📊 Live Console**: Real-time output and error feedback
- **🎯 Smart Code Editor**: Syntax highlighting, auto-completion, and error detection
- **🔄 Hot Reload**: Instant preview of your sketches

## 📸 Screenshots

![Processing Studio Interface](./screenshots/main-interface.png)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Editor**: Monaco Editor (VS Code's editor)
- **Desktop**: Electron
- **Processing**: Processing 4.x Core Libraries
- **Styling**: Modern CSS with custom design system

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- **Processing 4.x** installed (for now - standalone version coming soon!)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/processing-studio.git
cd processing-studio

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Building

```bash
# Build for production
npm run build

# Package as desktop app (Windows/Mac/Linux)
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

## 📖 Usage

1. **Write Your Code**: Use the Monaco editor with full Processing syntax support
2. **Click Run**: Compile and execute your sketch with one click
3. **See Output**: Watch your creation come to life in the Processing window
4. **Debug**: Check the console for any errors or print statements

### Example Sketch

```processing
void setup() {
  size(800, 600);
  background(20);
  strokeWeight(2);
  stroke(255, 100);
}

void draw() {
  background(20);
  
  int step = 30;
  for (int x = step/2; x < width; x += step) {
    for (int y = step/2; y < height; y += step) {
      float angle = atan2(mouseY - y, mouseX - x);
      float dist = dist(mouseX, mouseY, x, y);
      
      pushMatrix();
      translate(x, y);
      rotate(angle);
      
      stroke(255 - dist/3, 100, 255);
      line(-10, 0, 10, 0);
      
      popMatrix();
    }
  }
}
```

## 🗺️ Roadmap

- [x] Basic Processing sketch execution
- [x] Monaco editor integration
- [x] Cross-platform support
- [ ] Bundled Processing runtime (no external installation needed)
- [ ] Multi-file project support
- [ ] Built-in sketch library
- [ ] AI-powered code suggestions
- [ ] Cloud sketch sync
- [ ] Live collaboration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Processing Foundation](https://processing.org/) for the amazing creative coding platform
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the powerful code editor
- All contributors and users of this project

## 📧 Contact

Project Link: [https://github.com/yourusername/processing-studio](https://github.com/yourusername/processing-studio)

---

<div align="center">
Made with ❤️ by designers, for designers
</div>
