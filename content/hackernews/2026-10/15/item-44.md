---
publish: true
content_type: "post"
title: "C++26 Contracts: Introduction to Preconditions and Postconditions"
description: "The dominant criticism is that C++26 contracts, as described, buy little over assert. One commenter says they would welcome a contract that turns a runtime error into a compile-time error, but this looks like it produces more runtime err..."
date: "2026-10-15T13:11:26.000Z"
updated: "2026-10-15T15:09:57.501Z"
first_seen: "2026-10-15T15:00:10.166Z"
date_basis: "published"
source_url: "https://www.cppstories.com/2026/cpp26_contracts/"
discussion_url: "https://news.ycombinator.com/item?id=50103164"
tags: ["source/hackernews","topics/coding"]
---

## HN discussion

Based on 10 selected comments and replies.

The dominant criticism is that C++26 contracts, as described, buy little over assert. One commenter says they would welcome a contract that turns a runtime error into a compile-time error, but this looks like it produces more runtime errors instead, and notes the article's own point that contract assertions must not be used for error handling or input validation.

A reply defends the design: preconditions and postconditions are a standard mechanism, and Clojure does the same. Forcing these checks into compile-time verification, the argument goes, would amount to adding refinement types and a second type system with slow type checking — the example given is a precondition requiring collatz&#40;x&#41; == 1, which no compiler should be expected to prove.

An open question raised is whether contracts feed optimizer passes, similar to the unreachable builtin idiom. One commenter recalls, with explicit uncertainty, that pre- and postconditions are propagated to GCC and LLVM optimization passes depending on the selected evaluation semantics, but says they have not seen detailed writeups on how effective or reliable this is.

Commenters also connect the feature to Eiffel's design-by-contract and to arguments that contracts matter for LLM-generated code, and one voices fatigue with the size and complexity of C++, preferring languages that are pleasant to write by hand.

Selected comments: [cogman10](https://news.ycombinator.com/item?id=50104290) · [kccqzy](https://news.ycombinator.com/item?id=50104759) · [tsukikage](https://news.ycombinator.com/item?id=50104624) · [throwaway17&#95;17](https://news.ycombinator.com/item?id=50104721) · [ZuLuuuuuu](https://news.ycombinator.com/item?id=50103875) · [randyrand](https://news.ycombinator.com/item?id=50103835)

[Read the full HN discussion](<https://news.ycombinator.com/item?id=50103164>)
