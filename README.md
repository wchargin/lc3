# lc3: a better LC-3 simulator

This project is an online implementation of the LC-3 microcomputer, in the form of a single-page web application. It's the successor to [`lc3web`](https://github.com/wchargin/lc3web).

The goal of the original `lc3web` project was to make it easier to write and execute LC-3 programs without having to use platform-specific tools that all seemed to be missing a few key features. The end result works pretty well, but it became increasingly complex throughout its development.

The goal of this project is to rewrite a *clean* LC-3 simulator. Specifically:
  * It's written in [React](https://facebook.github.io/react/) and [Redux](https://github.com/rackt/redux), which is awesome for many, many reasons.
    In particular (if you're not familiar with React), the user interface is entirely declarative, and is re-rendered automatically in response to state changes.
    This means that the simulator logic can be entirely decoupled from the UI—the MVC separation that we always strive for but seldom obtain.
  * It's written in ES6 with [Immutable.JS](https://facebook.github.io/immutable-js/), taking advantage of many of the features that those provide.
    For example, the entire application state and almost all the implementation (96%) is immutable.
  * It has unit tests!

All of this means that **it's easier for other people to contribute**! If there's a feature you'd like to see, open an issue and we can discuss it; then, if we determine that it's a good idea, you can implement it, submit a pull request, and get it merged.

**Note** that this project doesn't currently have a live site, because it's not production-ready. Please continue to use the old simulator for now, or, if you really want to, clone this repository, then `npm install` and `npm start`.
