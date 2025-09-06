import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	promptsPath: string;
	dateFormat: string;
	destinationPath: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	promptsPath: "Prompts/Prompts.md",
	dateFormat: "en-GB",
	destinationPath: "Answers/",
};

const VIEW_TYPE = "prompt-heatmap-view";

export default class PromptHeatmapPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon("notepad-text", "Get Random Prompt", async () => {
			const content = await this.getPromptsFileContent();
			if (!content) {
				new Notice("No content found in Prompts.md file!");
				return;
			}
			await this.parsePromptsFileContent(content);
		});

		this.addCommand({
			id: "get-random-prompt",
			name: "Get Random Prompt",
			callback: async () => {
				const content = await this.getPromptsFileContent();
				if (!content) {
					new Notice("No content found in Prompts.md file!");
					return;
				}
				await this.parsePromptsFileContent(content);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000),
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async getPromptsFileContent() {
		try {
			const cleanPath = this.settings.destinationPath.replace(/\/$/, "");
			const destinationFolder =
				this.app.vault.getAbstractFileByPath(cleanPath);
			const promptsFile = this.app.vault.getAbstractFileByPath(
				this.settings.promptsPath,
			);

			if (!destinationFolder) {
				new Notice("Destination folder not found! Creating it...");
				await this.app.vault.createFolder(cleanPath);
			}

			if (!promptsFile) {
				new Notice(
					"Prompts.md file not found in " + this.settings.promptsPath,
				);
				return;
			}

			const destinationFolderIsNotFolder = !(
				destinationFolder instanceof TFolder
			);
			if (destinationFolderIsNotFolder) {
				new Notice("Destination folder is not a folder!");
				return;
			}

			const promptsFileIsNotFile = !(promptsFile instanceof TFile);
			if (promptsFileIsNotFile) {
				new Notice("Prompts.md file is not a file!");
				return;
			}

			const content = await this.app.vault.read(promptsFile as any);
			return content;
		} catch (error) {
			console.error("Error getting random prompt:", error);
			new Notice(
				"Error getting random prompt. Check console for details.",
			);
			return;
		}
	}

	async parsePromptsFileContent(content: string) {
		if (!content) {
			new Notice("No content found in Prompts.md file!");
			return;
		}

		const uncheckedPrompt = await this.getUncheckedPrompt(content);
		const timestamp = new Date()
			.toLocaleDateString(this.settings.dateFormat)
			.replace(/\//g, "-");
		const fileName = `${timestamp}.md`;
		const fileNameExists = this.app.vault.getAbstractFileByPath(
			this.settings.destinationPath + fileName,
		);

		if (fileNameExists) {
			// Open the existing prompt note
			await this.app.workspace.getLeaf().openFile(fileNameExists as any);

			// TODO: This is so inefficient but I'm too lazy to fix it
			const existingContent = await this.app.vault.read(
				fileNameExists as any,
			);
			const existingContentLines = existingContent.split("\n");
			const promptsAnsweredIndex = existingContentLines.findIndex(
				(line) => line.trim().startsWith("promptsAnswered:"),
			);
			const promptsAnswered = existingContentLines[promptsAnsweredIndex]
				.trim()
				.split(":")[1]
				.trim();
			const newPromptsAnswered = parseInt(promptsAnswered) + 1;
			existingContentLines[promptsAnsweredIndex] =
				`promptsAnswered: ${newPromptsAnswered}`;

			const contentToAdd = `	
***\n

${uncheckedPrompt}

***\n


`;

			const newContent =
				existingContentLines.join("\n") + "\n" + contentToAdd;
			await this.app.vault.modify(fileNameExists as any, newContent);

			// Increment promptsAnswered count
			new Notice(
				"Prompt note already exists for today! Adding new prompt...",
			);
			return;
		} else {
			// Create new prompt note
			const uncheckedPrompt = await this.getUncheckedPrompt(content);

			if (!uncheckedPrompt) {
				new Notice("No unchecked prompts available!");
				return;
			}

			// Create the note content
			const noteContent = `---
promptsAnswered: 1
---

# Writing Prompt

${uncheckedPrompt}

***

`;

			// Create the new file in the destination folder
			const cleanPath = this.settings.destinationPath.replace(/\/$/, "");
			const fullPath = `${cleanPath}/${fileName}`;

			await this.app.vault.create(fullPath, noteContent);

			// Open the new note
			const newFile = this.app.vault.getAbstractFileByPath(fullPath);
			if (newFile) {
				await this.app.workspace.getLeaf().openFile(newFile as any);
			}

			new Notice(`Created new prompt note: ${fileName}`);
		}
	}

	async getUncheckedPrompt(content: string) {
		if (!content) {
			new Notice("No content found in Prompts.md file!");
			return;
		}

		const promptIndices = content
			.split("\n")
			.map((line, index) => ({ line, index }));
		const uncheckedPrompts = promptIndices.filter((prompt) =>
			prompt.line.trim().startsWith("- [ ]"),
		);

		if (uncheckedPrompts.length === 0) {
			new Notice("No unchecked prompts found!");
			return;
		}

		const randomIndex = Math.floor(Math.random() * uncheckedPrompts.length);

		// Mark the prompt as checked
		promptIndices[randomIndex] = {
			...uncheckedPrompts[randomIndex],
			line: uncheckedPrompts[randomIndex].line.replace("- [ ]", "- [x]"),
		};
		const updatedContent = promptIndices
			.map((prompt) => prompt.line)
			.join("\n");

		// Get the file object first, then modify it
		const promptsFile = this.app.vault.getAbstractFileByPath(
			this.settings.promptsPath,
		);
		if (promptsFile && promptsFile instanceof TFile) {
			await this.app.vault.modify(promptsFile, updatedContent);
		} else {
			new Notice("Could not find prompts file to update!");
			return;
		}

		const randomPrompt = uncheckedPrompts[randomIndex].line.replace(
			"- [ ]",
			"",
		);
		return randomPrompt;
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: PromptHeatmapPlugin;

	constructor(app: App, plugin: PromptHeatmapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Prompts Path")
			.setDesc("The path to your prompts file")
			.addText((text) =>
				text
					.setPlaceholder("Enter your prompts path")
					.setValue(this.plugin.settings.promptsPath)
					.onChange(async (value) => {
						this.plugin.settings.promptsPath = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Date Format")
			.setDesc("The date format to use for the generated prompt note")
			.addText((text) =>
				text
					.setPlaceholder("Enter your date format")
					.setValue(this.plugin.settings.dateFormat)
					.onChange(async (value) => {
						this.plugin.settings.dateFormat = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Destination Path")
			.setDesc("The path to the destination folder")
			.addText((text) =>
				text
					.setPlaceholder("Enter your destination path")
					.setValue(this.plugin.settings.destinationPath)
					.onChange(async (value) => {
						this.plugin.settings.destinationPath = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
