# Calculator Feature - Quick Setup Guide

## 📋 What Was Added

A complete calculator system for tests with three types:
- **Four Function**: Basic arithmetic
- **Scientific**: Advanced math functions, trig, logs
- **Graphing**: Scientific + graphing capabilities

## 🚀 Quick Start

### 1. Update Database Schema

Run the Prisma migration:

```bash
# Generate Prisma client with new schema
npx prisma generate

# Apply the migration
npx prisma migrate dev --name add_calculator_support
```

**OR** run the SQL migration directly:

```bash
psql $DATABASE_URL -f prisma/migrations/add_calculator_support.sql
```

### 2. Verify Installation

After running the migration, verify the changes:

```bash
# Check that the Test model has new fields
npx prisma studio
# Look for: allowCalculator, calculatorType in Test model
```

### 3. Test the Feature

#### As a Test Creator:
1. Go to your team page
2. Click "Tests" tab
3. Click "Create Test"
4. Scroll to "Calculator" section
5. Check "Allow calculator"
6. Select calculator type
7. Create questions and publish test

#### As a Test Taker:
1. Navigate to an assigned test with calculator enabled
2. Start the test
3. Look for "Calculator" button in the header
4. Click to open calculator
5. Use the calculator during the test
6. Click minimize button to collapse to floating icon

## 📁 Files Modified/Created

### Created:
- `src/components/tests/calculator.tsx` - Calculator component
- `prisma/migrations/add_calculator_support.sql` - Database migration
- `CALCULATOR_FEATURE.md` - Full documentation
- `CALCULATOR_SETUP.md` - This file

### Modified:
- `prisma/schema.prisma` - Added calculator fields to Test model
- `src/components/tests/new-test-builder.tsx` - Added calculator UI
- `src/components/tests/take-test-client.tsx` - Added calculator button
- `src/app/api/tests/route.ts` - Added calculator to API schema
- `src/app/api/tests/[testId]/route.ts` - Added calculator to update API

## 🔍 Features

### Calculator Operations

**Four Function:**
- +, -, ×, ÷
- Decimal support
- Sign toggle
- Clear/All Clear

**Scientific (includes all Four Function +):**
- sin, cos, tan (DEG/RAD modes)
- log, ln
- x², xʸ, √
- π, e
- Factorial (n!)
- Absolute value
- Memory (M+, MR)

**Graphing (includes all Scientific +):**
- Expression input
- Coordinate grid
- Visual graph display

### UI Features
- Floating dialog interface
- Minimize to bottom-right corner
- Persistent state during test
- Clean, modern design
- Responsive layout

## ⚙️ Configuration

### Test Creation Settings

```typescript
{
  allowCalculator: boolean      // Enable/disable calculator
  calculatorType: 'FOUR_FUNCTION' | 'SCIENTIFIC' | 'GRAPHING' | null
}
```

### API Example

```typescript
// Creating a test with calculator
POST /api/tests
{
  "name": "Physics Quiz",
  "allowCalculator": true,
  "calculatorType": "SCIENTIFIC",
  // ... other fields
}
```

## 🐛 Troubleshooting

### Migration Fails

**Error:** `type "CalculatorType" already exists`
```bash
# Drop and recreate
psql $DATABASE_URL -c "DROP TYPE IF EXISTS \"CalculatorType\" CASCADE;"
psql $DATABASE_URL -f prisma/migrations/add_calculator_support.sql
```

### Prisma Client Issues

**Error:** Calculator types not recognized
```bash
# Regenerate Prisma client
npx prisma generate
# Restart your dev server
```

### TypeScript Errors

```bash
# Clear TypeScript cache and rebuild
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

## 📝 Usage Examples

### Enable Calculator for a Test

```typescript
// In test creation form
setDetails({
  ...details,
  allowCalculator: true,
  calculatorType: 'SCIENTIFIC'
})
```

### Show Calculator Button

```tsx
// In test-taking interface
import { CalculatorButton } from '@/components/tests/calculator'

{test.allowCalculator && test.calculatorType && (
  <CalculatorButton calculatorType={test.calculatorType} />
)}
```

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Generate Prisma client
3. ✅ Restart dev server
4. ✅ Test creating a test with calculator
5. ✅ Test taking a test with calculator
6. ✅ Verify all three calculator types work

## 💡 Tips

- Start with FOUR_FUNCTION for basic tests
- Use SCIENTIFIC for math/physics tests
- Use GRAPHING for advanced calculus tests
- Calculator state resets on page reload (by design)
- Minimized calculator persists as floating button
- Calculator works in fullscreen test mode

## 📚 Additional Resources

- Full documentation: `CALCULATOR_FEATURE.md`
- Prisma schema: `prisma/schema.prisma`
- Calculator component: `src/components/tests/calculator.tsx`

## ✅ Checklist

Before using in production:

- [ ] Database migration applied
- [ ] Prisma client regenerated
- [ ] Test creation works with calculator option
- [ ] Calculator appears during test taking
- [ ] All three calculator types tested
- [ ] Minimize/maximize functionality works
- [ ] Calculator persists state during test
- [ ] No console errors
- [ ] Works in fullscreen mode
- [ ] Works on mobile devices

---

**Ready to use!** 🎉

If you encounter any issues, check `CALCULATOR_FEATURE.md` for detailed troubleshooting.

