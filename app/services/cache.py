"""Redis cache service for EGE-Bot."""
import os
import json
import logging
from typing import Any, Optional

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)


class RedisCache:
    """Redis cache wrapper - only used in production."""

    def __init__(self):
        self.enabled = False
        self.client = None
        self._init_redis()

    def _init_redis(self):
        """Initialize Redis connection if available and in production."""
        if os.getenv("FLASK_ENV") != "production":
            logger.info("Redis cache disabled (not in production)")
            return

        if not REDIS_AVAILABLE:
            logger.warning("Redis not installed, caching disabled")
            return

        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            self.client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            self.client.ping()
            self.enabled = True
            logger.info(f"Redis cache enabled: {redis_url}")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}")
            self.enabled = False

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.enabled:
            return None

        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.error(f"Redis GET error for {key}: {e}")

        return None

    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set value in cache with TTL."""
        if not self.enabled:
            return False

        try:
            self.client.setex(key, ttl, json.dumps(value))
            return True
        except Exception as e:
            logger.error(f"Redis SET error for {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete value from cache."""
        if not self.enabled:
            return False

        try:
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error for {key}: {e}")
            return False

    def clear_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern."""
        if not self.enabled:
            return 0

        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis CLEAR error for pattern {pattern}: {e}")
            return 0


# Global cache instance
cache = RedisCache()
