# Calculator Feature for Tests

This feature allows test creators to provide calculators to test takers during exams.

## Overview

Test creators can now choose to enable calculators for their tests, with three different types available:
- **Four Function Calculator**: Basic arithmetic operations (+, -, ×, ÷)
- **Scientific Calculator**: Includes trigonometric functions, logarithms, exponents, and more
- **Graphing Calculator**: All scientific calculator features plus graphing capabilities

## Features

### Calculator Types

#### 1. Four Function Calculator
- Basic arithmetic operations
- Decimal support
- Sign toggle (+/-)
- Clear functions

#### 2. Scientific Calculator
- All four-function operations
- Trigonometric functions (sin, cos, tan)
- Logarithms (log, ln)
- Exponents and roots (x², xʸ, √)
- Constants (π, e)
- Factorial (n!)
- Absolute value
- Memory functions (M+, MR)
- Angle mode switching (DEG/RAD)

#### 3. Graphing Calculator
- All scientific calculator features
- Expression input for graphing
- Visual coordinate system
- Grid display

### User Interface

- **Floating Dialog**: Calculator appears as a dialog that can be minimized
- **Minimize Feature**: When minimized, calculator becomes a floating button in the bottom-right corner
- **Persistent State**: Calculator maintains its state (display, memory) while open during a test

## Usage

### For Test Creators

1. When creating or editing a test, scroll to the "Calculator" section
2. Check "Allow calculator" to enable calculator access
3. Select the calculator type from the dropdown:
   - Four Function (Basic)
   - Scientific Calculator
   - Graphing Calculator
4. Save your test

### For Test Takers

1. If a calculator is enabled for a test, a "Calculator" button will appear in the test header
2. Click the button to open the calculator
3. Use the calculator as needed during the test
4. Click the minimize button (⊟) to minimize it to a floating button
5. Click the floating button to restore the calculator

## Database Schema

### Migration

To apply the calculator feature, run the migration:

```bash
# Option 1: Run the SQL migration directly
psql $DATABASE_URL -f prisma/migrations/add_calculator_support.sql

# Option 2: Generate and apply Prisma migration
npx prisma migrate dev --name add_calculator_support

# Option 3: For production
npx prisma migrate deploy
```

### Schema Changes

The following fields were added to the `Test` model:
- `allowCalculator` (Boolean): Whether calculator is enabled
- `calculatorType` (CalculatorType enum): Type of calculator (FOUR_FUNCTION, SCIENTIFIC, GRAPHING)

## API Changes

### POST /api/tests

New fields in request body:
```json
{
  "allowCalculator": true,
  "calculatorType": "SCIENTIFIC"
}
```

### PATCH /api/tests/[testId]

New fields in request body:
```json
{
  "allowCalculator": true,
  "calculatorType": "GRAPHING"
}
```

### GET /api/tests/[testId]

Response includes:
```json
{
  "test": {
    "allowCalculator": true,
    "calculatorType": "SCIENTIFIC",
    ...
  }
}
```

## Component Structure

### Calculator Component (`src/components/tests/calculator.tsx`)

Main calculator component with three modes:
- Props: `type`, `open`, `onOpenChange`
- Features: Basic/Scientific/Graphing modes, minimize functionality

### CalculatorButton Component

Convenience component that wraps the calculator with a trigger button:
- Props: `calculatorType`, `className` (optional)
- Usage: Place in test-taking interface

## Example Usage

```tsx
import { CalculatorButton } from '@/components/tests/calculator'

// In your test-taking component
{test.allowCalculator && test.calculatorType && (
  <CalculatorButton calculatorType={test.calculatorType} />
)}
```

## Implementation Notes

### Security Considerations

- Calculators are client-side only and don't send data to the server
- Calculator availability is controlled server-side via test settings
- Calculator state is not persisted between page reloads

### Browser Compatibility

- Works in all modern browsers
- Requires JavaScript enabled
- Fullscreen mode compatible

### Future Enhancements

Potential improvements for future versions:
- Save/load calculator programs
- More advanced graphing with function plotting
- Statistical functions
- Matrix operations
- Unit conversion
- Custom formula storage

## Testing

To test the calculator feature:

1. Create a new test and enable calculator
2. Publish the test
3. Take the test as a student
4. Verify calculator appears and functions correctly
5. Test minimize/maximize functionality
6. Verify calculator persists state during test
7. Test all calculator types

## Troubleshooting

### Calculator button doesn't appear
- Check that `allowCalculator` is true in test settings
- Verify `calculatorType` is set
- Ensure test is properly saved with calculator settings

### Calculator doesn't open
- Check browser console for errors
- Verify dialog component is rendering
- Check z-index conflicts with other UI elements

### Calculator state resets
- This is expected behavior on page reload
- Calculator state is intentionally not persisted across page loads

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify database migration was applied successfully
3. Review API request/response in network tab
4. Check that Prisma client was regenerated after schema changes

