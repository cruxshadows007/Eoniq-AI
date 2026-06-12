
from agents import (
    spain_agent,
    ai_energy_agent,
    grid_agent,
    datacenter_agent,
    renewables_agent,
    energy_agent
)


ROUTES = {

    "spain": [
        "spain",
        "pniec",
        "spanish",
        "españa",
        "renewable targets"
    ],

    "ai-energy": [
        "ai",
        "artificial intelligence",
        "machine learning",
        "llm",
        "data center power"
    ],

    "grids": [
        "grid",
        "transmission",
        "distribution",
        "interconnection",
        "electricity network"
    ],

    "datacenters": [
        "data center",
        "datacenter",
        "hyperscale",
        "cloud infrastructure"
    ],

    "renewables": [
        "solar",
        "wind",
        "renewable",
        "renewables"
    ],

    "energy": [
        "electricity",
        "energy",
        "generation",
        "power demand",
        "ppa",
        "battery",
        "storage",
        "bess",
        "power plant",
        "plant",
        "utility",
        "market",
        "capacity",
        "operator",
        "iberdrola",
        "endesa",
        "enel",
        "nuclear",
        "hydrogen"
    ]

}


def classify_question(question):

    q = question.lower()

    for category, keywords in ROUTES.items():

        for keyword in keywords:

            if keyword in q:
                return category

    return "energy"


def orchestrator(question):

    route = classify_question(question)

    if route == "spain":
        result = spain_agent(question)

    elif route == "ai-energy":
        result = ai_energy_agent(question)

    elif route == "grids":
        result = grid_agent(question)

    elif route == "datacenters":
        result = datacenter_agent(question)

    elif route == "renewables":
        result = renewables_agent(question)

    else:
        result = energy_agent(question)

    result["route"] = route

    return result
