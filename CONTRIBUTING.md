# Contributing!

**TL;DR:** anyone can contribute; write tests, run tests; document, document, document.

## The contribution lifecycle

So you have an idea. Wonderful! First, open an issue so that we can discuss your plan. It'd be a shame to do a bunch of work on an idea that I'm not going to merge anyway.

At this point, if you don't have much development experience—in general, or with JavaScript, or with ES6, or with React, or whatever—I'm happy to help you get started.

Once you've got the green light, fork the repository, make your changes, write your tests, and open a pull request. Then, I'll review your code and merge it!
Be sure to read the [commit etiquette](#commit-etiquette) before sending your pull request.

If accepted, your changes will be released under [the license for this project](LICENSE).

## The process

### Getting set up

First, install Node.js and NPM.

Then, clone the repository.
If you have [`hub`](https://hub.github.com/), just write
```
$ hub clone wchargin/lc3
```
or otherwise write
```
$ git clone git@github.com:WChargin/lc3.git
```

Finally,
```
$ cd lc3
$ npm install
$ npm test
$ npm start
```
where `npm test` runs all the unit tests and `npm start` starts a development server at <http://localhost:8080/webpack-dev-server/>.

If you get any errors in the `npm install` step, shoot me an email with the exact error text, your `npm --version`, and your `node --version`, and I'll look into it.

### Editing

Once you've cloned the repository, you can edit the source files to make your changes.

  * If you edit a React component while the development server is running,
    it will be hot loaded into the page,
    so you'll see your changes without even having to refresh.

  * If you edit a non-React JavaScript file,
    you'll see a message in your browser's JavaScript console
    indicating that that file cannot be hot loaded
    and that you need to refresh to see your changes.
    Do so.

  * If you edit a test file, just re-run `npm test`.

  * If you edit a non-JavaScript file
    (like the `index.html` page, or `package.json` or `webpack.config.js`),
    you'll probably need to restart the development server
    for your changes to take effect.
    Just hit `^C` on the server and `npm start` it again.

### Testing

**If you change the core, you must write tests.**

Happily, this is **very easy** to do. If you're modifying an existing source file, locate its corresponding test file and work off that. If you're creating a new source file, find a similar source file and use its test file as a model. If you're having trouble, try your best and I'll help you refine the tests once you've sent a pull request.

`// TODO`: we don't yet have React component testing set up. Because of this, **if you change a React component, your commit message must include a Test Plan.**
Test plans are always helpful, but they become mandatory in the absence of automated testing.

## Code standards

### Style

  * Four spaces. No tabs.
  * Lines should be shorter than 80 characters.
  * Take advantage of ES6 features.
    (If you're not familiar with these, we can tackle them in your pull request.)
  * Use semicolons.
  * Use trailing commas for multi-line objects and arrays.

### Commit etiquette

Please read this before sending your pull request.

Each commit should represent a single semantic change. If you refactor something and then use that refactoring, those should be two commits.

Here's a sample commit message:
```
Add widgets to the status pane of the UI

People have been asking for widgets for a long time,
but we haven't had the time to add them.
We do now!

The implementation in `Widget.jsx` is a bit clunky
and could do with some refactoring later.

Test Plan:
Run the tests for the core changes.
Then open the dev server and click the widgets.
Make sure that they light up in order
and that you get an error if you click them in reverse.
```

Some notes:

  * The first line of a commit message should be at most 50 characters,
    should have its first letter capitalized,
    and should be imperative
    ("Add widgets to the UI", not "adds widgets to the UI").
    If this is exceedingly difficult,
    ask yourself whether your commit does too many things!
    If it doesn't (maybe there's just a really long identifier),
    move non-key information into the body of the commit.

  * The body of the commit message should have lines at most 72 characters.
    You should describe anything that you think would be
    useful for future readers.
    This often includes a short description of the feature or bug fix
    and some implementation notes or comments.
    It might also refer to some open issues or pull requests.

  * The commit message must include a `Test Plan:` section.
    The information in the test plan should be sufficient
    to verify that your change worked and didn't break anything else.
    In many cases, it may be helpful
    to include a sample assembly program and the expected output.
