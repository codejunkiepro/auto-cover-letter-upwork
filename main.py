from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from openai import OpenAI
from dotenv import load_dotenv
from user_profile import profile  # Updated import statement

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Set your OpenAI API key and organization ID from the environment variables
api_key = os.getenv("OPENAI_API_KEY")
organization_id = os.getenv("OPENAI_ORGANIZATION_ID")

client = OpenAI(api_key=api_key)

# Allow all origins for simplicity, you can restrict this to specific origins if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


class JobDetails(BaseModel):
    job_title: str
    description: str
    skills: list[str]
    clientQuestions: list[str]

@app.post("/generate-cover-letter/")
async def generate_cover_letter(job_details: JobDetails):
    print(job_details)
    
    portfolio_descriptions = "\n".join(
        [f"{item['title']}: {item['description']}" for item in profile["portfolio"]]
    )
    
    career_experience = "\n".join(
        [f"{exp['company']} - {exp['position']} ({exp['duration']}): {exp.get('responsibilities', 'Responsibilities not provided.')}" 
         for exp in profile["career_experience"]]
    )
    
    upwork_experience = "\n".join(
        [f"{item['title']}: {item.get('description', '')} {item.get('client_feedback', '')}" 
         for item in profile["upwork_experience"]]
    )
    
    career_highlights = "\n".join(profile["career_highlights"])
    
    client_questions = "\n".join(
        [f"Q: {question}" for question in job_details.clientQuestions]
    )
    
    talent_clouds = ", ".join(profile["talent_clouds"])

    prompt = f"""
        Here is my Upwork profile information:
        - **Name:** {profile['name']}
        - **Skills:** {', '.join(profile['skills'])}
        - **Work Experience:** {profile['experience']}
        - **Career Experience:** {career_experience}
        - **Portfolio:** {portfolio_descriptions}
        - **Upwork Experience:** {upwork_experience}
        - **Education:** {profile['education'][0]}
        - **Personal Introduction:** {profile['introduction']}
        - **Career Highlights:** {career_highlights}
        - **Talent Clouds:** {talent_clouds}
        - **GitHub:** {profile['github']}

        I am applying for the following job:
        - **Job Title:** {job_details.job_title}
        - **Job Description:** {job_details.description}
        - **Required Skills:** {', '.join(job_details.skills)}

        Please write a professional and engaging cover letter for this job application.

        ---

        **Client Questions:**
        {client_questions}

        ---

        **Format for Client Questions and Answers:**
        Q1: How many years....
        A1: I have 10+ years.....

        Q2: ...
        A2: ...

        ---

        **Tips for writing an effective cover letter:**
        1. Use "Hello," instead of "Dear Hiring Manager,".
        2. Don't include the project title in the cover letter. For example, say "I am writing to express my interest in <<your job>>" instead of "<<job title>> of your existing website."
        3. Provide clear and concise answers for client questions, avoiding unnecessary details.
        4. Avoid generic statements like "I have [X] years of experience". Focus on specific skills and achievements.
        5. Client questions and answers should be provided separately from the cover letter.

        ---

        **Additional Tips for Cover Letters:**
        6. Mention specific technologies or stacks you've worked with, like [Project Main Stacks], to showcase your expertise.
        7. Include work samples in your proposal to provide concrete examples of your skills.
        8. Highlight your experience with high-frequency [Project Main Stacks] and other relevant technologies to demonstrate a broad skill set.
        9. Showcase work samples related to [Project Main Stacks] to demonstrate your experience in this specific area.
        10. Emphasize your proficiency in [Project Main Skills], as these are key programming languages required for the role.
        11. Mention your ability to work independently and collaborate with cross-functional teams to emphasize your fit for the responsibilities mentioned in the job posting.
        12. Generate and include questions about the project and include these in the cover letter.
        """

    print(prompt)
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional cover letter writer.",
                },
                {"role": "user", "content": prompt},
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Splitting the generated text into cover letter and answers
    generated_text = response.choices[0].message.content.strip()
    parts = generated_text.split("Client Questions:")
    cover_letter = parts[0].strip()
    client_answers = ["Client Questions:" + part.strip() for part in parts[1:]]

    return {"cover_letter": cover_letter, "client_answers": client_answers}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
