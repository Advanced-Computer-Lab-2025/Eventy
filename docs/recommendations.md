# AI Smart Recommendations (The Discovery Feature)

## Overview

The "Discovery" feature is a sophisticated, hybrid recommendation engine designed to guide users from their first visit to becoming active, engaged participants. It evolves in real-time based on user actions, ensuring that the content displayed is always relevant to their current interests.

## The Three States of Discovery

The system operates in three distinct modes based on the user's engagement level:

### 1. Cold Start (Hidden State)

- **Trigger:** New users with **0-2 interactions** (views/favorites) and **0 registrations**.
- **Behavior:** The recommendation section is completely **hidden**.
- **Reasoning:** We avoid showing random guesses to new users. Instead, they see the standard event lists to explore naturally.

### 2. Warm Start (Popular State)

- **Trigger:** Users with **3-4 interactions** (views/favorites) but **0 registrations**.
- **Behavior:** The system displays **"Popular Events"**.
- **Logic:**
  - Calculates a popularity score for all upcoming events:
    $$ \text{Score} = (\text{Attendees} \times 5) + (\text{Views} \times 1) $$
  - Shows the top 5 highest-scoring events.
- **Goal:** "Demand Creation" — showing what is trending on campus to spark interest.

### 3. Hot Start (Personalized State)

- **Trigger:** Users with **5+ interactions** OR **at least 1 registration**.
- **Behavior:** The system switches to **"Recommended for You"**.
- **Logic:** Uses a Transformer-based AI model to generate content-aware suggestions.

---

## AI Recommendation Logic (Under the Hood)

When in the "Personalized" state, the system uses **Vector Embeddings** and **Cosine Similarity** to find matches.

### 1. Data Collection (Real-Time)

Every time the page loads, the system fetches the user's **current** active history:

- **Views:** Events the user has clicked on.
- **Favorites:** Events currently in the user's favorites list.
- **Registrations:** Events the user is currently registered for.

> **Note:** If a user **un-favorites** or **cancels a registration**, that event is immediately removed from this list and will **not** influence future recommendations.

### 2. Vector Generation

We use the `Xenova/all-MiniLM-L6-v2` model to convert text into mathematical vectors (lists of numbers representing meaning).

- **Event Vector:** Generated from the event's **Name**, **Description**, **Agenda**, and **Type**.
- **User Vector:** A weighted compilation of their history:
  - **Views:** Added 1x (Low signal)
  - **Favorites:** Added 3x (Medium signal)
  - **Registrations:** Added 5x (High signal)

### 3. Matching & Scoring

The system compares the **User Vector** against all **Upcoming Event Vectors** using Cosine Similarity.

- **Similarity Score:** A number between -1 and 1 indicating how close the match is.
- **Category Boost:** If a candidate event matches the category of an event the user has already registered for, it gets a **+10% score boost**.

### 4. Filtering

- **Already Attending:** Events the user is already registered for are excluded.
- **Past Events:** Only future events are considered.
- **Registration Closed:** Events where the registration deadline has passed are excluded.
- **Threshold:** Only events with a similarity score > 0.2 are shown.

---

## User Actions & System Response

| User Action             | System Response                                                                                                                                                             |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **View an Event**       | Counts as 1 interaction. Adds weak signal to User Vector.                                                                                                                   |
| **Favorite an Event**   | Counts as 1 interaction. Adds medium signal (3x) to User Vector.                                                                                                            |
| **Register for Event**  | **IMMEDIATELY** triggers "Personalized" state (if not already active). Adds strong signal (5x).                                                                             |
| **Un-Favorite**         | Event is removed from history. Next recommendation refresh will **ignore** this event.                                                                                      |
| **Cancel Registration** | Event is removed from history. Next refresh will **ignore** it. If user drops below threshold (0 registrations & <5 interactions), system reverts to "Popular" or "Hidden". |
| **Reset (Demo)**        | Clears all view history. Reverts user to "Cold Start" (Hidden) state.                                                                                                       |

## Technical Stack

- **Model:** `@xenova/transformers` (all-MiniLM-L6-v2) running locally in Node.js.
- **Database:** MongoDB (Mongoose) for storing events and user history.
- **Algorithm:** Weighted Cosine Similarity with Hybrid Filtering.

## AI Server Setup

To run the recommendation engine locally, ensure the following setup:

### 1. Dependencies

The project uses `@xenova/transformers` for local inference.

```bash
npm install @xenova/transformers
```

### 2. Model Download

The model `Xenova/all-MiniLM-L6-v2` is downloaded automatically to the `node_modules` or cache folder upon the first execution of the recommendation service.

- **First Run:** May take a few moments to download the model (~90MB).
- **Subsequent Runs:** Loads instantly from cache.

### 3. Environment

- **Node.js:** Required (v18+ recommended).
- **Memory:** The model is lightweight and runs efficiently on standard development machines.

\*\*\* End Patch
