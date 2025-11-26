'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, Minimize2, Calculator as CalcIcon } from 'lucide-react'

type CalculatorType = 'FOUR_FUNCTION' | 'SCIENTIFIC' | 'GRAPHING'

interface CalculatorProps {
  type: CalculatorType
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Desmos API Key
const DESMOS_API_KEY = '9137aaf02b21418d829ad8c574d2a358'

// TypeScript declaration for Desmos
declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (element: HTMLElement, options?: any) => {
        destroy: () => void
        [key: string]: any
      }
    }
  }
}

export function Calculator({ type, open, onOpenChange }: CalculatorProps) {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [newNumber, setNewNumber] = useState(true)
  const [memory, setMemory] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG')
  const desmosCalculatorRef = useRef<any>(null)
  const desmosContainerRef = useRef<HTMLDivElement>(null)
  const [desmosLoaded, setDesmosLoaded] = useState(false)
  const savedDesmosStateRef = useRef<any>(null)

  // Load Desmos API script for graphing calculator (only once)
  useEffect(() => {
    if (type === 'GRAPHING') {
      // Check if Desmos is already loaded
      if (window.Desmos) {
        setDesmosLoaded(true)
        return
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector(`script[src*="desmos.com/api"]`)
      if (existingScript) {
        // Script exists, wait for it to load
        const checkDesmos = setInterval(() => {
          if (window.Desmos) {
            setDesmosLoaded(true)
            clearInterval(checkDesmos)
          }
        }, 100)
        return () => clearInterval(checkDesmos)
      }

      // Load the script
      const script = document.createElement('script')
      script.src = `https://www.desmos.com/api/v1.8/calculator.js?apiKey=${DESMOS_API_KEY}`
      script.async = true
      script.onload = () => {
        setDesmosLoaded(true)
      }
      script.onerror = () => {
        console.error('Failed to load Desmos API')
      }
      document.body.appendChild(script)
    } else if (type !== 'GRAPHING') {
      // Cleanup when switching away from graphing calculator type
      if (desmosCalculatorRef.current) {
        try {
          desmosCalculatorRef.current.destroy()
        } catch (error) {
          console.error('Error destroying Desmos calculator:', error)
        }
        desmosCalculatorRef.current = null
      }
    }
  }, [type])

  // Save Desmos state before closing or minimizing
  useEffect(() => {
    if (type === 'GRAPHING' && desmosCalculatorRef.current) {
      if (!open || isMinimized) {
        // Save state before closing or minimizing
        try {
          const state = desmosCalculatorRef.current.getState()
          savedDesmosStateRef.current = state
        } catch (error) {
          console.error('Error saving Desmos state:', error)
        }
      }
    }
  }, [type, open, isMinimized])

  // Initialize Desmos calculator when container is ready
  useEffect(() => {
    if (type === 'GRAPHING' && open && !isMinimized && desmosLoaded) {
      // Wait for container to be available
      const checkContainer = setInterval(() => {
        if (desmosContainerRef.current && window.Desmos) {
          // Destroy existing calculator if it exists (for reinitialization)
          if (desmosCalculatorRef.current) {
            try {
              // Save state before destroying
              const state = desmosCalculatorRef.current.getState()
              savedDesmosStateRef.current = state
              desmosCalculatorRef.current.destroy()
            } catch (error) {
              console.error('Error destroying existing Desmos calculator:', error)
            }
            desmosCalculatorRef.current = null
          }

          // Clear container before reinitializing
          if (desmosContainerRef.current) {
            desmosContainerRef.current.innerHTML = ''
          }

          // Initialize after clearing - use requestAnimationFrame for better timing
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (desmosContainerRef.current && window.Desmos && !desmosCalculatorRef.current) {
                try {
                  desmosCalculatorRef.current = window.Desmos.GraphingCalculator(desmosContainerRef.current, {
                    keypad: true,
                    expressions: true,
                    settingsMenu: true,
                    zoomButtons: true,
                    expressionsTopbar: true,
                    lockViewport: false,
                  })
                  
                  // Restore saved state if available
                  if (savedDesmosStateRef.current) {
                    try {
                      desmosCalculatorRef.current.setState(savedDesmosStateRef.current)
                    } catch (error) {
                      console.error('Error restoring Desmos state:', error)
                    }
                  }
                } catch (error) {
                  console.error('Failed to initialize Desmos calculator:', error)
                }
              }
            }, 100)
          })
          
          clearInterval(checkContainer)
        }
      }, 50)

      return () => {
        clearInterval(checkContainer)
      }
    } else if (!open && desmosCalculatorRef.current) {
      // Save state before destroying when dialog closes
      try {
        const state = desmosCalculatorRef.current.getState()
        savedDesmosStateRef.current = state
        desmosCalculatorRef.current.destroy()
      } catch (error) {
        console.error('Error destroying Desmos calculator:', error)
      }
      desmosCalculatorRef.current = null
    }
  }, [type, open, isMinimized, desmosLoaded])

  // Reset calculator when type changes
  useEffect(() => {
    clear()
    // Destroy Desmos calculator when switching away from graphing
    if (type !== 'GRAPHING' && desmosCalculatorRef.current) {
      try {
        desmosCalculatorRef.current.destroy()
      } catch (error) {
        console.error('Error destroying Desmos calculator:', error)
      }
      desmosCalculatorRef.current = null
    }
  }, [type])

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setNewNumber(true)
  }

  const clearAll = () => {
    clear()
    setMemory(0)
  }

  const appendNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num === '.' ? '0.' : num)
      setNewNumber(false)
    } else {
      if (num === '.' && display.includes('.')) return
      setDisplay(display + num)
    }
  }

  const handleOperation = (op: string) => {
    const current = parseFloat(display)
    
    if (previousValue === null) {
      setPreviousValue(current)
    } else if (operation) {
      const result = calculate(previousValue, current, operation)
      setDisplay(String(result))
      setPreviousValue(result)
    }
    
    setOperation(op)
    setNewNumber(true)
  }

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '×': return a * b
      case '÷': return b !== 0 ? a / b : 0
      case '^': return Math.pow(a, b)
      case 'xʸ': return Math.pow(a, b)
      default: return b
    }
  }

  const equals = () => {
    if (operation && previousValue !== null) {
      const current = parseFloat(display)
      const result = calculate(previousValue, current, operation)
      setDisplay(String(result))
      setPreviousValue(null)
      setOperation(null)
      setNewNumber(true)
    }
  }

  const scientificFunction = (func: string) => {
    const current = parseFloat(display)
    let result: number

    switch (func) {
      case 'sin':
        result = angleMode === 'DEG' ? Math.sin(current * Math.PI / 180) : Math.sin(current)
        break
      case 'cos':
        result = angleMode === 'DEG' ? Math.cos(current * Math.PI / 180) : Math.cos(current)
        break
      case 'tan':
        result = angleMode === 'DEG' ? Math.tan(current * Math.PI / 180) : Math.tan(current)
        break
      case 'log':
        result = Math.log10(current)
        break
      case 'ln':
        result = Math.log(current)
        break
      case 'sqrt':
        result = Math.sqrt(current)
        break
      case 'x²':
        result = current * current
        break
      case '1/x':
        result = current !== 0 ? 1 / current : 0
        break
      case 'π':
        result = Math.PI
        setNewNumber(true)
        break
      case 'e':
        result = Math.E
        setNewNumber(true)
        break
      case '!':
        result = factorial(Math.floor(current))
        break
      case 'abs':
        result = Math.abs(current)
        break
      default:
        return
    }

    setDisplay(String(result))
    setNewNumber(true)
  }

  const factorial = (n: number): number => {
    if (n < 0) return 0
    if (n === 0 || n === 1) return 1
    return n * factorial(n - 1)
  }

  const toggleSign = () => {
    setDisplay(String(-parseFloat(display)))
  }

  const percentage = () => {
    setDisplay(String(parseFloat(display) / 100))
  }

  const memoryAdd = () => {
    setMemory(memory + parseFloat(display))
  }

  const memoryRecall = () => {
    setDisplay(String(memory))
    setNewNumber(true)
  }

  const memoryClear = () => {
    setMemory(0)
  }

  const renderFourFunction = () => (
    <div className="grid grid-cols-4 gap-2">
      <Button variant="outline" onClick={clearAll} className="col-span-2">AC</Button>
      <Button variant="outline" onClick={toggleSign}>+/-</Button>
      <Button variant="outline" onClick={() => handleOperation('÷')}>÷</Button>
      
      <Button variant="outline" onClick={() => appendNumber('7')}>7</Button>
      <Button variant="outline" onClick={() => appendNumber('8')}>8</Button>
      <Button variant="outline" onClick={() => appendNumber('9')}>9</Button>
      <Button variant="outline" onClick={() => handleOperation('×')}>×</Button>
      
      <Button variant="outline" onClick={() => appendNumber('4')}>4</Button>
      <Button variant="outline" onClick={() => appendNumber('5')}>5</Button>
      <Button variant="outline" onClick={() => appendNumber('6')}>6</Button>
      <Button variant="outline" onClick={() => handleOperation('-')}>-</Button>
      
      <Button variant="outline" onClick={() => appendNumber('1')}>1</Button>
      <Button variant="outline" onClick={() => appendNumber('2')}>2</Button>
      <Button variant="outline" onClick={() => appendNumber('3')}>3</Button>
      <Button variant="outline" onClick={() => handleOperation('+')}>+</Button>
      
      <Button variant="outline" onClick={() => appendNumber('0')} className="col-span-2">0</Button>
      <Button variant="outline" onClick={() => appendNumber('.')}>.</Button>
      <Button variant="default" onClick={equals}>=</Button>
    </div>
  )

  const renderScientific = () => (
    <div className="space-y-2">
      <div className="flex gap-2 mb-2">
        <Button
          size="sm"
          variant={angleMode === 'DEG' ? 'default' : 'outline'}
          onClick={() => setAngleMode('DEG')}
          className="flex-1"
        >
          DEG
        </Button>
        <Button
          size="sm"
          variant={angleMode === 'RAD' ? 'default' : 'outline'}
          onClick={() => setAngleMode('RAD')}
          className="flex-1"
        >
          RAD
        </Button>
      </div>
      
      <div className="grid grid-cols-5 gap-1">
        <Button size="sm" variant="outline" onClick={() => scientificFunction('sin')}>sin</Button>
        <Button size="sm" variant="outline" onClick={() => scientificFunction('cos')}>cos</Button>
        <Button size="sm" variant="outline" onClick={() => scientificFunction('tan')}>tan</Button>
        <Button size="sm" variant="outline" onClick={() => scientificFunction('log')}>log</Button>
        <Button size="sm" variant="outline" onClick={() => scientificFunction('ln')}>ln</Button>
        
        <Button size="sm" variant="outline" onClick={() => scientificFunction('x²')}>x²</Button>
        <Button size="sm" variant="outline" onClick={() => handleOperation('xʸ')}>xʸ</Button>
        <Button size="sm" variant="outline" onClick={() => scientificFunction('sqrt')}>√</Button>
        <Button size="sm" variant="outline" onClick={() => scientificFunction('!')}>n!</Button>
        <Button size="sm" variant="outline" onClick={() => scientificFunction('1/x')}>1/x</Button>
        
        <Button size="sm" variant="outline" onClick={() => scientificFunction('π')}>π</Button>
        <Button size="sm" variant="outline" onClick={() => scientificFunction('e')}>e</Button>
        <Button size="sm" variant="outline" onClick={() => scientificFunction('abs')}>|x|</Button>
        <Button size="sm" variant="outline" onClick={memoryAdd}>M+</Button>
        <Button size="sm" variant="outline" onClick={memoryRecall}>MR</Button>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        <Button variant="outline" onClick={clearAll}>AC</Button>
        <Button variant="outline" onClick={clear}>C</Button>
        <Button variant="outline" onClick={toggleSign}>+/-</Button>
        <Button variant="outline" onClick={() => handleOperation('÷')}>÷</Button>
        
        <Button variant="outline" onClick={() => appendNumber('7')}>7</Button>
        <Button variant="outline" onClick={() => appendNumber('8')}>8</Button>
        <Button variant="outline" onClick={() => appendNumber('9')}>9</Button>
        <Button variant="outline" onClick={() => handleOperation('×')}>×</Button>
        
        <Button variant="outline" onClick={() => appendNumber('4')}>4</Button>
        <Button variant="outline" onClick={() => appendNumber('5')}>5</Button>
        <Button variant="outline" onClick={() => appendNumber('6')}>6</Button>
        <Button variant="outline" onClick={() => handleOperation('-')}>-</Button>
        
        <Button variant="outline" onClick={() => appendNumber('1')}>1</Button>
        <Button variant="outline" onClick={() => appendNumber('2')}>2</Button>
        <Button variant="outline" onClick={() => appendNumber('3')}>3</Button>
        <Button variant="outline" onClick={() => handleOperation('+')}>+</Button>
        
        <Button variant="outline" onClick={() => appendNumber('0')} className="col-span-2">0</Button>
        <Button variant="outline" onClick={() => appendNumber('.')}>.</Button>
        <Button variant="default" onClick={equals}>=</Button>
      </div>
    </div>
  )


  const renderGraphing = () => {
    return (
      <div className="bg-muted rounded-md border relative w-full" style={{ height: '600px', minHeight: '600px' }}>
        <div 
          key={open ? 'desmos-open' : 'desmos-closed'}
          ref={desmosContainerRef}
          className="w-full h-full"
          style={{ minHeight: '600px', width: '100%' }}
        />
        {(!desmosLoaded || !desmosCalculatorRef.current) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center space-y-2 bg-background/90 rounded-lg p-4 border">
              <CalcIcon className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Loading Desmos calculator...
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const getCalculatorTitle = () => {
    switch (type) {
      case 'FOUR_FUNCTION': return 'Calculator'
      case 'SCIENTIFIC': return 'Scientific Calculator'
      case 'GRAPHING': return 'Graphing Calculator'
    }
  }

  const renderCalculatorContent = () => {
    switch (type) {
      case 'FOUR_FUNCTION': return renderFourFunction()
      case 'SCIENTIFIC': return renderScientific()
      case 'GRAPHING': return renderGraphing()
    }
  }

  // Minimized floating button
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => {
            setIsMinimized(false)
          }}
          className="rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <CalcIcon className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={type === 'GRAPHING' ? 'max-w-4xl max-h-[90vh] overflow-y-auto' : 'max-w-md max-h-[90vh] overflow-y-auto'}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{getCalculatorTitle()}</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsMinimized(true)
                }}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className={type === 'GRAPHING' ? '' : 'space-y-4'}>
          {/* Display - only show for non-graphing calculators */}
          {type !== 'GRAPHING' && (
            <div className="bg-muted rounded-md p-4">
              <div className="text-right">
                {operation && previousValue !== null && (
                  <div className="text-sm text-muted-foreground">
                    {previousValue} {operation}
                  </div>
                )}
                <div className="text-3xl font-mono font-bold break-all">
                  {display}
                </div>
                {memory !== 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Memory: {memory}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calculator buttons */}
          {renderCalculatorContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Floating calculator button for test-taking interface
export function CalculatorButton({ 
  calculatorType, 
  className 
}: { 
  calculatorType: CalculatorType
  className?: string 
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className={className}
      >
        <CalcIcon className="h-4 w-4 mr-2" />
        Calculator
      </Button>
      <Calculator type={calculatorType} open={open} onOpenChange={setOpen} />
    </>
  )
}

