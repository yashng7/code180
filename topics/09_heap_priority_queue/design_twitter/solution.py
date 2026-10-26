"""Design Twitter — Heap / Priority Queue.

Design a simplified social network with ``postTweet``, ``getNewsFeed``,
``follow`` and ``unfollow``.

Idea: stamp every tweet with a global increasing counter, keep each user's
tweets in order, and build the news feed by k-way merging the most recent
tweets of the user and their followees with a max-heap on the timestamp.
The feed only ever needs the 10 most recent tweets, so the heap stops early.

Time  O(f + 10 log f) per ``getNewsFeed`` (f = followees), O(1) otherwise.
Space O(tweets + follows).
"""
import heapq
from collections import defaultdict
from typing import Dict, List, Set, Tuple


class Twitter:
    """A minimal Twitter: post, follow, unfollow, and view a 10-tweet feed."""

    def __init__(self) -> None:
        self._time = 0                                   # global recency clock
        self._tweets: Dict[int, List[Tuple[int, int]]] = defaultdict(list)
        self._following: Dict[int, Set[int]] = defaultdict(set)

    def postTweet(self, userId: int, tweetId: int) -> None:
        self._time += 1
        self._tweets[userId].append((self._time, tweetId))

    def getNewsFeed(self, userId: int) -> List[int]:
        users = self._following[userId] | {userId}
        # Heap entries: (-time, tweetId, authorId, index_into_author's list)
        heap: List[Tuple[int, int, int, int]] = []
        for author in users:
            tweets = self._tweets[author]
            if tweets:
                timestamp, tweet_id = tweets[-1]
                heap.append((-timestamp, tweet_id, author, len(tweets) - 1))
        heapq.heapify(heap)

        feed: List[int] = []
        while heap and len(feed) < 10:
            _, tweet_id, author, index = heapq.heappop(heap)
            feed.append(tweet_id)
            if index > 0:                                # push the next-newest
                timestamp, prev_id = self._tweets[author][index - 1]
                heapq.heappush(heap, (-timestamp, prev_id, author, index - 1))
        return feed

    def follow(self, followerId: int, followeeId: int) -> None:
        self._following[followerId].add(followeeId)

    def unfollow(self, followerId: int, followeeId: int) -> None:
        self._following[followerId].discard(followeeId)


if __name__ == "__main__":
    twitter = Twitter()
    twitter.postTweet(1, 5)
    print(twitter.getNewsFeed(1))   # [5]
    twitter.follow(1, 2)
    twitter.postTweet(2, 6)
    print(twitter.getNewsFeed(1))   # [6, 5]
    twitter.unfollow(1, 2)
    print(twitter.getNewsFeed(1))   # [5]
