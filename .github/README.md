# GitHub Configuration

This directory contains all GitHub-specific configuration files for the GCMC-KAJ project.

## 📋 Contents

### Workflows (`.github/workflows/`)

| Workflow | File | Purpose | Triggers |
|----------|------|---------|----------|
| **CI** | `ci.yml` | Continuous Integration | Push, PR |
| **Deploy** | `deploy.yml` | Production Deployment | Push to main, Tags |
| **PR Checks** | `pr-checks.yml` | Pull Request Validation | PR events |
| **Database Migration** | `migrate.yml` | Database Migrations | Manual only |

### Configuration Files

| File | Purpose |
|------|---------|
| `dependabot.yml` | Automated dependency updates |
| `CODEOWNERS` | Code ownership and review assignments |
| `PULL_REQUEST_TEMPLATE.md` | Standard PR template |
| `SECRETS.md` | Required GitHub secrets documentation |
| `CICD_SETUP_GUIDE.md` | Complete CI/CD setup instructions |

## 🚀 Quick Start

### For First-Time Setup

1. Read [CICD_SETUP_GUIDE.md](./CICD_SETUP_GUIDE.md) for detailed instructions
2. Configure required secrets from [SECRETS.md](./SECRETS.md)
3. Enable GitHub Actions in repository settings
4. Push code to trigger workflows

### For Daily Development

1. Create feature branch
2. Make changes and commit
3. Push branch and create PR
4. Wait for CI checks to pass
5. Request review from code owners
6. Merge after approval

## 📊 Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Developer Workflow                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              ┌─────▼─────┐             ┌──────▼──────┐
              │   Push    │             │  Pull Req   │
              │  to main  │             │   Created   │
              └─────┬─────┘             └──────┬──────┘
                    │                          │
         ┌──────────┴──────────┐      ┌────────┴────────┐
         │                     │      │                 │
    ┌────▼────┐          ┌────▼────┐ │   ┌──────────┐  │
    │   CI    │          │ Deploy  │ │   │ PR Check │  │
    │ Workflow│          │Workflow │ │   └────┬─────┘  │
    └────┬────┘          └────┬────┘ │        │        │
         │                    │      │   ┌────▼─────┐  │
    ┌────▼────┐          ┌────▼────┐ │   │ CI Check │  │
    │ Lint    │          │ Wait CI │ │   └──────────┘  │
    │ Type    │          └────┬────┘ │                 │
    │ Test    │               │      └─────────────────┘
    │ Build   │          ┌────▼────┐
    └─────────┘          │  Build  │
                         │ Docker  │
                         └────┬────┘
                              │
                         ┌────▼────┐
                         │  Push   │
                         │  GHCR   │
                         └────┬────┘
                              │
                         ┌────▼────┐
                         │ Deploy  │
                         │Railway  │
                         └─────────┘
```

## 🔒 Security

### Secret Management

- All secrets are stored in GitHub Secrets
- Never commit secrets to repository
- Use environment-specific secrets
- Rotate secrets regularly (see SECRETS.md)

### Branch Protection

Recommended branch protection rules for `main`:

- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require conversation resolution
- ✅ Require linear history
- ✅ Include administrators

### Code Scanning

- Dependabot alerts enabled
- Security audit in CI
- Dependency review on PRs

## 📈 Monitoring

### Build Status

Add status badges to your README:

```markdown
![CI](https://github.com/kareemschultz/kaj-gcmc-bts/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/kareemschultz/kaj-gcmc-bts/actions/workflows/deploy.yml/badge.svg)
```

### Workflow Runs

Monitor workflow runs:
- GitHub Actions tab
- Email notifications
- Slack/Discord webhooks (optional)

## 🛠️ Maintenance

### Weekly
- Review Dependabot PRs
- Check failed builds
- Review security alerts

### Monthly
- Update dependencies
- Review workflow performance
- Update documentation

### Quarterly
- Rotate production secrets
- Review access controls
- Update workflows

## 📚 Documentation

- **[CICD_SETUP_GUIDE.md](./CICD_SETUP_GUIDE.md)** - Complete setup guide
- **[SECRETS.md](./SECRETS.md)** - Secrets configuration
- **[CODEOWNERS](./CODEOWNERS)** - Code ownership
- **[PULL_REQUEST_TEMPLATE.md](./PULL_REQUEST_TEMPLATE.md)** - PR template

## 🤝 Contributing

When modifying workflows:

1. Test changes in a feature branch first
2. Use workflow_dispatch for testing
3. Document changes in this README
4. Update CICD_SETUP_GUIDE.md if needed
5. Create PR for review

## 💡 Tips

### Testing Workflows Locally

Use [act](https://github.com/nektos/act) to test workflows locally:

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflows locally
act push          # Test push event
act pull_request  # Test PR event
```

### Debugging Workflows

Enable debug logging:

1. Settings > Secrets > Actions
2. Add secret: `ACTIONS_STEP_DEBUG` = `true`
3. Add secret: `ACTIONS_RUNNER_DEBUG` = `true`

### Skipping CI

Add to commit message to skip CI (use sparingly):

```bash
git commit -m "docs: Update README [skip ci]"
```

## 🐛 Troubleshooting

Common issues and solutions:

### Workflow Not Triggering
- Check workflow syntax
- Verify branch protection rules
- Check Actions permissions

### Build Failing
- Review workflow logs
- Check for missing secrets
- Verify dependencies are up to date

### Deployment Failing
- Verify all secrets are set
- Check deployment platform status
- Review deployment logs

For more help, see [CICD_SETUP_GUIDE.md](./CICD_SETUP_GUIDE.md#troubleshooting)

## 📞 Support

For questions or issues:

1. Check documentation in this directory
2. Review GitHub Actions logs
3. Open an issue in the repository
4. Contact @kareemschultz

---

**Last Updated:** 2025-11-15
**Maintained by:** @kareemschultz
