chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        chrome.sidePanel.setOptions({ tabId, path: 'sidepanel.html', enabled: true }).catch(console.error);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'displayCoverLetter' || message.action === 'showLoading') {
        chrome.runtime.sendMessage(message);
    }
});
