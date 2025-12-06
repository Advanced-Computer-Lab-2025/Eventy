from pymongo import MongoClient
from typing import List, Dict, Any
from datetime import datetime, timedelta
import requests


class DataFetcher:
    """Fetches data from MongoDB and Node.js API for recommendations"""
    
    def __init__(self, mongodb_uri: str, node_api_url: str):
        self.client = MongoClient(mongodb_uri)
        self.db = self.client.get_default_database()
        self.node_api_url = node_api_url
        
    async def get_all_events(self, upcoming_only: bool = True) -> List[Dict[str, Any]]:
        """Fetch all events from MongoDB"""
        query = {}
        if upcoming_only:
            query["startDate"] = {"$gte": datetime.now()}
        
        events = list(self.db.events.find(query))
        
        # Convert ObjectId to string
        for event in events:
            event["_id"] = str(event["_id"])
            if "createdBy" in event:
                event["createdBy"] = str(event["createdBy"])
        
        return events
    
    async def get_event_by_id(self, event_id: str) -> Dict[str, Any]:
        """Fetch a single event by ID"""
        from bson import ObjectId
        
        event = self.db.events.find_one({"_id": ObjectId(event_id)})
        if event:
            event["_id"] = str(event["_id"])
            if "createdBy" in event:
                event["createdBy"] = str(event["createdBy"])
        return event
    
    async def get_user_interactions(self, user_id: str) -> Dict[str, Any]:
        """Get user interaction data (registrations, favorites)"""
        from bson import ObjectId
        
        # Get user's registrations (applications)
        registrations = list(self.db.applications.find({
            "createdBy": ObjectId(user_id),
            "status": {"$in": ["approved", "pending"]}
        }))
        
        registered_event_ids = [str(app.get("eventId")) for app in registrations if app.get("eventId")]
        
        # Get user's favorites
        user = self.db.users.find_one({"_id": ObjectId(user_id)})
        favorite_event_ids = []
        if user and "favorites" in user:
            favorite_event_ids = [str(fav) for fav in user["favorites"]]
        
        return {
            "registered_events": registered_event_ids,
            "favorite_events": favorite_event_ids,
            "user_data": {
                "role": user.get("role") if user else None,
                "faculty": user.get("faculty") if user else None
            }
        }
    
    async def get_event_popularity_metrics(self, event_id: str) -> Dict[str, int]:
        """Get popularity metrics for an event"""
        from bson import ObjectId
        
        # Count registrations
        registration_count = self.db.applications.count_documents({
            "eventId": ObjectId(event_id),
            "status": {"$in": ["approved", "pending"]}
        })
        
        # Count favorites
        favorite_count = self.db.users.count_documents({
            "favorites": ObjectId(event_id)
        })
        
        # Get feedback count and average rating
        feedbacks = list(self.db.feedbacks.find({"eventId": ObjectId(event_id)}))
        feedback_count = len(feedbacks)
        avg_rating = sum(f.get("rating", 0) for f in feedbacks) / feedback_count if feedback_count > 0 else 0
        
        return {
            "registration_count": registration_count,
            "favorite_count": favorite_count,
            "feedback_count": feedback_count,
            "avg_rating": avg_rating
        }
    
    async def get_all_popularity_metrics(self) -> Dict[str, Dict[str, int]]:
        """Get popularity metrics for all events"""
        events = await self.get_all_events(upcoming_only=False)
        metrics = {}
        
        for event in events:
            event_id = event["_id"]
            metrics[event_id] = await self.get_event_popularity_metrics(event_id)
        
        return metrics
