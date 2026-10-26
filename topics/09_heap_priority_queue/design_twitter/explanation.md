# Design Twitter

**Topic:** Heap / Priority Queue · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/design-twitter/) · [NeetCode](https://neetcode.io/problems/design-twitter-feed)

## Problem

Design a simplified version of Twitter where users can:

- `postTweet(userId, tweetId)` — compose a new tweet.
- `getNewsFeed(userId) -> List[int]` — return the **10 most recent** tweet ids
  in the user's feed (their own tweets plus those of everyone they follow),
  ordered from most recent to least recent.
- `follow(followerId, followeeId)` — start following.
- `unfollow(followerId, followeeId)` — stop following.

## Examples

| operations | returns |
| --- | --- |
| `postTweet(1, 5)`, `getNewsFeed(1)` | `[5]` |
| `follow(1, 2)`, `postTweet(2, 6)`, `getNewsFeed(1)` | `[6, 5]` |
| `unfollow(1, 2)`, `getNewsFeed(1)` | `[5]` |

`null` marks the constructor and every void method.

## Intuition

Two ideas combine:

1. **Recency** is captured by a single **global counter** stamped onto every
   tweet as it is posted. Larger stamp = newer.
2. The feed is the merge of several already-sorted streams (each author's
   tweets, oldest→newest). A **max-heap keyed on the timestamp** performs this
   k-way merge, and because we only ever need 10 tweets we can stop early
   instead of merging everything.

## Approach

1. `postTweet`: increment the clock and append `(time, tweetId)` to that
   user's list (kept in posting order).
2. `getNewsFeed`: collect the author ids — the user plus everyone they follow.
   Seed the heap with each author's **newest** tweet. Repeatedly pop the newest
   entry, append its id to the feed, and push that author's **previous** tweet.
   Stop after 10 tweets or when the heap is empty.
3. `follow` / `unfollow`: add or discard from the follower's set.

## Walkthrough

`postTweet(1, 5)` → tweets[1] = `[(1, 5)]`.
`follow(1, 2)`, `postTweet(2, 6)` → tweets[2] = `[(2, 6)]`.

`getNewsFeed(1)` considers authors `{1, 2}`:

| pop | tweet | push next |
| --- | --- | --- |
| `(2, 6)` | `6` | tweets[2][-1] done |
| `(1, 5)` | `5` | tweets[1][-1] done |

Feed: `[6, 5]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Global clock + k-way heap merge | `O(f + 10 log f)` per feed | `O(t + f)` |
| Re-sort all followed tweets | `O(m log m)` per feed | `O(m)` |

- **Time** — seeding the heap is `O(f)` for `f` followees; each of the 10
  pops/pushes is `O(log f)`.
- **Space** — all tweets `t` plus all follow edges `f` are stored.

## Edge cases

- **Empty feed** — a user with no tweets and no followees gets `[]`.
- **Follow is one-directional** — A following B does not put A's tweets in B's
  feed.
- **Unfollow** — removes the followee's tweets immediately.
- **Own tweets always visible** — the user is always included in `users`, even
  after `unfollow(self)`.
- **Re-follow / unfollow a stranger** — set semantics make both safe no-ops.
- **Feed cap** — with more than 10 candidates only the 10 newest are returned.

## Solution (`solution.py`)

```python
import heapq
from collections import defaultdict
from typing import Dict, List, Set, Tuple


class Twitter:
    def __init__(self) -> None:
        self._time = 0
        self._tweets: Dict[int, List[Tuple[int, int]]] = defaultdict(list)
        self._following: Dict[int, Set[int]] = defaultdict(set)

    def postTweet(self, userId: int, tweetId: int) -> None:
        self._time += 1
        self._tweets[userId].append((self._time, tweetId))

    def getNewsFeed(self, userId: int) -> List[int]:
        users = self._following[userId] | {userId}
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
            if index > 0:
                timestamp, prev_id = self._tweets[author][index - 1]
                heapq.heappush(heap, (-timestamp, prev_id, author, index - 1))
        return feed

    def follow(self, followerId: int, followeeId: int) -> None:
        self._following[followerId].add(followeeId)

    def unfollow(self, followerId: int, followeeId: int) -> None:
        self._following[followerId].discard(followeeId)
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py design_twitter

# same tests through pytest
pytest topics/09_heap_priority_queue/design_twitter -v
```
