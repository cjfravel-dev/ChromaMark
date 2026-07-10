# Releasing ChromaMark

ChromaMark has independently versioned npm, PyPI, and VS Code packages. The
language version is separate and changes only under the
[compatibility policy](./compatibility.md).

## Automated publishing

Publishing a GitHub Release triggers `.github/workflows/publish.yml`. It builds
and publishes:

- `@chromamark/conformance`, `@chromamark/renderer`, and `@chromamark/cli` to npm.
- `chromamark` to PyPI.

npm and PyPI use OIDC Trusted Publishing through the `npm` and `pypi` GitHub
environments. No registry API token is required. Existing package versions are
skipped, which allows coordinated releases where only some packages changed.
The workflow can also be dispatched manually to retry npm publishing; PyPI runs
only for release events.

## Release checklist

1. Ensure `main` is clean and CI is green.
2. Update the release version in the root `package.json`, then each changed
   package version:
   - `packages/conformance/package.json`
   - `packages/renderer/package.json`
   - `packages/cli/package.json`
   - `packages/python/pyproject.toml` and `chromamark.__version__`
   - `packages/vscode/package.json`
3. Run `npm install --package-lock-only` to regenerate `package-lock.json`, then
   commit the lockfile version changes.
4. Update `CHANGELOG.md` and package-specific documentation.
5. Run `npm ci`, all tests, ESLint, Ruff, coverage, and package builds.
6. Rebuild and commit `packages/renderer/dist/` and generated `README.md`.
7. Merge the coordinated release pull request.
8. Create and publish a GitHub Release whose tag matches the repository release,
   then monitor the npm and PyPI jobs.
9. Verify the published package metadata and smoke-test installation.

## VS Code Marketplace

The `VS Code Marketplace` workflow publishes without a PAT. GitHub OIDC
federates the protected `vscode-marketplace` environment to a user-assigned
Azure managed identity, and `vsce --azure-credential` obtains an Entra token at
runtime. The same tested VSIX is also published to Open VSX with the
environment-scoped, revocable `OVSX_PAT` token; Open VSX does not currently
support OIDC trusted publishing.

Publishing a GitHub Release runs this job after rebuilding, testing, and
packaging the extension. It can also be dispatched manually with:

- `identity` — write the managed identity's Azure DevOps profile ID to the job
  summary for one-time Marketplace publisher authorization.
- `publish` — publish the current package version, skipping duplicates.

For local package inspection:

```bash
npm run build --workspace chromamark-vscode
npm test --workspace chromamark-vscode
npm run package --workspace chromamark-vscode
```

The Marketplace publisher `chromamark` must list the managed identity profile
ID as a Contributor. Open VSX must grant ownership of the `chromamark`
namespace. GitHub environment variables hold only the non-secret Azure client,
tenant, and subscription IDs; the Open VSX token is stored only in the protected
environment.
