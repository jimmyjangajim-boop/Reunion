# Simulation design

Implemented: an explicit scenario report mode, separate from recording actual events. Scenario originals and proposals persist, and domain approval rejects them. No generated political/military/economic outcomes or provider calls are implemented.

Planned modes: manual outcomes; assisted recommendations by default for major choices; reproducible rule-based scenarios with input state, rules version, assumptions and seed. Store scenario outputs separately. Only an explicit record report may adopt an outcome.

Future optional extraction providers may include OpenAI-compatible APIs and local Ollama. Core records, accounting, votes, retrieval and validation must work without keys. Retrieve relevant dated canon, not the entire database. Validate typed proposed actions; never run generated SQL. Keys remain server-side and excluded from Git; no new dependencies or paid services were added this session.
