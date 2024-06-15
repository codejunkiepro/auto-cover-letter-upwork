document.addEventListener('DOMContentLoaded', () => {
    const port = chrome.runtime.connect({name: "popup"});
    port.postMessage({action: 'getCoverLetterAndAnswers'});

    chrome.storage.local.get(['coverLetter', 'clientAnswers'], (result) => {
        if (result.coverLetter && result.clientAnswers) {
            displayCoverLetter(result.coverLetter, result.clientAnswers);
            createNotification("Cover Letter Generated", "Your cover letter and answers have been generated.");
        }
    });
});

const displayCoverLetter = (coverLetter, clientAnswers) => {
    const coverLetterContainer = document.getElementById('coverLetterContainer');
    coverLetterContainer.innerHTML = `
        <p id="generatedCoverLetter">${coverLetter.replace(/\n/g, '<br>')}</p>
    `;

    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = clientAnswers.map((answer, index) => {
        const [question, answerText] = answer.split('\nA: ');
        return `
            <div>
                <p class="question" id="generatedQuestion${index}">${question.replace('Q:', '').trim()}</p>
                <p class="answer" id="generatedAnswer${index}">${answerText}</p>
            </div>
        `;
    }).join('');

    document.getElementById('generatedCoverLetter').addEventListener('click', () => {
        copyToClipboard(coverLetter);
        createNotification("Copied to Clipboard", "Cover letter copied to clipboard.");
    });

    clientAnswers.forEach((_, index) => {
        document.getElementById(`generatedAnswer${index}`).addEventListener('click', () => {
            const answerText = document.getElementById(`generatedAnswer${index}`).innerText;
            copyToClipboard(answerText);
            createNotification("Copied to Clipboard", "Answer copied to clipboard.");
        });
    });
};

const copyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
};

const createNotification = (title, message) => {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon48.png',
        title: title,
        message: message,
        priority: 2
    });
};
