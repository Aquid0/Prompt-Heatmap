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

interface MyPluginSettings {
	promptsPath: string; // The path to your prompts file
	dateFormat: string; // The date format to use for the generated prompt note
	destinationPath: string; // The path to the destination folder
	promptsAnsweredFrontmatter: string; // The frontmatter key for the number of prompts answered
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	promptsPath: "Prompts/Prompts.md",
	dateFormat: "en-GB",
	destinationPath: "Answers/",
	promptsAnsweredFrontmatter: "promptsAnswered",
};

const UNCHECKED = "- [ ]"; // The checkbox for unchecked prompts
const CHECKED = "- [x]"; // The checkbox for checked prompts
const BOX_RE = /^\s*-\s*\[( |x|X)\]\s*(.*)$/; // The regex for a checkbox in markdown

export default class PromptHeatmapPlugin extends Plugin {
	settings: MyPluginSettings;
	isRunning: boolean = false; // Prevent multiple instances from running at the same time

	async onload(): Promise<void> {
		await this.loadSettings();

		const run = async () => {
			await this.createPromptNote();
		};

		this.addRibbonIcon("notepad-text", "Get Random Prompt", run);
		this.addCommand({
			id: "get-random-prompt",
			name: "Get Random Prompt",
			callback: run,
		});
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
		// Ensure prompts file exists and is a file
		const promptsPath = normalizePath(this.settings.promptsPath);
		const promptsFile = this.app.vault.getAbstractFileByPath(promptsPath);
		if (!(promptsFile instanceof TFile)) {
			throw new Error(`${promptsPath} is not a file!`);
		}

		// Ensure prompts file is not empty
		const content = await this.app.vault.read(promptsFile);
		if (!content.trim()) {
			throw new Error(`${promptsPath} is empty!`);
		}

		return content;
	}

	private pickUncheckedPrompt(content: string): {
		prompt: string;
		updatedContent: string;
	} {
		const lines = content.split("\n");

		const uncheckedIndices = lines
			.map((line, i) => {
				const m = line.match(BOX_RE);
				return m && m[1] === " " ? i : -1; // only truly unchecked, not a line with "- [ ] " in its body.
			})
			.filter((i) => i !== -1);

		if (uncheckedIndices.length === 0) {
			throw new Error("No unchecked prompts found!");
		}

		const pick =
			uncheckedIndices[
				Math.floor(Math.random() * uncheckedIndices.length)
			]; // Pick a random unchecked prompt

		const match = lines[pick].match(BOX_RE);
		if (!match) {
			throw new Error("Selected line does not match prompt pattern");
		}

		const prompt = match[2].trim();
		lines[pick] = lines[pick].replace(UNCHECKED, CHECKED);

		return { prompt, updatedContent: lines.join("\n") };
	}

	private async createPromptNote() {
		if (this.isRunning) return;
		this.isRunning = true;

		try {
			const content = await this.getPromptsFileContent();
			const { prompt, updatedContent } =
				this.pickUncheckedPrompt(content);

			// Update the prompts file with the updated content
			const promptsPath = normalizePath(this.settings.promptsPath);
			const promptsFile =
				this.app.vault.getAbstractFileByPath(promptsPath);
			if (!promptsFile || !(promptsFile instanceof TFile)) {
				throw new Error("Could not find prompts file to update!");
			}
			await this.app.vault.modify(promptsFile, updatedContent);

			const destinationPath = normalizePath(
				this.settings.destinationPath.replace(/\/$/, ""),
			);
			await this.ensureDestinationFolder(destinationPath);

			// Generate filename and path
			const timestamp = new Date()
				.toLocaleDateString(this.settings.dateFormat)
				.replace(/\//g, "-");
			const fileName = `${timestamp}.md`;
			const fullPath = `${destinationPath}/${fileName}`;
			const fileNameExists =
				this.app.vault.getAbstractFileByPath(fullPath);

			if (fileNameExists) {
				// Handle existing file - add new prompt to it
				await this.handleExistingPromptFile(
					fileNameExists as TFile,
					prompt,
				);
			} else {
				// Create new prompt note
				await this.createNewPromptFile(fullPath, prompt);
			}
		} catch (error) {
			console.error("Error in createPromptNote:", error);
			const msg =
				error instanceof Error ? error.message : "Unknown error";
			new Notice(`Error creating prompt note: ${msg}`);
		} finally {
			this.isRunning = false;
		}
	}

	private async ensureDestinationFolder(destPath: string): Promise<void> {
		let destination = this.app.vault.getAbstractFileByPath(destPath);
		if (!destination) {
			await this.app.vault.createFolder(destPath);
			destination = this.app.vault.getAbstractFileByPath(destPath);
		}
		if (!(destination instanceof TFolder)) {
			throw new Error(`${destPath} is not a folder!`);
		}
	}

	private async handleExistingPromptFile(
		file: TFile,
		prompt: string,
	): Promise<void> {
		try {
			// Open the existing prompt note
			await this.app.workspace.getLeaf(true).openFile(file);

			// Increment the prompts answered count in the frontmatter
			await this.app.fileManager.processFrontMatter(file, (fm) => {
				const n =
					typeof fm[this.settings.promptsAnsweredFrontmatter] ===
					"number"
						? fm[this.settings.promptsAnsweredFrontmatter]
						: 0;
				fm[this.settings.promptsAnsweredFrontmatter] =
					(n as number) + 1;
			});

			// Add new prompt content
			const contentToAdd = `

***

${"**" + prompt + "**"}

***

`;

			await this.app.vault.append(file, contentToAdd);

			new Notice(
				"Prompt note already exists for today! Adding new prompt...",
			);
		} catch (error) {
			console.error("Error handling existing prompt file:", error);
			const msg =
				error instanceof Error ? error.message : "Unknown error";
			new Notice(`Error updating existing prompt file: ${msg}`);
		}
	}

	private async createNewPromptFile(
		fullPath: string,
		prompt: string,
	): Promise<void> {
		try {
			// Create the note content
			const noteContent = `---
${this.settings.promptsAnsweredFrontmatter}: 1
---

# Writing Prompt

${"**" + prompt + "**"}

***

`;

			// Create the new file in the destination folder
			await this.app.vault.create(fullPath, noteContent);

			// Open the new note
			const newFile = this.app.vault.getAbstractFileByPath(fullPath);
			if (newFile) {
				await this.app.workspace
					.getLeaf(true)
					.openFile(newFile as TFile);
			}

			const fileName = fullPath.split("/").pop() || fullPath;
			new Notice(`Created new prompt note: ${fileName}`);
		} catch (error) {
			console.error("Error creating new prompt file:", error);
			const msg =
				error instanceof Error ? error.message : "Unknown error";
			new Notice(`Error creating new prompt file: ${msg}`);
		}
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

		new Setting(containerEl)
			.setName("Prompts Answered Frontmatter")
			.setDesc("The frontmatter key for the number of prompts answered")
			.addText((text) =>
				text
					.setPlaceholder("Enter your prompts answered frontmatter")
					.setValue(this.plugin.settings.promptsAnsweredFrontmatter)
					.onChange(async (value) => {
						this.plugin.settings.promptsAnsweredFrontmatter = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
