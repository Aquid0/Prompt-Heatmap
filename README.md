# Prompt Heatmap

A simple Obsidian plugin that randomly selects writing prompts from a checklist and creates daily prompt notes. Designed to work seamlessly with the [Heatmap Tracker](https://github.com/obsidianmd/obsidian-releases) plugin for visualizing your writing progress.

## Features

- **Random Prompt Selection**: Automatically picks an unchecked prompt from your prompts file
- **Daily Note Creation**: Creates timestamped notes for each day you use a prompt
- **Progress Tracking**: Tracks how many prompts you've answered each day
- **Heatmap Integration**: Works with Heatmap Tracker to visualize your writing consistency

## Installation

1. Install the plugin from the Community Plugins browser in Obsidian
2. Enable the plugin in **Settings → Community plugins**
3. Install the [Heatmap Tracker](https://github.com/obsidianmd/obsidian-releases) plugin for visualization

## Setup

### 1. Create Your Prompts File

Create a markdown file with your writing prompts in checklist format:

```markdown
# Writing Prompts

- [ ] Write about your childhood home
- [ ] Describe your favorite meal in detail
- [ ] Tell a story about a time you got lost
- [ ] Write about someone who changed your life
- [ ] Describe your ideal day
- [ ] Write about a place you've never been but want to visit
```

### 2. Configure the Plugin

Go to **Settings → Community plugins → Prompt Heatmap** and configure:

- **Prompts Path**: Path to your prompts file (e.g., `Prompts/Writing Prompts.md`)
- **Date Format**: Date format for generated files (e.g., `en-GB`, `en-US`)
- **Destination Path**: Folder where daily prompt notes will be created (e.g., `Daily Prompts/`)
- **Prompts Answered Frontmatter**: Frontmatter key for tracking answered prompts (default: `promptsAnswered`)

### 3. Set Up Heatmap Tracker (Optional)

To visualize your writing progress:

1. Install the Heatmap Tracker plugin
2. Configure it to track your destination folder
3. Set the frontmatter key to match your "Prompts Answered Frontmatter" setting

## Usage

### Getting a Random Prompt

- **Ribbon Icon**: Click the notepad icon in the left ribbon
- **Command Palette**: Use `Ctrl/Cmd + P` and search for "Get Random Prompt"
- **Command**: Use the "Get Random Prompt" command

### How It Works

1. **Prompt Selection**: The plugin randomly selects an unchecked prompt from your prompts file
2. **Mark as Complete**: The selected prompt is automatically marked as `- [x]` in your prompts file
3. **Create/Update Note**: 
   - If no note exists for today, creates a new note with the prompt
   - If a note already exists, appends the new prompt to it
4. **Track Progress**: Updates the `promptsAnswered` count in the note's frontmatter

### Generated Note Format

New daily notes are created with this structure:

```markdown
---
promptsAnswered: 1
---

# Writing Prompt

**Write about your childhood home**

***

```

When you add multiple prompts to the same day:

```markdown
---
promptsAnswered: 3
---

# Writing Prompt

**Write about your childhood home**

***

**Describe your favorite meal in detail**

***

**Tell a story about a time you got lost**

***

```

## Integration with Heatmap Tracker

This plugin is designed to work with the Heatmap Tracker plugin for visualizing your writing consistency:

1. **Automatic Tracking**: Each time you use a prompt, the `promptsAnswered` count increases
2. **Heatmap Visualization**: Heatmap Tracker can display this data as a calendar heatmap
3. **Progress Insights**: See patterns in your writing habits and consistency

## Tips

- **Keep Prompts Fresh**: Regularly add new prompts to your prompts file
- **Use Descriptive Prompts**: Write prompts that inspire detailed responses
- **Organize by Category**: Consider organizing prompts by theme or difficulty
- **Review Progress**: Use the heatmap to identify your most productive writing times

## Troubleshooting

### No Unchecked Prompts Found
- Make sure your prompts file contains lines starting with `- [ ]`
- Check that the prompts path in settings is correct

### File Not Found Errors
- Verify that your prompts file exists at the specified path
- Ensure the destination folder path is correct

### Frontmatter Issues
- Make sure your daily notes have proper YAML frontmatter
- Check that the frontmatter key matches your settings

## Support

For issues, feature requests, or questions:
- Check the [GitHub Issues](https://github.com/your-username/prompt-heatmap/issues) page
- Review the plugin settings and file paths
- Ensure you're using the latest version of the plugin

## License

This plugin is released under the MIT License.