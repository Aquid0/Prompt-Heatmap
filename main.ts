import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class PromptHeatmapPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('notepad-text', 'Get Random Prompt', () => {
			this.getRandomPrompt();
		})

		this.addCommand({
			id: 'get-random-prompt',
			name: 'Get Random Prompt',
			callback: () => {
				this.getRandomPrompt();
			}
		})


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async getRandomPrompt() {
		try {
			// Create a new note with the prompt
			const timestamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY format
			const fileName = `Prompt - ${timestamp}.md`;

			// Check if the prompt note already exists
			if (this.app.vault.getAbstractFileByPath(fileName)) {
				new Notice('Prompt note already exists for today!');
				await this.app.workspace.getLeaf().openFile(this.app.vault.getAbstractFileByPath(fileName) as any);
				return;
			}

			// Read the Prompts.md file from Writing/Prompts folder
			const promptsFile = this.app.vault.getAbstractFileByPath('Prompts/Prompts.md');
			
			if (!promptsFile) {
				new Notice('Prompts.md file not found in Writing/Prompts folder');
				return;
			}

			// Read the file content
			const content = await this.app.vault.read(promptsFile as any);
			
			// Parse lines and find unchecked prompts (lines that start with "- " but not "- [x]")
			const lineIndices = content.split('\n').map((line, index) => ({line, index}));
			const uncheckedPrompts = lineIndices.filter(line => {
				const trimmed = line.line.trim();
				return !trimmed.startsWith('- [x]');
			});

			if (uncheckedPrompts.length === 0) {
				new Notice('No unchecked prompts found!');
				return;
			}

			// Select a random unchecked prompt
			const randomIndex = Math.floor(Math.random() * uncheckedPrompts.length);
			lineIndices[randomIndex] = {line: uncheckedPrompts[randomIndex].line.replace('- [ ]', '- [x]'), index: randomIndex}; // Mark the prompt as checked
			
			// Mark prompt as checked
			const updatedContent = lineIndices.map(line => line.line).join('\n'); 
			await this.app.vault.modify(promptsFile as any, updatedContent); 

			const selectedPrompt = uncheckedPrompts[randomIndex].line.replace('- [ ]', '').trim();
			
			// Create the note content
			const noteContent = `# Writing Prompt

${"**" + selectedPrompt + "**"}

---



*Generated on ${new Date().toLocaleDateString('en-GB')}*
`;

			// Create the new file
			await this.app.vault.create(fileName, noteContent);
			
			// Open the new note
			const newFile = this.app.vault.getAbstractFileByPath(fileName);
			if (newFile) {
				await this.app.workspace.getLeaf().openFile(newFile as any);
			}

			new Notice(`Created new prompt note: ${fileName}`);

		} catch (error) {
			console.error('Error getting random prompt:', error);
			new Notice('Error getting random prompt. Check console for details.');
		}
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: PromptHeatmapPlugin;

	constructor(app: App, plugin: PromptHeatmapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
