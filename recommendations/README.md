# Eventy AI Recommendation Engine

AI-powered event recommendation system using hybrid content-based and popularity-based filtering.

## Features

- **Personalized Recommendations**: Tailored event suggestions based on user preferences, favorites, and registration history
- **Similar Events**: Content-based similarity using TF-IDF and cosine similarity
- **Trending Events**: Popularity-based recommendations with time decay
- **Smart Scoring**: Multi-factor scoring including:
  - User's favorite event similarity
  - Faculty/department matching
  - Category preferences
  - Registration urgency
  - Limited capacity alerts
  - Event popularity metrics

## Setup

### 1. Install Python Dependencies

```bash
cd recommendations
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file in the `recommendations` folder:

```env
MONGODB_URI=mongodb://localhost:27017/eventy
API_PORT=8000
NODE_API_URL=http://localhost:5000/api
```

### 3. Start the Recommendation Service

```bash
cd recommendations
python main.py
```

The service will start on `http://localhost:8000`

## API Endpoints

### Get User Recommendations

```
GET /recommendations/user/{userId}?limit=8&exclude_registered=true
```

Returns personalized event recommendations with scores and reasons.

### Get Similar Events

```
GET /recommendations/similar/{eventId}?limit=6
```

Returns events similar to the specified event.

### Get Popular Events

```
GET /recommendations/popular?limit=10&category=workshop&time_range=week
```

Returns trending/popular events.

### Refresh Data

```
POST /recommendations/refresh
```

Manually refresh the recommendation engine data from the database.

## Architecture

- **FastAPI**: High-performance Python web framework
- **scikit-learn**: TF-IDF vectorization and cosine similarity
- **MongoDB**: Direct database access for event and user data
- **NumPy**: Efficient numerical computations

## How It Works

1. **Feature Extraction**: Events are converted to TF-IDF vectors based on category, name, description, location, and faculty
2. **Similarity Computation**: Cosine similarity matrix computed between all events
3. **Popularity Scoring**: Events scored based on registrations, favorites, ratings, and time factors
4. **Personalized Ranking**: User-specific recommendations combine:
   - Similarity to user's favorite events (50% weight)
   - Popularity score (30% weight)
   - Faculty/category matches (20% weight)
   - Urgency boosters (deadline, capacity)

## Integration with Node.js Backend

The Express server proxies recommendation requests to this Python service:

- `/api/recommendations/user/:userId`
- `/api/recommendations/similar/:eventId`
- `/api/recommendations/popular`

## Future Enhancements

- [ ] Collaborative filtering using user-event interaction matrix
- [ ] Deep learning embeddings with neural networks
- [ ] A/B testing framework
- [ ] Real-time recommendation updates
- [ ] Personalized email digests
