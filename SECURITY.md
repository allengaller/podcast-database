# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of LeetCast seriously. If you have discovered a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: leetcast-security@users.noreply.github.com

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Our Commitment

- We will acknowledge your email within 48 hours
- We will send a more detailed response within 96 hours indicating the next steps
- We will keep you informed of the progress towards a fix and full announcement
- We may ask for additional information or guidance

### Disclosure Policy

- We ask that you give us a reasonable amount of time to fix the issue before publishing it
- We will credit you for the discovery (unless you prefer to remain anonymous)

## Security Best Practices

When using LeetCast:

1. **Never commit API keys** - Always use environment variables
2. **Use `.env` files locally** - Never commit `.env` files to version control
3. **Rotate keys regularly** - Change your API keys periodically
4. **Limit API key permissions** - Only grant necessary permissions to your API keys
5. **Monitor usage** - Keep an eye on your API usage for any suspicious activity

## Known Security Considerations

### API Keys

This project requires API keys for:
- OpenAI API
- ElevenLabs API

These keys should be:
- Stored in environment variables
- Never committed to version control
- Rotated regularly
- Kept confidential

### External Services

LeetCast interacts with:
- LeetCode GraphQL API
- OpenAI API
- ElevenLabs API

All communications are over HTTPS. Please review the privacy policies of these services.
