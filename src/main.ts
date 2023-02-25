import { Notice, Plugin } from 'obsidian';
import { Octokit } from 'octokit';
import { gitCollabSettingTab } from 'src/settings';
import { gitCollabSettings, DEFAULT_SETTINGS } from './Interfaces/gitCollabSettings';
var cron = require('node-cron');

export default class gitCollab extends Plugin {

    settings: gitCollabSettings;
    workspace: any;

    async onload() {

        console.log('Git-Collab Loaded!!!');

        //Load settings
        await this.loadSettings();
        this.addSettingTab(new gitCollabSettingTab(this.app, this));

        const statusBarItemEl = this.addStatusBarItem()

        //Add status bar item
        if (this.settings.status == true) {
            statusBarItemEl.setText('Loading Git-Collab...')
        }

        //Github Authentication
        const octokit = new Octokit({
            auth: this.settings.token,
        });

        //Check if the settings are set
        if (this.settings.token == '' || this.settings.owner == '' || this.settings.repo == '') {
            statusBarItemEl.setText(this.settings.settingsNotSetStatus)
            statusBarItemEl.ariaLabel = this.settings.settingsNotSetLabel
            return;
        }

        if (this.settings.splitStatus == true) {
            //
        }

        //Cron Job
        const cronJob: String = `*/${this.settings.checkInterval} * * * * *`
        cron.schedule(cronJob, async  () => {

            if (this.settings.debugMode && this.settings.cronDebugLogger) {
                console.log(`Git Collab: Cron task started with a timer of ${this.settings.checkInterval}`);
            }

            const commits = await this.getCommits(octokit);
            
            // export the constant commits to be used outside of the cron job
            // export const commits = await this.getCommits(octokit);


            if (commits.length == 0) {

                statusBarItemEl.setText(this.settings.noCommitsFoundStatus);
                statusBarItemEl.ariaLabel = this.settings.noCommitsFoundLabel;

                if (this.settings.debugMode && this.settings.commitDebugLogger) {
                    console.log(`Git Collab: No commits found`);
                }
                return;
            }
            else if (this.settings.debugMode && this.settings.cronDebugLogger) {
                console.log(`Git Collab: Commits fetched`);
            }

            //Get all modified files from commit and map their authors to them

            let filenames: string[] = []
            let files: any = []
            let fileMap: any = {}
            for (let i = 0; i < commits.length; i++) {
                for (let j = 0; j < commits[i].files.length; j++) {
                    filenames.indexOf(`${commits[i].commit.author.name} - ${commits[i].files[j].filename}`) == -1 ? filenames.push(`${commits[i].commit.author.name} - ${commits[i].files[j].filename}`) : null
                    files.indexOf(commits[i].files[j].filename) == -1 ? files.push(commits[i].files[j].filename) : null
                    fileMap[commits[i].files[j].filename] = commits[i].commit.author.name
                }
            }

            if (this.settings.notice || this.settings.status) {

                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile)
                    return;

                const author = fileMap[activeFile.path];
                const vaultOwner = this.settings.username;

                if (this.settings.notice) {
                    if (author && author != vaultOwner) {
                        const noticePromptWords: string[] = this.settings.noticePrompt.split(' ');
                        noticePromptWords.forEach((word, index) => {
                            if (word == '$author') {
                                noticePromptWords[index] = author;
                            }
                            else if (word == '$fileName') {
                                noticePromptWords[index] = activeFile.basename;
                            }
                        });
                        const noticePrompt = noticePromptWords.join(' ');
                        new Notice(noticePrompt);
                    }
                }

                if (this.settings.status) {

                    if (author && author != vaultOwner) {
                        statusBarItemEl.setText(this.settings.fileNotEditableStatus);
                        statusBarItemEl.ariaLabel = filenames.join('\n')
                    }
                    else {
                        statusBarItemEl.setText(this.settings.fileEditableStatus);
                        statusBarItemEl.ariaLabel = filenames.join('\n')
                    }

                }
            }
        });
    }


    onunload() {
        console.log('Git Collab: Unloading Plugin')
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async getCommits(octokit: Octokit) {
        const time_rn = new Date()
        const time_bf = new Date(time_rn.getTime() - this.settings.checkTime * 60000)

        if (this.settings.debugMode && this.settings.cronDebugLogger) {
            console.log(`Git Collab: Time Range: ${time_bf} - ${time_rn}`);
        }

        const response = await octokit.request("GET /repos/{owner}/{repo}/commits{?since,until,per_page,page}", {
            owner: this.settings.owner,
            repo: this.settings.repo,
            since: time_bf.toISOString(),
            until: time_rn.toISOString(),
            per_page: 100,
            page: 1,
        });


        let sha = []
        for (let i = 0; i < response.data.length; i++) {
            sha.push(response.data[i].sha)
        }

        let commits = []
        for (let i = 0; i < sha.length; i++) {

            const response2 = await octokit.request("GET /repos/{owner}/{repo}/commits/{ref}{?sha}", {
                owner: this.settings.owner,
                repo: this.settings.repo,
                ref: 'main',
                sha: sha[i]
            })

            if (response2.data.commit.message.includes('vault backup')) {
                commits.push(response2.data);

                if (this.settings.commitDebugLogger) {
                    console.log(`Git Collab: Commit added \n${response2.data.commit.message}`)
                }

            }
        }

        return commits;
    }
}