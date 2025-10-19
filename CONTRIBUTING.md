# Contributing to SciOly Teams

Thank you for your interest in contributing to SciOly Teams! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (browser, OS, etc.)

### Suggesting Features

Feature requests are welcome! Please:
- Check if the feature has already been requested
- Provide clear use case and rationale
- Describe expected behavior
- Consider implementation challenges

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/sciolyteams.git
   cd sciolyteams
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the code style (use ESLint)
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   npm run lint
   npm run build
   npm test
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide clear description
   - Reference related issues
   - Include screenshots/videos if UI changes

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting (if configured)
- Write self-documenting code with clear variable names

### Naming Conventions

- **Components**: PascalCase (`TeamCard.tsx`)
- **Files**: kebab-case (`use-toast.ts`)
- **Variables**: camelCase (`userId`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TEAM_SIZE`)

### Component Structure

```typescript
// Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Types/Interfaces
interface MyComponentProps {
  title: string
  onSave: () => void
}

// Component
export function MyComponent({ title, onSave }: MyComponentProps) {
  // State
  const [loading, setLoading] = useState(false)

  // Handlers
  const handleSave = async () => {
    setLoading(true)
    await onSave()
    setLoading(false)
  }

  // Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleSave} disabled={loading}>
        Save
      </Button>
    </div>
  )
}
```

### API Route Structure

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate input
    const body = await req.json()
    const validated = schema.parse(body)

    // 3. Authorize (check permissions)
    // ...

    // 4. Perform operation
    // ...

    // 5. Return response
    return NextResponse.json({ success: true })
  } catch (error) {
    // Handle errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Database Changes

1. **Update Prisma schema** (`prisma/schema.prisma`)
2. **Create migration**:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. **Update seed script** if needed
4. **Update TypeScript types** (Prisma Client auto-generates)

### Testing

- Write unit tests for utilities and hooks
- Write integration tests for API routes
- Write E2E tests for critical user flows
- Aim for meaningful tests, not just coverage

### Security Considerations

- Never trust client-side data
- Always validate and sanitize input
- Use server-side authorization checks
- Don't expose sensitive data in API responses
- Use environment variables for secrets
- Follow OWASP guidelines

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── api/         # API routes
│   └── [pages]/     # Page routes
├── components/       # React components
│   ├── tabs/        # Team page tabs
│   └── ui/          # shadcn/ui components
├── lib/             # Utilities and helpers
└── types/           # TypeScript type definitions
```

## Commit Message Guidelines

Use conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(roster): add conflict detection for events
fix(auth): resolve Google OAuth redirect issue
docs(readme): update setup instructions
refactor(api): simplify team creation logic
```

## Review Process

1. **Automated checks** must pass (linting, build, tests)
2. **Code review** by maintainer(s)
3. **Testing** in preview environment (if applicable)
4. **Documentation** must be updated if needed
5. **Merge** when approved

## Need Help?

- **Documentation**: Check README.md and SETUP.md
- **Questions**: Open a discussion on GitHub
- **Issues**: Search existing issues first
- **Contact**: Reach out to maintainers

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- Project documentation

Thank you for contributing to SciOly Teams! 🎉

