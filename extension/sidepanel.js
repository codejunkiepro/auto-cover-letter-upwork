document.addEventListener('DOMContentLoaded', () => {
    // Listen for messages from content script or background
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'displayCoverLetter') {
            displayCoverLetter(message.coverLetter, message.clientAnswers);
            createNotification("Cover Letter Generated", "Your cover letter and answers have been generated.");
            // Hide loading screen
            showLoading(false);
        } else if (message.action === 'showLoading') {
            showLoading(true);
        }
    });

});

const createNotification = (title, message) => {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon48.png',
        title: title,
        message: message,
        priority: 2
    });
};


const displayCoverLetter = (coverLetter, clientAnswers) => {
    const coverLetterContent = document.getElementById('coverLetterContent');
    coverLetterContent.innerHTML = `
        <p id="generatedCoverLetter">${coverLetter.replace(/\n/g, '<br>')}</p>
    `;

    const answersContent = document.getElementById('answersContent');
    answersContent.innerHTML = clientAnswers.map((answer, index) => {
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
        showNotification("Cover letter copied to clipboard.");
    });

    clientAnswers.forEach((_, index) => {
        document.getElementById(`generatedAnswer${index}`).addEventListener('click', () => {
            const answerText = document.getElementById(`generatedAnswer${index}`).innerText;
            copyToClipboard(answerText);
            showNotification("Answer copied to clipboard.");
        });
    });

    // Show cover letter and answers containers
    document.getElementById('coverLetterContainer').style.display = 'block';
    document.getElementById('answersContainer').style.display = 'block';
};

const copyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
};

const showNotification = (message) => {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 2000);
};

const showLoading = (isLoading) => {
    const loadingDiv = document.getElementById('loading');
    const coverLetterContainer = document.getElementById('coverLetterContainer');
    const answersContainer = document.getElementById('answersContainer');
    if (isLoading) {
        loadingDiv.style.display = 'block';
        coverLetterContainer.style.display = 'none';
        answersContainer.style.display = 'none';
    } else {
        loadingDiv.style.display = 'none';
    }
};
