import os

from groq import Groq

from rag import search_chunks


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def build_context(query, category, k=5):

    results = search_chunks(
        query,
        category=category,
        top_k=k
    )

    context = "\n\n".join(
        [r["text"] for r in results]
    )

    sources = list(
        set(
            [r["source"] for r in results]
        )
    )

    return context, sources


def run_agent(question, category, role):

    context, sources = build_context(
        question,
        category
    )

    has_context = len(context.strip()) > 100

    if has_context:

        prompt = f"""
You are a {role}.

Answer ONLY using the provided context.

If the answer is not contained in the context,
respond exactly:

NOT_FOUND

Context:
{context}

Question:
{question}
"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0
        )

        answer = completion.choices[0].message.content

        if answer.strip() != "NOT_FOUND":

            return {
                "answer": answer,
                "sources": sources,
                "source_type": "rag"
            }

    fallback_prompt = f"""
You are an expert in:

- energy systems
- electricity markets
- transmission grids
- renewable energy
- data centers
- power generation

Answer professionally.

If the question is unrelated to energy,
electricity, infrastructure, data centers,
power systems or renewables, respond:

"I can only answer questions related to energy and infrastructure."

Question:
{question}
"""

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": fallback_prompt
            }
        ],
        temperature=0.2
    )

    answer = completion.choices[0].message.content

    return {
        "answer": answer,
        "sources": [],
        "source_type": "llm"
    }

def spain_agent(question):
    return run_agent(
        question,
        "spain",
        "Spain Energy Policy Expert"
    )


def ai_energy_agent(question):
    return run_agent(
        question,
        "ai-energy",
        "AI and Energy Expert"
    )


def grid_agent(question):
    return run_agent(
        question,
        "grids",
        "Electricity Grid Expert"
    )


def datacenter_agent(question):
    return run_agent(
        question,
        "datacenters",
        "Datacenter Infrastructure Expert"
    )


def renewables_agent(question):
    return run_agent(
        question,
        "renewables",
        "Renewable Energy Expert"
    )


def energy_agent(question):
    return run_agent(
        question,
        "energy",
        "Global Energy Systems Expert"
    )
