let isListenerAttached = false;

const notifyUser = (message) => {
    // Simple alert for user notification, you can replace this with a more sophisticated UI notification if needed
    alert(message);
};

const attachButtonListener = (retryCount = 0, maxRetries = 5, retryDelay = 500) => {
    const submitButton = document.querySelector('[aria-label="Apply Now"]');
    if (!submitButton) {
        console.log('Apply Now button not found');
        return retryAttachListener(retryCount, maxRetries, retryDelay);
    }

    if (submitButton && !isListenerAttached) {
        let jobDetails = {}
        const clickHandler = (event) => {
            event.preventDefault(); // Prevent the default form submission
            sendJobDetails(jobDetails);
        };

        submitButton.removeEventListener('click', clickHandler);

        const jobDetailCard = document.querySelector('.job-details-card');
        if (!jobDetailCard) {
            console.log('Job details card not found');
            return retryAttachListener(retryCount, maxRetries, retryDelay);
        }

        const jobTitleElement = jobDetailCard.querySelector('h4 span.flex-1');
        const jobDescriptionElement = jobDetailCard.querySelector('p.text-body-sm');
        const skillsElements = document.querySelectorAll('.job-details-card .skills-list a');

        if (!jobTitleElement || !jobDescriptionElement || skillsElements.length === 0) {
            console.log('Job details incomplete');
            return retryAttachListener(retryCount, maxRetries, retryDelay);
        }

        const jobTitle = jobTitleElement.innerText;
        const jobDescription = jobDescriptionElement.innerText;

        const skills = [];
        skillsElements.forEach(ele => {
            skills.push(ele.innerText);
        });

        const clientQuestions = [];
        const questionElements = document.querySelectorAll('.job-details-card ol.list-styled.mb-0 li');

        questionElements.forEach(ele => {
            clientQuestions.push(ele.innerText);
        });

        jobDetails = {
            job_title: jobTitle,
            description: jobDescription,
            skills: skills,
            clientQuestions: clientQuestions
        };

        submitButton.addEventListener('click', clickHandler);
        isListenerAttached = true;
        console.log('Listener attached successfully');
        return true;
    }
    return false;
};

const retryAttachListener = (retryCount, maxRetries, retryDelay) => {
    if (retryCount < maxRetries) {
        setTimeout(() => {
            attachButtonListener(retryCount + 1, maxRetries, retryDelay);
        }, retryDelay);
        return true;
    } else {
        console.log('Failed to attach button listener after maximum retries');
        notifyUser('Failed to attach the button listener. Please try refreshing the page or contact support if the issue persists.');
        return false;
    }
};

const sendJobDetails = async (jobDetails) => {
    try {
        // Notify the side panel to show the loading screen
        chrome.runtime.sendMessage({ action: 'showLoading' });

        const response = await fetch('http://localhost:8000/generate-cover-letter/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jobDetails)
        });

        const data = await response.json();
        if (data && data.cover_letter && data.client_answers) {
            // Send the cover letter and answers to the side panel
            chrome.runtime.sendMessage({
                action: 'displayCoverLetter',
                coverLetter: data.cover_letter,
                clientAnswers: data.client_answers
            });
        } else {
            console.error('Failed to generate cover letter');
        }
    } catch (error) {
        console.error('Error generating cover letter:', error);
    }
};

// Add event listeners to job sections
const jobSections = document.querySelectorAll('[data-ev-sublocation="job_feed_tile"]');
jobSections.forEach(section => {
    section.addEventListener('click', () => {
        // Start observing the document for changes when a job section is clicked
        const observer = new MutationObserver((mutations, observer) => {
            if (attachButtonListener()) {
                observer.disconnect(); // Stop observing once the button is found and listener is attached
                isListenerAttached = false; // Reset the flag for future sidebar opens
            }
        });

        observer.observe(document, { childList: true, subtree: true });

        // Try to attach the listener immediately in case the button is already available
        attachButtonListener();
    });
});

// Test function with sample data
const testWithSampleData = () => {
    const sampleJobDetails = {
        "job_title": "Logic App Deployment Instructor",
        "description": "We are seeking an experienced instructor to teach us how to seamlessly deploy standard logic apps with multiple workflows between two resource groups (dev to qa). The instructor will guide us through the entire process, explaining the key concepts and best practices. The main focus will be on achieving seamless deployments and ensuring a smooth transition from development to quality assurance. The ideal candidate should have in-depth knowledge of logic apps, resource groups, and deployment techniques. Strong communication and instructional skills are essential to effectively convey the information.\nRequired skills:\n- Expertise in logic apps and Azure resource groups\n- Strong understanding of workflow management\n- Familiarity with deployment techniques and best practices",
        "skills": ["Azure DevOps"],
        "clientQuestions": [
            "How many years' experience do you have with DevOps?",
            "How long have you worked with standard logic apps on Azure?",
            "Describe your recent experience with similar projects"
        ]
    };
    sendJobDetails(sampleJobDetails);
};

// Uncomment the line below to test with sample data
// testWithSampleData();
