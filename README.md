# Almanac

### Dependencies

- Node + NPM
- Ruby + Sass

### Setup

Install development dependencies for the Gruntfile:

```bash
npm install
```

Start working:

```bash
grunt work
```

### Testing

To run the tests, simply do:

```bash
grunt test
```

### Distribution

```bash
grunt release
```

- Bumps the version to the final, e.g. `1.0.0-beta` to `1.0.0`
- Tags a release
- Freshly compiles and optimizes code
- Creates zip and tarball binaries
- Prints instructions to push and upload it to GitHub
- Bumps the patch version, e.g. `1.0.0` to `1.0.1-beta`
