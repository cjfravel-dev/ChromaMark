# Releasing ChromaMark

ChromaMark has independently versioned npm, PyPI, and VS Code packages. The
language version is separate and changes only under the
[compatibility policy](./compatibility.md).

## Automated publishing

Publishing a GitHub Release triggers `.github/workflows/publish.yml`. It builds
and publishes:

- `@chromamark/renderer` and `@chromamark/cli` to npm.
- `chromamark` to PyPI.

npm and PyPI use OIDC Trusted Publishing through the `npm` and `pypi` GitHub
environments. No registry API token is required. Existing package versions are
skipped, which allows coordinated releases where only some packages changed.

## Release checklist

1. Ensure `main` is clean and CI is green.
2. Update the release version in the root `package.json`, then each changed
   package version:
   - `packages/renderer/package.json`
   - `packages/cli/package.json`
   - `packages/python/pyproject.toml` and `chromamark.__version__`
   - `packages/vscode/package.json`
3. Run `npm install --package-lock-only` to regenerate `package-lock.json`, then
   commit the lockfile version changes.
4. Update `CHANGELOG.md` and package-specific documentation.
5. Run `npm ci`, all tests, ESLint, Ruff, coverage, and package builds.
6. Rebuild and commit `packages/renderer/dist/`.
7. Merge the coordinated release pull request.
8. Create and publish a GitHub Release whose tag matches the repository release,
   then monitor the npm and PyPI jobs.
9. Verify the published package metadata and smoke-test installation.

## VS Code Marketplace

The VS Code Marketplace extension is not published by the GitHub Release
workflow. Build and inspect it separately:

```bash
npm run build --workspace chromamark-vscode
npm test --workspace chromamark-vscode
npm run package --workspace chromamark-vscode
```

Publish the resulting VSIX through the approved Marketplace authentication
process. Verify the Marketplace listing and version badge after publication.
