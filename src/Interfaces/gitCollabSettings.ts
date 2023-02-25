export interface gitCollabSettings {

    token: string;
    owner: string;
    repo: string;
    checkInterval: number;
    checkTime: number;

    notice: boolean;
    status: boolean;
    splitStatus: boolean;
    splitInterval: number;
    username: string;
    // fileOwners: boolean;
    // nameOwners: string;

    debugMode: boolean;
    cronDebugLogger: boolean;
    commitDebugLogger: boolean;
    splitDebugLogger: boolean;

    allFormatting: boolean;
    settingsNotSetStatus: string;
    settingsNotSetLabel: string;
    noCommitsFoundStatus: string;
    noCommitsFoundLabel: string;
    noticePrompt: string;
    fileEditableStatus: string;
    fileNotEditableStatus: string;
}

export const DEFAULT_SETTINGS: gitCollabSettings = {
    checkInterval: 15,
    checkTime: 2,
    token: '',
    owner: '',
    repo: '',

    notice: false,
    status: false,
    splitStatus: false,
    splitInterval: 15,
    username: '',
    // fileOwners: false,
    // nameOwners: '',

    debugMode: false,
    cronDebugLogger: false,
    commitDebugLogger: false,
    splitDebugLogger: false,

    allFormatting: false,
    settingsNotSetStatus: '🚫',
    settingsNotSetLabel: 'Settings have not been set.',
    noCommitsFoundStatus: '〰️',
    noCommitsFoundLabel: 'No one seems to be active. enjoy writing notes!',
    noticePrompt: 'This file is being edited by $author',
    fileEditableStatus: '✅',
    fileNotEditableStatus: '❌',

};