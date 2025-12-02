# Canvas QTI Quiz Maker

![Canvas QTI Quiz Maker](https://img.shields.io/badge/Canvas-LMS-blue?style=for-the-badge) ![QTI](https://img.shields.io/badge/QTI-1.2-green?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

A modern, beautiful web application that converts markdown-formatted quiz questions into Canvas-compatible QTI packages for easy quiz import.

## ✨ Features

- **6 Question Types Supported**:
  - Multiple Choice (Single Answer)
  - Multiple Answers (Select all that apply)
  - True/False
  - Short Answer / Fill-in-the-blank
  - Essay Question
  - File Upload Question
- **Multi-Chapter Support**: Automatically detects chapters and generates separate ZIP files for each.
- **Live Preview**: See your parsed questions instantly before generating.
- **Canvas Compatible**: Generates standard QTI 1.2 XML packages ready for import.
- **100% Client-Side**: No data is ever sent to a server. Everything happens in your browser.
- **SEO Optimized**: Includes meta tags for better search visibility and social sharing.
- **Dark Mode**: Modern, clean interface with syntax highlighting.

## 📝 Quiz Format Guide

The tool uses a simple markdown-like format.

### Structure
- **Chapters**: Start a new chapter with `### **Chapter X: Title**`
- **Questions**: Numbered list (e.g., `1. Question text`)
- **Options**: Lettered list (e.g., `a) Option`)

### Question Types Examples

#### 1. Multiple Choice
Mark the correct answer with an asterisk `*` before the letter.
```text
1. What is 2+3?
   a) 6
   b) 1
   *c) 5
   d) 10
```

#### 2. Multiple Answers
Use `[ ]` for options and `[*]` for correct answers.
```text
2. Which of the following are dinosaurs?
   [ ] Woolly mammoth
   [*] Tyrannosaurus rex
   [*] Triceratops
   [ ] Smilodon fatalis
```

#### 3. True/False
Standard multiple choice format with True/False options.
```text
3. Water is liquid.
   *a) True
   b) False
```

#### 4. Short Answer
Mark accepted answers with an asterisk `*`.
```text
4. Who lives at the North Pole?
   * Santa
   * Santa Claus
   * Father Christmas
```

#### 5. Essay
Indicate an essay question with `####`.
```text
5. Write an essay about sustainable design.
####
```

#### 6. File Upload
Indicate a file upload question with `^^^^`.
```text
6. Upload your project proposal.
^^^^
```

## 🎯 How to Use

1. **Format Your Questions** - Use the markdown format shown above
2. **Paste into Editor** - Copy your questions into the input area
3. **Preview** (Optional) - Click "Preview Questions" to verify parsing
4. **Generate QTI** - Click "Generate QTI Package" to download the ZIP file
5. **Import to Canvas**:
   - Go to your Canvas course
   - Navigate to **Settings** → **Import Course Content**
   - Select **QTI .zip file** as the content type
   - Upload your generated file
   - Complete the import process

## 🛠️ Technical Details

### Technologies Used
- **HTML5** - Semantic structure
- **CSS3** - Modern styling with custom properties, gradients, and animations
- **Vanilla JavaScript** - No framework dependencies
- **JSZip** - Client-side ZIP file generation
- **FileSaver.js** - Trigger file downloads

### QTI Format
This tool generates QTI 1.2 format XML files, which are compatible with Canvas LMS. The generated package includes:
- `assessment.xml` - Contains all quiz questions in QTI format
- `imsmanifest.xml` - Package manifest required by Canvas

### Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (not supported)

## 📦 Deploying to GitHub Pages

1. Push this repository to GitHub
2. Go to **Settings** → **Pages**
3. Under **Source**, select the branch (usually `main`) and `/root` folder
4. Click **Save**
5. Your site will be published at `https://yourusername.github.io/CanvasQuizMaker/`

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built for educators who want a faster way to create Canvas quizzes
- Inspired by the need for a more user-friendly alternative to existing QTI converters

## 📞 Support

If you encounter any issues or have questions:
1. Check the format guide in the app
2. Verify your markdown follows the specified format
3. Open an issue on GitHub

---

Made with ❤️ for educators | All processing happens client-side in your browser
