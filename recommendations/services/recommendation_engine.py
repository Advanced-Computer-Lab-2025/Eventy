from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict

from .data_fetcher import DataFetcher


class RecommendationEngine:
    """Content-based recommendation engine with popularity boosting"""
    
    def __init__(self, data_fetcher: DataFetcher):
        self.data_fetcher = data_fetcher
        self.events = []
        self.event_features = None
        self.similarity_matrix = None
        self.event_id_to_index = {}
        self.popularity_scores = {}
        
    async def initialize(self):
        """Load and process data on startup"""
        await self.refresh_data()
    
    async def refresh_data(self):
        """Refresh event data and recompute similarities"""
        print("📊 Fetching events from database...")
        self.events = await self.data_fetcher.get_all_events(upcoming_only=True)
        print(f"✅ Loaded {len(self.events)} events")
        
        if len(self.events) > 0:
            self._build_event_features()
            self._compute_similarity_matrix()
            await self._compute_popularity_scores()
    
    def _build_event_features(self):
        """Extract and vectorize event features"""
        event_texts = []
        
        for i, event in enumerate(self.events):
            self.event_id_to_index[event["_id"]] = i
            
            # Combine textual features
            category = event.get("category", "")
            name = event.get("name", "")
            description = event.get("description", "")
            location = event.get("location", "")
            faculty = event.get("faculty", "")
            
            # Create feature string (category gets extra weight by repetition)
            text = f"{category} {category} {category} {name} {description} {location} {faculty}"
            event_texts.append(text)
        
        # Create TF-IDF vectors
        vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.event_features = vectorizer.fit_transform(event_texts)
        print(f"✅ Built feature vectors with shape {self.event_features.shape}")
    
    def _compute_similarity_matrix(self):
        """Compute cosine similarity between all events"""
        self.similarity_matrix = cosine_similarity(self.event_features)
        print("✅ Computed similarity matrix")
    
    async def _compute_popularity_scores(self):
        """Compute popularity scores for all events"""
        print("📈 Computing popularity scores...")
        metrics = await self.data_fetcher.get_all_popularity_metrics()
        
        for event in self.events:
            event_id = event["_id"]
            event_metrics = metrics.get(event_id, {})
            
            # Weighted popularity score
            registration_count = event_metrics.get("registration_count", 0)
            favorite_count = event_metrics.get("favorite_count", 0)
            avg_rating = event_metrics.get("avg_rating", 0)
            
            # Time decay - events happening sooner get slight boost
            start_date = event.get("startDate")
            days_until_event = 999
            if start_date:
                if isinstance(start_date, str):
                    start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                days_until_event = (start_date - datetime.now()).days
            
            time_boost = 1 / (1 + days_until_event / 30) if days_until_event > 0 else 0
            
            # Combined popularity score
            popularity = (
                registration_count * 3 +
                favorite_count * 2 +
                avg_rating * 10 +
                time_boost * 5
            )
            
            self.popularity_scores[event_id] = popularity
        
        print("✅ Popularity scores computed")
    
    async def get_user_recommendations(
        self,
        user_id: str,
        limit: int = 8,
        exclude_registered: bool = True
    ) -> List[Dict[str, Any]]:
        """Get personalized recommendations for a user"""
        
        if len(self.events) == 0:
            return []
        
        # Get user interaction data
        user_data = await self.data_fetcher.get_user_interactions(user_id)
        registered_events = set(user_data["registered_events"])
        favorite_events = set(user_data["favorite_events"])
        clicked_recommendations = set(user_data.get("clicked_recommendations", []))
        user_role = user_data["user_data"].get("role")
        user_faculty = user_data["user_data"].get("faculty")
        
        # STRICT: Return empty if user has NO favorites AND NO registrations
        if len(favorite_events) == 0 and len(registered_events) == 0:
            return []
        
        # Compute scores for each event
        event_scores = []
        
        for event in self.events:
            event_id = event["_id"]
            
            # Skip if already registered
            if exclude_registered and event_id in registered_events:
                continue
            
            # Skip past events
            start_date = event.get("startDate")
            if start_date:
                if isinstance(start_date, str):
                    start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if start_date < datetime.now():
                    continue
            
            score = 0
            reasons = []
            
            # Base popularity score
            popularity = self.popularity_scores.get(event_id, 0)
            score += popularity * 0.3
            
            # Content-based scoring from favorite events
            if favorite_events:
                max_similarity = 0
                for fav_id in favorite_events:
                    if fav_id in self.event_id_to_index:
                        fav_idx = self.event_id_to_index[fav_id]
                        event_idx = self.event_id_to_index[event_id]
                        similarity = self.similarity_matrix[fav_idx][event_idx]
                        max_similarity = max(max_similarity, similarity)
                
                score += max_similarity * 50
                if max_similarity > 0.3:
                    reasons.append("Similar to events you favorited")
            
            # Boost events similar to clicked recommendations (weaker signal than favorites)
            if clicked_recommendations:
                max_click_similarity = 0
                for click_id in clicked_recommendations:
                    if click_id in self.event_id_to_index:
                        click_idx = self.event_id_to_index[click_id]
                        event_idx = self.event_id_to_index[event_id]
                        similarity = self.similarity_matrix[click_idx][event_idx]
                        max_click_similarity = max(max_click_similarity, similarity)
                
                score += max_click_similarity * 20  # Lower weight than favorites (20 vs 50)
                if max_click_similarity > 0.4 and max_similarity < 0.3:
                    reasons.append("Similar to events you viewed")
            
            # Faculty match boost
            event_faculty = event.get("faculty")
            if event_faculty and user_faculty and event_faculty == user_faculty:
                score += 15
                reasons.append(f"In your faculty ({event_faculty})")
            
            # Category preference from favorites
            if favorite_events:
                fav_categories = [
                    self.events[self.event_id_to_index[fav_id]].get("category")
                    for fav_id in favorite_events
                    if fav_id in self.event_id_to_index
                ]
                if event.get("category") in fav_categories:
                    score += 10
                    reasons.append(f"You like {event.get('category')} events")
            
            # Popularity boost
            if popularity > 20:
                reasons.append("Trending event")
            
            # Registration deadline urgency
            reg_deadline = event.get("registrationDeadline")
            if reg_deadline:
                if isinstance(reg_deadline, str):
                    reg_deadline = datetime.fromisoformat(reg_deadline.replace('Z', '+00:00'))
                days_until_deadline = (reg_deadline - datetime.now()).days
                if 0 < days_until_deadline <= 3:
                    score += 8
                    reasons.append("Deadline approaching")
            
            # Capacity check
            capacity = event.get("capacity")
            registration_count = self.popularity_scores.get(event_id, 0)
            if capacity and registration_count:
                if registration_count / capacity > 0.7:
                    score += 5
                    reasons.append("Limited spots remaining")
            
            if not reasons:
                reasons.append("Popular in your campus")
            
            event_scores.append({
                "event_id": event_id,
                "score": score,
                "reason": ", ".join(reasons[:2])  # Top 2 reasons
            })
        
        # Sort by score and return top N
        event_scores.sort(key=lambda x: x["score"], reverse=True)
        return event_scores[:limit]
    
    async def get_similar_events(
        self,
        event_id: str,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """Get events similar to the given event"""
        
        if event_id not in self.event_id_to_index:
            return []
        
        event_idx = self.event_id_to_index[event_id]
        similarities = self.similarity_matrix[event_idx]
        
        # Get indices of most similar events (excluding itself)
        similar_indices = np.argsort(similarities)[::-1][1:limit+1]
        
        similar_events = []
        source_event = self.events[event_idx]
        source_category = source_event.get("category", "")
        
        for idx in similar_indices:
            similar_event_id = self.events[idx]["_id"]
            similarity_score = similarities[idx]
            
            # Skip past events
            start_date = self.events[idx].get("startDate")
            if start_date:
                if isinstance(start_date, str):
                    start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if start_date < datetime.now():
                    continue
            
            reason = f"Similar {source_category} event"
            if self.events[idx].get("category") == source_category:
                reason = f"Same category: {source_category}"
            
            similar_events.append({
                "event_id": similar_event_id,
                "score": float(similarity_score),
                "reason": reason
            })
        
        return similar_events[:limit]
    
    async def get_popular_events(
        self,
        limit: int = 10,
        category: Optional[str] = None,
        time_range: str = "week"
    ) -> List[Dict[str, Any]]:
        """Get trending/popular events"""
        
        popular_events = []
        
        for event in self.events:
            event_id = event["_id"]
            
            # Skip past events
            start_date = event.get("startDate")
            if start_date:
                if isinstance(start_date, str):
                    start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if start_date < datetime.now():
                    continue
            
            # Filter by category if specified
            if category and event.get("category") != category:
                continue
            
            popularity = self.popularity_scores.get(event_id, 0)
            
            popular_events.append({
                "event_id": event_id,
                "score": popularity,
                "reason": "Trending on campus"
            })
        
        # Sort by popularity and return top N
        popular_events.sort(key=lambda x: x["score"], reverse=True)
        return popular_events[:limit]
