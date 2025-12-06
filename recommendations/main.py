from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from datetime import datetime

from services.recommendation_engine import RecommendationEngine
from services.data_fetcher import DataFetcher

load_dotenv()

app = FastAPI(title="Eventy Recommendation Engine", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
data_fetcher = DataFetcher(
    mongodb_uri=os.getenv("MONGODB_URI", "mongodb://localhost:27017/eventy"),
    node_api_url=os.getenv("NODE_API_URL", "http://localhost:5000/api")
)
recommendation_engine = RecommendationEngine(data_fetcher)


class RecommendationResponse(BaseModel):
    event_id: str
    score: float
    reason: str


@app.on_event("startup")
async def startup_event():
    """Initialize recommendation engine on startup"""
    print("🚀 Starting Eventy Recommendation Engine...")
    await recommendation_engine.initialize()
    print("✅ Recommendation engine ready!")


@app.get("/")
async def root():
    return {
        "service": "Eventy Recommendation Engine",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/recommendations/user/{user_id}", response_model=List[RecommendationResponse])
async def get_user_recommendations(
    user_id: str,
    limit: int = 8,
    exclude_registered: bool = True
):
    """
    Get personalized event recommendations for a user
    
    Args:
        user_id: User ID to get recommendations for
        limit: Maximum number of recommendations to return
        exclude_registered: Whether to exclude events user already registered for
    
    Returns:
        List of recommended events with scores and reasons
    """
    try:
        recommendations = await recommendation_engine.get_user_recommendations(
            user_id=user_id,
            limit=limit,
            exclude_registered=exclude_registered
        )
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommendations/similar/{event_id}", response_model=List[RecommendationResponse])
async def get_similar_events(event_id: str, limit: int = 6):
    """
    Get events similar to the given event
    
    Args:
        event_id: Event ID to find similar events for
        limit: Maximum number of similar events to return
    
    Returns:
        List of similar events with similarity scores
    """
    try:
        similar_events = await recommendation_engine.get_similar_events(
            event_id=event_id,
            limit=limit
        )
        return similar_events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommendations/popular", response_model=List[RecommendationResponse])
async def get_popular_events(
    limit: int = 10,
    category: Optional[str] = None,
    time_range: str = "week"
):
    """
    Get trending/popular events
    
    Args:
        limit: Maximum number of events to return
        category: Filter by event category (optional)
        time_range: Time range for popularity calculation (week, month, all)
    
    Returns:
        List of popular events
    """
    try:
        popular_events = await recommendation_engine.get_popular_events(
            limit=limit,
            category=category,
            time_range=time_range
        )
        return popular_events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommendations/refresh")
async def refresh_data():
    """Refresh recommendation engine data from database"""
    try:
        await recommendation_engine.refresh_data()
        return {"status": "success", "message": "Data refreshed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
