from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from openai import OpenAI
from dotenv import load_dotenv
from user_profile import profile  # Update this import statement
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
    client_questions = "\n".join(
        [f"Q: {question}" for question in job_details.clientQuestions]
    )

    prompt = f"""
    Here is my Upwork profile information:
    Name: {profile['name']}
    Skills: {', '.join(profile['skills'])}
    Work Experience: {profile['experience']}
    Portfolio: {portfolio_descriptions}
    Education: {profile['education']}
    Personal Introduction: {profile['introduction']}
    
    I am applying for the following job:
    Job Title: {job_details.job_title}
    Job Description: {job_details.description}
    Required Skills: {', '.join(job_details.skills)}
    
    Please write a professional and engaging cover letter for this job application. Also, provide answers to the following client questions:
    {client_questions}
    """

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
