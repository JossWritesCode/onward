/** What "Copy prompt" copies. Paste it into an AI chat, followed by your resume. */
export const RESUME_PROMPT = `Format my resume for Onward, my job-search app. Reply with only one code block
containing JSON in exactly this shape, and no other text:

{
  "name": "", "title": "", "location": "", "phone": "", "email": "",
  "links": ["linkedin.com/in/...", "github.com/..."],
  "summary": "",
  "skills": [
    { "label": "Frontend Development", "items": ["React", "TypeScript"] },
    { "label": "Testing & Delivery", "items": ["Git", "CI/CD"] }
  ],
  "experience": [{
    "title": "", "company": "", "location": "",
    "start": "2022-08", "end": "2023-06",
    "bullets": [""]
  }],
  "education": [{ "school": "", "degree": "", "date": "2013-02", "honors": "" }],
  "sections": [{
    "heading": "Projects",
    "items": [{ "title": "", "subtitle": "", "date": "", "bullets": [""] }]
  }]
}

Rules:
- Dates as YYYY-MM, or "Present" for a current role.
- Plain text only: no markdown, asterisks, or bullet symbols inside the values.
- Add as many skills groups as fit, with your own labels (for example
  "Backend & Cloud Infrastructure" or "Testing & Delivery").
- Leave a field as "" if you don't know it. Never make up contact details.
- Most recent experience first.

Here's my resume, or what I'd like it to say:
`;
