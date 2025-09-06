# Prompt Heatmap

An Obsidian plugin that randomly selects writing prompts from your collection and creates new notes for you to work on, while tracking which prompts you've used.

## Features

- **Random Prompt Selection**: Automatically selects an unused prompt from your `Prompts.md` file
- **Automatic Note Creation**: Creates a new note with the selected prompt ready for writing
- **Progress Tracking**: Marks used prompts as completed so you don't repeat them
- **Easy Access**: One-click access via ribbon icon in the left sidebar
- **Smart Filtering**: Only selects from unchecked prompts (ignores completed ones)

## Installation

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/yourusername/Prompt-Heatmap/releases)
2. Extract the files to your vault's `.obsidian/plugins/Prompt-Heatmap/` folder
3. Enable the plugin in **Settings → Community plugins**

### Development Installation

1. Clone this repository to your vault's `.obsidian/plugins/` folder
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile the plugin
4. Enable the plugin in **Settings → Community plugins**

## Setup

### 1. Create Your Prompts File

Create a file called `Prompts.md` in a `Prompts` folder in your vault root:

```markdown
Prompts/
└── Prompts.md
```

### 2. Add Your Writing Prompts

Add your prompts to `Prompts.md` using bullet points:

```markdown
- Pick one location (e.g. _The Gate_, _The Wound_, _The Archaea_): What does it smell, sound, or feel like to stand there?
- How do travelers describe their first sight of _The Megastructure_?
- What danger lurks near _The Wound_, and how do locals protect themselves?
- What legend explains the origin of _The Archaea_?
```

### 3. Use the Plugin

1. Click the **notepad-text icon** in the left ribbon
2. The plugin will:
    - Select a random unchecked prompt
    - Mark it as completed (`- [x]`) in your Prompts.md file
    - Create a new note with the prompt
    - Open the note for you to start writing

## How It Works

1. **Reads** your `Prompts/Prompts.md` file
2. **Filters** for unchecked prompts (lines starting with `- ` but not `- [x]`)
3. **Selects** a random prompt from the available ones
4. **Marks** the selected prompt as completed in the original file
5. **Creates** a new note with filename format: `Prompt - DD-MM-YYYY.md`
6. **Opens** the new note automatically

## File Structure

```
Your Vault/
├── Prompts/
│   └── Prompts.md          # Your writing prompts
├── Prompt - 15-01-2024.md  # Generated prompt notes
├── Prompt - 16-01-2024.md
└── ...
```

## Generated Note Format

Each generated note includes:

```markdown
# Writing Prompt

- Your selected prompt here

---

_Generated on 15/01/2024_
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Building

```bash
# Install dependencies
npm install

# Development build with file watching
npm run dev

# Production build
npm run build
```

### Project Structure

```
src/
├── main.ts           # Plugin entry point
├── settings.ts       # Settings interface (if needed)
└── ...
```

## Troubleshooting

### "Prompts.md file not found"

- Make sure you have a `Prompts/Prompts.md` file in your vault root
- Check the file path is exactly `Prompts/Prompts.md`

### "No unchecked prompts found"

- All your prompts are marked as completed (`- [x]`)
- Add new prompts or uncheck some by changing `- [x]` back to `- `

### Plugin not working

- Make sure the plugin is enabled in **Settings → Community plugins**
- Check the console (Ctrl+Shift+I) for error messages
- Try reloading the plugin

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/yourusername/Prompt-Heatmap/issues) on GitHub.

## Changelog

### Version 1.0.0

- Initial release
- Random prompt selection
- Automatic note creation
- Progress tracking
- Ribbon icon integration
