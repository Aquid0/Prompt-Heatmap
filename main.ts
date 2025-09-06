/*
for refactoring
- Look at parsePromptsFileContent 
- Look at getUncheckedPrompt
*/


import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
	normalizePath, // Useful for normalising paths with odd slashes/spaces
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	promptsPath: string; // The path to your prompts file
	dateFormat: string; // The date format to use for the generated prompt note
	destinationPath: string; // The path to the destination folder
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	promptsPath: "Prompts/Prompts.md",
	dateFormat: "en-GB",
	destinationPath: "Answers/",
};

export default class PromptHeatmapPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		const run = async () => {
			try {
				const content = await this.getPromptsFileContent();
				await this.parsePromptsFileContent(content);
			} catch (error) {
				console.error(error);
				const msg =
					error instanceof Error ? error.message : "Unknown error";
				new Notice(`Error: ${msg}`);
			}
		};

		this.addRibbonIcon("notepad-text", "Get Random Prompt", run);
		this.addCommand({ id: "get-random-prompt", name: "Get Random Prompt", callback: run });
		this.addSettingTab(new PromptSettingTab(this.app, this));
	}

	onunload(): void {}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private async getPromptsFileContent(): Promise<string> {
		const cleanPath = normalizePath(
			this.settings.destinationPath.replace(/\/$/, ""),
		);

		// Ensure destination folder exists
		let destination = this.app.vault.getAbstractFileByPath(cleanPath);
		if (!destination) {
			await this.app.vault.createFolder(cleanPath);
			destination = this.app.vault.getAbstractFileByPath(cleanPath);
		}

		if (!(destination instanceof TFolder)) {
			throw new Error(`${cleanPath} is not a folder!`);
		}

		// Ensure prompts file exists and is a file
		const promptsFile = this.app.vault.getAbstractFileByPath(
			this.settings.promptsPath,
		);
		if (!(promptsFile instanceof TFile)) {
			throw new Error(`${this.settings.promptsPath} is not a file!`);
		}

		const content = await this.app.vault.read(promptsFile);
		if (!content.trim()) {
			throw new Error(`${this.settings.promptsPath} is empty!`);
		}

		return content;
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
		const cleanPath = this.settings.destinationPath.replace(/\/$/, "");
		const fullPath = `${cleanPath}/${fileName}`;
		const fileNameExists = this.app.vault.getAbstractFileByPath(fullPath);

		if (fileNameExists) {
			// Open the existing prompt note
			await this.app.workspace
				.getLeaf()
				.openFile(fileNameExists as TFile);

			// TODO: This is so inefficient but I'm too lazy to fix it
			const existingContent = await this.app.vault.read(
				fileNameExists as TFile,
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
			await this.app.vault.modify(fileNameExists as TFile, newContent);

			// Increment promptsAnswered count
			new Notice(
				"Prompt note already exists for today! Adding new prompt...",
			);
			return;
		} else {
			// Create new prompt note
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
				await this.app.workspace.getLeaf().openFile(newFile as TFile);
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
		const selectedPrompt = promptIndices[randomIndex];
		promptIndices[randomIndex] = {
			...promptIndices[randomIndex],
			line: promptIndices[randomIndex].line.replace("- [ ]", "- [x]"),
		};
		const updatedContent = promptIndices
			.map((prompt) => prompt.line)
			.join("\n");

		// Get the file object first, then modify it
		const promptsFile = this.app.vault.getAbstractFileByPath(
			this.settings.promptsPath,
		);
		if (promptsFile && promptsFile instanceof TFile) {
			await this.app.vault.modify(promptsFile as TFile, updatedContent);
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

class PromptSettingTab extends PluginSettingTab {
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
