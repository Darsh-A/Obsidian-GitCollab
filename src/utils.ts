import { Octokit } from "octokit";
import { gitCollabSettingTab } from 'src/settings';

export const getCommits: any = (octokit: Octokit) {

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