# ADR-[NUMBER]: [Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** [YYYY-MM-DD]
**Author(s):** [Name(s)]
**Deciders:** [List of people involved in decision]
**Technical Story:** [JIRA/Issue reference]

---

## 1. Context and Problem Statement

[Describe the context and problem that needs to be solved. Typically 1–3 short
paragraphs explaining:]

- What is the current situation?
- Why does this need to change now?
- What constraints or forces are at play (technical, business, operational, team)?

> Keep this focused: someone should understand **why a decision is needed** in
> under a minute.

---

## 2. Decision Drivers

Key factors influencing this decision (3–7 items):

- [Driver 1: e.g., performance requirements]
- [Driver 2: e.g., development velocity]
- [Driver 3: e.g., maintainability]
- [Driver 4: e.g., cost constraints]

---

## 3. Considered Options

1. **[Option 1 Name]** – [1–2 line description]
2. **[Option 2 Name]** – [1–2 line description]
3. **[Option 3 Name]** – [1–2 line description]

_(Add/remove options as needed; at least two options for any non-trivial ADR.)_

---

## 4. Decision Outcome

**Chosen option:** `[Option Name]`

### 4.1 Rationale

[Explain why this option was chosen, referring back to the decision drivers.
Highlight why rejected options were not chosen.]

### 4.2 Positive Consequences

- [Positive consequence 1]
- [Positive consequence 2]
- [Positive consequence 3]

### 4.3 Negative Consequences / Trade-offs

- [Negative consequence 1]
- [Negative consequence 2]
- [Technical debt or limitations accepted]

> Be explicit here – it's better to acknowledge trade-offs now than "rediscover"
> them later.

---

## 5. Detailed Option Analysis _(Recommended for major decisions)_

### 5.1 Option 1: [Name]

**Description**
[1–3 paragraphs describing the approach, how it would work in our context, and
any assumptions.]

**Pros**

- [Pro 1]
- [Pro 2]
- [Pro 3]

**Cons**

- [Con 1]
- [Con 2]
- [Con 3]

**Example / Proof of Concept (optional)**

```typescript
// Code example if relevant
```

**Evaluation**

Use a 1–5 scale (1 = poor, 5 = excellent) aligned to your decision drivers.

| Criteria        | Score (1–5) | Notes                   |
| --------------- | ----------- | ----------------------- |
| Performance     | 4           | Good for expected scale |
| Complexity      | 3           | Moderate learning curve |
| Maintainability | 5           | Well-documented pattern |
| Cost            | 4           | Within budget           |

---

### 5.2 Option 2: [Name]

**Description**
[As above]

**Pros**

- [Pro 1]
- [Pro 2]
- [Pro 3]

**Cons**

- [Con 1]
- [Con 2]
- [Con 3]

**Example / Proof of Concept (optional)**

```typescript
// Code example if relevant
```

**Evaluation**

| Criteria        | Score (1–5) | Notes             |
| --------------- | ----------- | ----------------- |
| Performance     | 3           | Adequate          |
| Complexity      | 5           | Simple to adopt   |
| Maintainability | 4           | Standard approach |
| Cost            | 5           | Minimal cost      |

---

### 5.3 Option 3: [Name]

**Description**
[As above]

**Pros**

- [Pro 1]
- [Pro 2]
- [Pro 3]

**Cons**

- [Con 1]
- [Con 2]
- [Con 3]

**Example / Proof of Concept (optional)**

```typescript
// Code example if relevant
```

**Evaluation**

| Criteria        | Score (1–5) | Notes              |
| --------------- | ----------- | ------------------ |
| Performance     | 5           | Best performance   |
| Complexity      | 2           | Complex to set up  |
| Maintainability | 3           | Requires expertise |
| Cost            | 2           | High initial cost  |

---

## 6. Implementation Plan

### 6.1 Phase 1 – [Initial Implementation]

- **Timeline:** [X weeks]
- **Tasks:**
  - [Task 1]
  - [Task 2]
  - [Task 3]

### 6.2 Phase 2 – [Rollout / Migration]

- **Timeline:** [X weeks]
- **Tasks:**
  - [Task 1]
  - [Task 2]
  - [Task 3]

### 6.3 Phase 3 – [Optimization / Cleanup]

- **Timeline:** [X weeks]
- **Tasks:**
  - [Task 1]
  - [Task 2]

> For small decisions, this can be a short list or link to an existing ticket /
> implementation plan.

---

## 7. Validation and Metrics

### 7.1 Success Criteria

- [Measurable criterion 1]
- [Measurable criterion 2]
- [Measurable criterion 3]

### 7.2 Monitoring

- [What metrics to track]
- [How to measure success]
- [When to revisit the decision (e.g. quarterly, at scale X, after incident Y)]

---

## 8. Risks and Mitigations

| Risk     | Probability (L/M/H) | Impact (L/M/H) | Mitigation      |
| -------- | ------------------- | -------------- | --------------- |
| [Risk 1] |                     |                | [How to handle] |
| [Risk 2] |                     |                | [How to handle] |

---

## 9. Future Considerations

- [What might cause us to revisit this decision]
- [Potential evolution of this solution]
- [Dependencies or external factors that might change]

---

## 10. References and Prior Art

- [Link to similar solutions]
- [Research papers or blog posts]
- [Internal documentation]
- [Industry best practices]

---

## 11. Decision Log

| Date       | Event            | Notes         |
| ---------- | ---------------- | ------------- |
| YYYY-MM-DD | Initial proposal | [Notes]       |
| YYYY-MM-DD | Review meeting   | [Feedback]    |
| YYYY-MM-DD | Decision made    | [Final notes] |

---

## 12. Metadata

- **ADR Number:** ADR-[NUMBER]
- **Supersedes:** [Previous ADR if any]
- **Superseded by:** [Later ADR if any]
- **Related ADRs:** [List of related decisions]
- **Tags:** [architecture, database, api, security, etc.]

---

## 13. Review and Approval

- [ ] Technical Review – [Name] – [Date]
- [ ] Architecture Review – [Name] – [Date]
- [ ] Team Review – [Date]
- [ ] Final Approval – [Name] – [Date]

---

## Template Instructions (Remove when creating a real ADR)

### When to use this template

Use an ADR when:

- Making significant architectural decisions.
- Choosing between competing technologies or patterns.
- Defining major practices or standards.
- Making decisions with long-term impact or non-trivial reversal cost.

### How to fill out

1. Start with Context and Problem Statement.
2. List Decision Drivers (what matters most).
3. Document at least 2–3 options considered.
4. Explain the chosen option and rationale.
5. Be explicit about trade-offs and risks.
6. Include an implementation plan if the decision is non-trivial.
7. Define how you will know if it worked and when to revisit.

### ADR Numbering

- Use sequential numbers: ADR-001, ADR-002, etc.
- Never reuse numbers.
- If superseding, reference the old ADR and update its status to `Superseded`.

### File Naming

```
adr-[NUMBER]-[brief-title-kebab-case].md
Example: adr-001-use-event-sourcing.md
```

> If you want a lighter "mini-ADR" template for smaller decisions (e.g. internal library choices),
> I can give you a 1-page variant that just keeps sections 1–4 and 7, with everything else optional.
