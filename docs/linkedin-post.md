🛒 Built a Seller Support Chatbot for Amazon/Flipkart sellers — and it's now the project I'm having my students build from scratch.

The idea: an internal tool where a seller logs in and can ask an AI assistant questions about their own orders, inventory, and buyer messages — instead of digging through spreadsheets or five different marketplace tabs.

A few things I made sure to get right, because they're the parts that actually matter in production:

🔒 Multi-tenant data isolation — every query is scoped to the logged-in seller via their JWT, never trusted from client input. Two sellers, zero data leakage, verified explicitly.

🤖 LLM function calling, not hallucination — the AI never "knows" your data. It picks which database query answers your question, the backend runs it for real, and only then does the model turn the result into a sentence.

🛡️ A guardrail I care about — the assistant can draft a reply to a buyer message, but a human has to review and approve it. Nothing gets "sent" on its own. AI that assists, not AI that acts unsupervised.

📊 A full dashboard — sales analytics with real period-over-period comparisons, low-stock alerts, order tracking, and a docked AI panel that can hand back structured summaries, not just walls of text.

Stack: FastAPI + PostgreSQL on the backend, Next.js + TypeScript on the frontend, Google Gemini for the assistant.

The best part: this isn't a tutorial clone. My students are building their own version of this from a project brief, not a codebase — same schema challenges, same "wait, why can Gemini see another seller's orders" bugs I had to debug myself.

If you're teaching (or learning) full-stack + applied AI, happy to share the brief.

#buildinpublic #fastapi #nextjs #genai #softwareengineering #edtech
