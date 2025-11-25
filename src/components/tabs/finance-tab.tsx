'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { DollarSign, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, ShoppingCart, Download, Settings, AlertTriangle, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { SaveIndicator } from '@/components/ui/save-indicator'

interface FinanceTabProps {
  teamId: string
  isAdmin: boolean
  currentMembershipId: string
  currentMembershipSubteamId?: string | null
  division?: 'B' | 'C'
}

interface Expense {
  id: string
  description: string
  category: string | null
  amount: number
  date: string
  notes: string | null
  purchaseRequestId: string | null
  eventId: string | null
  addedById: string
  createdAt: string
  updatedAt: string
  event?: {
    id: string
    name: string
    slug: string
  }
  purchaseRequest?: {
    id: string
    requesterId: string
    description: string
  }
  addedBy?: {
    id: string
    subteamId: string | null
    subteam: {
      id: string
      name: string
    } | null
  } | null
}

interface PurchaseRequest {
  id: string
  teamId: string
  eventId: string | null
  subteamId: string | null
  requesterId: string
  description: string
  category: string | null
  estimatedAmount: number
  justification: string | null
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED'
  reviewedById: string | null
  reviewNote: string | null
  reviewedAt: string | null
  adminOverride: boolean
  createdAt: string
  updatedAt: string
  event?: {
    id: string
    name: string
    slug: string
  }
  subteam?: {
    id: string
    name: string
  } | null
  expense?: {
    id: string
    amount: number
    date: string
  }
}

interface Event {
  id: string
  name: string
  slug: string
  division: 'B' | 'C'
}

interface Subteam {
  id: string
  name: string
  teamId: string
}

interface EventBudget {
  id: string
  teamId: string
  eventId: string
  subteamId: string | null
  maxBudget: number
  createdAt: string
  updatedAt: string
  event: {
    id: string
    name: string
    slug: string
    division: 'B' | 'C'
  }
  subteam?: {
    id: string
    name: string
  } | null
  totalSpent: number
  totalRequested: number
  remaining: number
}

export default function FinanceTab({ teamId, isAdmin, currentMembershipId, currentMembershipSubteamId, division }: FinanceTabProps) {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [subteams, setSubteams] = useState<Subteam[]>([])
  const [budgets, setBudgets] = useState<EventBudget[]>([])
  const [loading, setLoading] = useState(true)

  // Add Expense Dialog
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    eventId: '',
  })
  const [addingExpense, setAddingExpense] = useState(false)

  // Edit Expense Dialog
  const [editExpenseOpen, setEditExpenseOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editExpenseForm, setEditExpenseForm] = useState({
    description: '',
    category: '',
    amount: '',
    date: '',
    notes: '',
    eventId: '',
  })
  const [updatingExpense, setUpdatingExpense] = useState(false)

  // Delete Expense Dialog
  const [deleteExpenseOpen, setDeleteExpenseOpen] = useState(false)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [deletingExpenseLoading, setDeletingExpenseLoading] = useState(false)

  // Purchase Request Dialog
  const [requestPurchaseOpen, setRequestPurchaseOpen] = useState(false)
  const [purchaseRequestForm, setPurchaseRequestForm] = useState({
    description: '',
    category: '',
    estimatedAmount: '',
    justification: '',
    eventId: '',
  })
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null)
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // Review Purchase Request Dialog
  const [reviewRequestOpen, setReviewRequestOpen] = useState(false)
  const [reviewingRequest, setReviewingRequest] = useState<PurchaseRequest | null>(null)
  const [reviewForm, setReviewForm] = useState({
    status: 'APPROVED' as 'APPROVED' | 'DENIED',
    reviewNote: '',
    addToExpenses: true,
    actualAmount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    expenseNotes: '',
    adminOverride: false,
  })
  const [reviewBudgetWarning, setReviewBudgetWarning] = useState<string | null>(null)

  // Budget Management
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<EventBudget | null>(null)
  const [budgetForm, setBudgetForm] = useState({
    eventId: '',
    subteamId: '',
    maxBudget: '',
  })
  const [savingBudget, setSavingBudget] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const promises = [
        fetch(`/api/expenses?teamId=${teamId}`),
        fetch(`/api/purchase-requests?teamId=${teamId}`),
        fetch(`/api/event-budgets?teamId=${teamId}`),
        fetch(`/api/teams/${teamId}/subteams`),
      ]

      if (division) {
        promises.push(fetch(`/api/events?division=${division}`))
      }

      const [expensesRes, requestsRes, budgetsRes, subteamsRes, eventsRes] = await Promise.all(promises)

      if (expensesRes.ok) {
        const data = await expensesRes.json()
        setExpenses(data.expenses)
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setPurchaseRequests(data.purchaseRequests)
      }

      if (budgetsRes.ok) {
        const data = await budgetsRes.json()
        console.log('Fetched budgets:', data.budgets)
        setBudgets(data.budgets || [])
      } else {
        console.error('Failed to fetch budgets:', budgetsRes.status, await budgetsRes.text())
      }

      if (subteamsRes.ok) {
        const data = await subteamsRes.json()
        setSubteams(data.subteams || [])
      }

      if (eventsRes && eventsRes.ok) {
        const data = await eventsRes.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch finance data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load finance data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [teamId, division, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingExpense(true)

    const expenseData = {
      teamId,
      eventId: expenseForm.eventId || undefined,
      description: expenseForm.description,
      category: expenseForm.category || undefined,
      amount: parseFloat(expenseForm.amount),
      date: new Date(expenseForm.date).toISOString(),
      notes: expenseForm.notes || undefined,
    }

    // Optimistic update - create temporary expense
    const tempExpense: Expense = {
      id: `temp-${Date.now()}`,
      ...expenseData,
      date: expenseForm.date,
      event: expenseForm.eventId ? events.find(e => e.id === expenseForm.eventId) : undefined,
      addedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setExpenses(prev => [tempExpense, ...prev])
    setExpenseForm({
      description: '',
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      eventId: '',
    })
    setAddExpenseOpen(false)

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setExpenses(prev => prev.filter(e => e.id !== tempExpense.id))
        const data = await response.json()
        throw new Error(data.error || 'Failed to add expense')
      }

      const data = await response.json()
      // Refetch expenses to get full data with addedBy field
      // The API POST doesn't return addedBy, so we need to refetch
      const expensesRes = await fetch(`/api/expenses?teamId=${teamId}`)
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        setExpenses(expensesData.expenses)
      } else {
        // Fallback: replace temp expense with response (may be missing addedBy)
        setExpenses(prev => prev.map(e => e.id === tempExpense.id ? data.expense : e))
      }
      setSaveIndicator(true)
      
      toast({
        title: 'Expense Added',
        description: 'The expense has been added to the spreadsheet',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add expense',
        variant: 'destructive',
      })
    } finally {
      setAddingExpense(false)
    }
  }

  const handleEditExpenseClick = (expense: Expense) => {
    setEditingExpense(expense)
    setEditExpenseForm({
      description: expense.description,
      category: expense.category || '',
      amount: expense.amount.toString(),
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || '',
      eventId: expense.eventId || '',
    })
    setEditExpenseOpen(true)
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return

    setUpdatingExpense(true)

    const updateData = {
      eventId: editExpenseForm.eventId || null,
      description: editExpenseForm.description,
      category: editExpenseForm.category || undefined,
      amount: parseFloat(editExpenseForm.amount),
      date: new Date(editExpenseForm.date).toISOString(),
      notes: editExpenseForm.notes || undefined,
    }

    // Optimistic update
    const originalExpense = editingExpense
    const optimisticExpense: Expense = {
      ...editingExpense,
      ...updateData,
      date: editExpenseForm.date,
      amount: parseFloat(editExpenseForm.amount),
      event: editExpenseForm.eventId ? events.find(e => e.id === editExpenseForm.eventId) : undefined,
      updatedAt: new Date().toISOString(),
    }

    setExpenses(prev => prev.map(e => e.id === editingExpense.id ? optimisticExpense : e))
    setEditExpenseOpen(false)
    setEditingExpense(null)

    try {
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        // Revert optimistic update
        setExpenses(prev => prev.map(e => e.id === editingExpense.id ? originalExpense : e))
        const data = await response.json()
        throw new Error(data.error || 'Failed to update expense')
      }

      const data = await response.json()
      // Refetch expenses to get full data with addedBy field
      const expensesRes = await fetch(`/api/expenses?teamId=${teamId}`)
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        setExpenses(expensesData.expenses)
      } else {
        // Fallback: update with response
        setExpenses(prev => prev.map(e => e.id === editingExpense.id ? data.expense : e))
      }
      setSaveIndicator(true)
      
      toast({
        title: 'Expense Updated',
        description: 'The expense has been updated',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update expense',
        variant: 'destructive',
      })
    } finally {
      setUpdatingExpense(false)
    }
  }

  const handleDeleteExpenseClick = (expense: Expense) => {
    setDeletingExpense(expense)
    setDeleteExpenseOpen(true)
  }

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return

    setDeletingExpenseLoading(true)

    // Optimistic update
    const expenseToDelete = deletingExpense
    setExpenses(prev => prev.filter(e => e.id !== deletingExpense.id))
    setDeleteExpenseOpen(false)
    setDeletingExpense(null)

    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // Revert optimistic update
        setExpenses(prev => [...prev, expenseToDelete].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete expense')
      }

      setSaveIndicator(true)
      toast({
        title: 'Expense Deleted',
        description: 'The expense has been removed',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete expense',
        variant: 'destructive',
      })
    } finally {
      setDeletingExpenseLoading(false)
    }
  }

  const handleRequestPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingRequest(true)
    setBudgetWarning(null)

    try {
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          eventId: purchaseRequestForm.eventId || undefined,
          description: purchaseRequestForm.description,
          category: purchaseRequestForm.category || undefined,
          estimatedAmount: parseFloat(purchaseRequestForm.estimatedAmount),
          justification: purchaseRequestForm.justification || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.code === 'BUDGET_EXCEEDED') {
          setBudgetWarning(data.error)
          throw new Error(data.error)
        }
        throw new Error(data.error || 'Failed to submit request')
      }

      toast({
        title: 'Request Submitted',
        description: 'Your purchase request has been submitted for review',
      })

      const data = await response.json()
      
      // Optimistically add the new request
      if (data.purchaseRequest) {
        setPurchaseRequests(prev => [data.purchaseRequest, ...prev])
      } else {
        // If response doesn't include purchaseRequest, refetch
        await fetchData()
      }

      setPurchaseRequestForm({
        description: '',
        category: '',
        estimatedAmount: '',
        justification: '',
        eventId: '',
      })
      setRequestPurchaseOpen(false)
      setSaveIndicator(true)
    } catch (error: any) {
      // Error already shown via budgetWarning or toast
      if (!error.message.includes('exceeds remaining budget')) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to submit request',
          variant: 'destructive',
        })
      }
    } finally {
      setSubmittingRequest(false)
    }
  }

  const handleReviewRequestClick = async (request: PurchaseRequest) => {
    setReviewingRequest(request)
    setReviewBudgetWarning(null)

    // Check budget if event is specified
    if (request.eventId) {
      const budget = budgets.find(b => b.eventId === request.eventId)
      if (budget) {
        const requestAmount = request.estimatedAmount
        if (requestAmount > budget.remaining) {
          setReviewBudgetWarning(
            `This request exceeds the remaining budget by $${(requestAmount - budget.remaining).toFixed(2)}. Remaining: $${budget.remaining.toFixed(2)}`
          )
        }
      }
    }

    setReviewForm({
      status: 'APPROVED',
      reviewNote: '',
      addToExpenses: true,
      actualAmount: request.estimatedAmount.toString(),
      expenseDate: new Date().toISOString().split('T')[0],
      expenseNotes: '',
      adminOverride: false,
    })
    setReviewRequestOpen(true)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewingRequest) return

    setSubmittingReview(true)

    try {
      const response = await fetch(`/api/purchase-requests/${reviewingRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewForm.status,
          reviewNote: reviewForm.reviewNote || undefined,
          addToExpenses: reviewForm.status === 'APPROVED' ? reviewForm.addToExpenses : false,
          actualAmount: reviewForm.addToExpenses ? parseFloat(reviewForm.actualAmount) : undefined,
          expenseDate: reviewForm.addToExpenses ? new Date(reviewForm.expenseDate).toISOString() : undefined,
          expenseNotes: reviewForm.addToExpenses ? reviewForm.expenseNotes || undefined : undefined,
          adminOverride: reviewForm.adminOverride,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to review request')
      }

      toast({
        title: reviewForm.status === 'APPROVED' ? 'Request Approved' : 'Request Denied',
        description: reviewForm.status === 'APPROVED' 
          ? 'The purchase request has been approved'
          : 'The purchase request has been denied',
      })

      const data = await response.json()
      
      // Optimistically update the request
      if (data.purchaseRequest) {
        setPurchaseRequests(prev => prev.map(r => 
          r.id === reviewingRequest.id ? data.purchaseRequest : r
        ))
      }
      
      // If expense was created, add it optimistically
      if (data.expense) {
        setExpenses(prev => [data.expense, ...prev])
      }
      
      // If response structure is different, refetch to ensure consistency
      if (!data.purchaseRequest && !data.expense) {
        await fetchData()
      }

      setReviewRequestOpen(false)
      setReviewingRequest(null)
      setSaveIndicator(true)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to review request',
        variant: 'destructive',
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  const getStatusBadge = (status: PurchaseRequest['status']) => {
    const statusConfig = {
      PENDING: { label: 'Pending', icon: Clock, variant: 'secondary' as const },
      APPROVED: { label: 'Approved', icon: CheckCircle, variant: 'default' as const },
      DENIED: { label: 'Denied', icon: XCircle, variant: 'destructive' as const },
      COMPLETED: { label: 'Completed', icon: CheckCircle, variant: 'default' as const },
    }
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBudget(true)

    try {
      const response = await fetch('/api/event-budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          eventId: budgetForm.eventId,
          subteamId: budgetForm.subteamId || null,
          maxBudget: parseFloat(budgetForm.maxBudget),
          ...(editingBudget && { budgetId: editingBudget.id }),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save budget')
      }

      const result = await response.json()
      console.log('Budget saved response:', result)
      
      // Optimistically update budgets
      if (result.budget) {
        setBudgets((prev) => {
          const exists = prev.some(b => b.id === result.budget.id)
          if (exists) {
            return prev.map(b => b.id === result.budget.id ? result.budget : b)
          }
          return [...prev, result.budget]
        })
      }

      setSaveIndicator(true)
      toast({
        title: 'Budget Saved',
        description: 'Event budget has been updated',
      })

      setBudgetDialogOpen(false)
      setEditingBudget(null)
      setBudgetForm({ eventId: '', subteamId: '', maxBudget: '' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save budget',
        variant: 'destructive',
      })
    } finally {
      setSavingBudget(false)
    }
  }

  const handleEditBudgetClick = (budget: EventBudget) => {
    setEditingBudget(budget)
    setBudgetForm({
      eventId: budget.eventId,
      subteamId: budget.subteamId || '',
      maxBudget: budget.maxBudget.toString(),
    })
    setBudgetDialogOpen(true)
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  // Calculate subteam expenses based on purchaser's subteam
  const subteamExpenses = expenses.reduce((acc, exp) => {
    const purchaserSubteam = exp.addedBy?.subteam
    const subteamId = purchaserSubteam?.id || 'club-wide'
    const subteamName = purchaserSubteam?.name || 'Club-wide'
    
    if (!acc[subteamId]) {
      acc[subteamId] = {
        id: subteamId,
        name: subteamName,
        total: 0,
      }
    }
    acc[subteamId].total += exp.amount
    return acc
  }, {} as Record<string, { id: string; name: string; total: number }>)

  // Debug: Log expenses to verify grouping
  useEffect(() => {
    if (expenses.length > 0) {
      console.log('Expenses with purchaser info:', expenses.map(exp => ({
        id: exp.id,
        description: exp.description,
        amount: exp.amount,
        purchaserSubteam: exp.addedBy?.subteam?.name || 'Club-wide',
        fromPurchaseRequest: !!exp.purchaseRequest,
      })))
      console.log('Subteam expenses breakdown:', subteamExpenses)
    }
  }, [expenses, subteamExpenses])

  const subteamExpensesList = Object.values(subteamExpenses).sort((a, b) => {
    // Put "Club-wide" at the end
    if (a.id === 'club-wide') return 1
    if (b.id === 'club-wide') return -1
    return a.name.localeCompare(b.name)
  })

  const handleExportCSV = () => {
    // Create CSV header
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Notes']
    const csvRows = [headers.join(',')]

    // Add expense rows
    expenses.forEach((expense) => {
      const row = [
        new Date(expense.date).toLocaleDateString(),
        `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes in description
        expense.category || '',
        expense.amount.toFixed(2),
        expense.notes ? `"${expense.notes.replace(/"/g, '""')}"` : '', // Escape quotes in notes
      ]
      csvRows.push(row.join(','))
    })

    // Add total row
    csvRows.push('')
    csvRows.push(`Total,${totalExpenses.toFixed(2)}`)

    // Create CSV content
    const csvContent = csvRows.join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Export Successful',
      description: 'Expenses spreadsheet has been exported',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Finance</h2>
          <SaveIndicator show={saveIndicator} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setRequestPurchaseOpen(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Request Purchase
          </Button>
              {isAdmin && (
            <Button onClick={() => setAddExpenseOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          )}
        </div>
      </div>

      {/* Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expense Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Team Expense */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Team Expense</p>
                <p className="text-2xl font-bold mt-1">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Subteam Expenses */}
          {subteamExpensesList.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Subteam Expenses</p>
              <div className="grid gap-2">
                {subteamExpensesList.map((subteamExp) => (
                  <div
                    key={subteamExp.id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <span className="font-medium">{subteamExp.name}</span>
                    <span className="text-lg font-semibold">${subteamExp.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Budgets Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <CardTitle>Event Budgets</CardTitle>
            </div>
            {isAdmin && (
              <Button onClick={() => setBudgetDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Set Budget
              </Button>
            )}
          </div>
          <CardDescription>
            Budget tracking for each event team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No event budgets set yet. {isAdmin && 'Click "Set Budget" to create one.'}
            </p>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const spentPercentage = Math.min((budget.totalSpent / budget.maxBudget) * 100, 100)
                return (
                  <div
                    key={budget.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-base mb-1">
                          {budget.event.name}
                          {budget.subteam && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {budget.subteam.name}
                            </Badge>
                          )}
                        </h4>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditBudgetClick(budget)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this budget?')) {
                                try {
                                  const response = await fetch(`/api/event-budgets/${budget.id}`, {
                                    method: 'DELETE',
                                  })
                                  if (response.ok) {
                                    // Optimistically remove budget
                                    setBudgets(prev => prev.filter(b => b.id !== budget.id))
                                    setSaveIndicator(true)
                                    toast({
                                      title: 'Budget Deleted',
                                      description: 'The event budget has been removed',
                                    })
                                  } else {
                                    throw new Error('Failed to delete budget')
                                  }
                                } catch (error: any) {
                                  toast({
                                    title: 'Error',
                                    description: error.message || 'Failed to delete budget',
                                    variant: 'destructive',
                                  })
                                }
                              }
                            }}
                            className="h-8 w-8 p-0 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Budget: <span className="font-medium text-foreground">${budget.maxBudget.toFixed(2)}</span></span>
                        <span className="text-muted-foreground">Spent: <span className="font-medium text-foreground">${budget.totalSpent.toFixed(2)}</span></span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            spentPercentage > 100
                              ? 'bg-red-500'
                              : spentPercentage > 80
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            ${budget.remaining.toFixed(2)} <span className="text-muted-foreground font-normal">remaining</span>
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Requested: ${(budget.totalRequested || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Requests Section */}
      {(isAdmin || purchaseRequests.some(req => req.requesterId === currentMembershipId)) && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Requests</CardTitle>
            <CardDescription>
              {isAdmin ? 'Review and approve purchase requests from team members' : 'Your purchase requests'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchaseRequests.length === 0 ? (
                <p className="text-muted-foreground text-sm">No purchase requests</p>
              ) : (
                purchaseRequests
                  .filter(req => isAdmin || req.requesterId === currentMembershipId)
                  .map((request) => (
                    <div
                      key={request.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{request.description}</h4>
                          {getStatusBadge(request.status)}
                        </div>
                        {request.event && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Event: {request.event.name}
                            {request.subteam && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {request.subteam.name}
                              </Badge>
                            )}
                          </p>
                        )}
                        {request.category && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Category: {request.category}
                          </p>
                        )}
                        <p className="text-sm font-medium">
                          Estimated: ${request.estimatedAmount.toFixed(2)}
                        </p>
                        {request.adminOverride && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Admin Override
                          </Badge>
                        )}
                        {request.justification && (
                          <p className="text-sm text-muted-foreground mt-1">{request.justification}</p>
                        )}
                        {request.reviewNote && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            Review: {request.reviewNote}
                          </p>
                        )}
                        {request.expense && (
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            ✓ Added to expenses: ${request.expense.amount.toFixed(2)} on{' '}
                            {new Date(request.expense.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {isAdmin && request.status === 'PENDING' && (
                        <Button
                          size="sm"
                          onClick={() => handleReviewRequestClick(request)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Spreadsheet */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Expense Spreadsheet</CardTitle>
              <CardDescription>
                {isAdmin ? 'View and manage all team expenses' : 'View team expenses'}
              </CardDescription>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Event</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Subteam</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  {isAdmin && <th className="text-right p-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-muted-foreground">
                      No expenses recorded yet
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="p-3">
                        {expense.description}
                        {expense.purchaseRequest && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            From Request
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">{expense.event?.name || '-'}</td>
                      <td className="p-3">{expense.category || '-'}</td>
                      <td className="p-3">
                        {expense.addedBy?.subteam ? (
                          <Badge variant="outline" className="text-xs">
                            {expense.addedBy.subteam.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Club-wide</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">${expense.amount.toFixed(2)}</td>
                      {isAdmin && (
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditExpenseClick(expense)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteExpenseClick(expense)}
                              className="h-8 w-8 p-0 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent>
          <form onSubmit={handleAddExpense}>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>Add a new expense to the team&apos;s finance spreadsheet</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {division && events.length > 0 && (
                <div>
                  <Label htmlFor="expense-event">Event (Optional)</Label>
                  <select
                    id="expense-event"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={expenseForm.eventId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, eventId: e.target.value })}
                  >
                    <option value="">None</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  required
                  maxLength={500}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  placeholder="e.g., Equipment, Travel, Materials"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddExpenseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingExpense}>
                {addingExpense ? 'Adding...' : 'Add Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editExpenseOpen} onOpenChange={setEditExpenseOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateExpense}>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
              <DialogDescription>Update expense details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {division && events.length > 0 && (
                <div>
                  <Label htmlFor="edit-expense-event">Event (Optional)</Label>
                  <select
                    id="edit-expense-event"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editExpenseForm.eventId}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, eventId: e.target.value })}
                  >
                    <option value="">None</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Input
                  id="edit-description"
                  value={editExpenseForm.description}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, description: e.target.value })}
                  required
                  maxLength={500}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editExpenseForm.category}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, category: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount">Amount ($) *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editExpenseForm.amount}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editExpenseForm.date}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Input
                  id="edit-notes"
                  value={editExpenseForm.notes}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditExpenseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatingExpense}>
                {updatingExpense ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Dialog */}
      <Dialog open={deleteExpenseOpen} onOpenChange={setDeleteExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteExpenseOpen(false)
                setDeletingExpense(null)
              }}
              disabled={deletingExpenseLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteExpense}
              disabled={deletingExpenseLoading}
            >
              {deletingExpenseLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Purchase Dialog */}
      <Dialog open={requestPurchaseOpen} onOpenChange={setRequestPurchaseOpen}>
        <DialogContent>
          <form onSubmit={handleRequestPurchase}>
            <DialogHeader>
              <DialogTitle>Request Purchase</DialogTitle>
              <DialogDescription>
                Submit a purchase request for admin approval
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {division && events.length > 0 && (
                <div>
                  <Label htmlFor="req-event">Event (Optional)</Label>
                  <select
                    id="req-event"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={purchaseRequestForm.eventId}
                    onChange={(e) => {
                      setPurchaseRequestForm({ ...purchaseRequestForm, eventId: e.target.value })
                      setBudgetWarning(null)
                    }}
                  >
                    <option value="">None</option>
                    {events
                      .filter((event) => {
                        // Admins can see all events
                        if (isAdmin) return true
                        
                        // Members can only see events that have budgets for their team (or club-wide)
                        if (!currentMembershipSubteamId) {
                          // Member without team - only show events with club-wide budgets
                          return budgets.some(
                            (b) => b.eventId === event.id && b.subteamId === null
                          )
                        } else {
                          // Member with team - show events with their team's budget OR club-wide budget
                          return budgets.some(
                            (b) =>
                              b.eventId === event.id &&
                              (b.subteamId === currentMembershipSubteamId || b.subteamId === null)
                          )
                        }
                      })
                      .map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                  </select>
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Only events with budgets for your subteam are shown
                    </p>
                  )}
                </div>
              )}
              {/* Budget Reminder - Shows when event is selected */}
              {purchaseRequestForm.eventId && (() => {
                const selectedEvent = events.find(e => e.id === purchaseRequestForm.eventId)
                const budget = budgets.find(b => {
                  if (b.eventId !== purchaseRequestForm.eventId) return false
                  // For members, find their team's budget or club-wide budget
                  if (!isAdmin && currentMembershipSubteamId) {
                    return b.subteamId === currentMembershipSubteamId || b.subteamId === null
                  } else if (!isAdmin) {
                    return b.subteamId === null
                  }
                  // For admins, show the first matching budget (they can see all)
                  return true
                })
                
                if (budget && selectedEvent) {
                  const requestAmount = parseFloat(purchaseRequestForm.estimatedAmount) || 0
                  const wouldExceed = requestAmount > budget.remaining
                  const subteamName = budget.subteam ? ` (${budget.subteam.name})` : ''
                  
                  return (
                    <div className={`p-4 rounded-lg border-2 ${
                      wouldExceed 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800' 
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800'
                    }`}>
                      <div className="flex items-start gap-2 mb-3">
                        <Wallet className={`h-5 w-5 mt-0.5 ${
                          wouldExceed 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-blue-600 dark:text-blue-400'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">
                            Budget Reminder: {selectedEvent.name}{subteamName}
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Budget:</span>
                              <span className="font-medium">${budget.maxBudget.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Already Spent:</span>
                              <span className="font-medium">${budget.totalSpent.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Pending Requests:</span>
                              <span className="font-medium">${budget.totalRequested.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-current/20">
                              <span className="font-semibold">Remaining Budget:</span>
                              <span className={`font-bold ${
                                budget.remaining < 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : budget.remaining < budget.maxBudget * 0.2
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                ${budget.remaining.toFixed(2)}
                              </span>
                            </div>
                            {requestAmount > 0 && (
                              <div className="pt-2 mt-2 border-t border-current/20">
                                <div className="flex justify-between mb-1">
                                  <span className="text-muted-foreground">Your Request:</span>
                                  <span className="font-medium">${requestAmount.toFixed(2)}</span>
                                </div>
                                {wouldExceed && (
                                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mt-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>This exceeds remaining budget by ${(requestAmount - budget.remaining).toFixed(2)}</span>
                                  </div>
                                )}
                                {!wouldExceed && budget.remaining - requestAmount >= 0 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    After this request: ${(budget.remaining - requestAmount).toFixed(2)} remaining
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
              {budgetWarning && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{budgetWarning}</p>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="req-description">Description *</Label>
                <Input
                  id="req-description"
                  value={purchaseRequestForm.description}
                  onChange={(e) => setPurchaseRequestForm({ ...purchaseRequestForm, description: e.target.value })}
                  required
                  maxLength={500}
                  placeholder="What do you want to purchase?"
                />
              </div>
              <div>
                <Label htmlFor="req-category">Category</Label>
                <Input
                  id="req-category"
                  value={purchaseRequestForm.category}
                  onChange={(e) => setPurchaseRequestForm({ ...purchaseRequestForm, category: e.target.value })}
                  placeholder="e.g., Equipment, Travel, Materials"
                />
              </div>
              <div>
                <Label htmlFor="req-amount">Estimated Amount ($) *</Label>
                <Input
                  id="req-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchaseRequestForm.estimatedAmount}
                  onChange={(e) => setPurchaseRequestForm({ ...purchaseRequestForm, estimatedAmount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="req-justification">Justification</Label>
                <Input
                  id="req-justification"
                  value={purchaseRequestForm.justification}
                  onChange={(e) => setPurchaseRequestForm({ ...purchaseRequestForm, justification: e.target.value })}
                  placeholder="Why is this purchase needed?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRequestPurchaseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingRequest}>
                {submittingRequest ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review Purchase Request Dialog */}
      <Dialog open={reviewRequestOpen} onOpenChange={setReviewRequestOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmitReview}>
            <DialogHeader>
              <DialogTitle>Review Purchase Request</DialogTitle>
              <DialogDescription>
                Approve or deny this purchase request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {reviewingRequest && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p><strong>Description:</strong> {reviewingRequest.description}</p>
                  {reviewingRequest.category && <p><strong>Category:</strong> {reviewingRequest.category}</p>}
                  <p><strong>Estimated Amount:</strong> ${reviewingRequest.estimatedAmount.toFixed(2)}</p>
                  {reviewingRequest.justification && (
                    <p><strong>Justification:</strong> {reviewingRequest.justification}</p>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={reviewForm.status === 'APPROVED' ? 'default' : 'outline'}
                  onClick={() => setReviewForm({ ...reviewForm, status: 'APPROVED' })}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  type="button"
                  variant={reviewForm.status === 'DENIED' ? 'destructive' : 'outline'}
                  onClick={() => setReviewForm({ ...reviewForm, status: 'DENIED' })}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deny
                </Button>
              </div>

              <div>
                <Label htmlFor="review-note">Review Note</Label>
                <Input
                  id="review-note"
                  value={reviewForm.reviewNote}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNote: e.target.value })}
                  placeholder="Optional feedback for the requester"
                />
              </div>

              {reviewBudgetWarning && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">{reviewBudgetWarning}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="admin-override"
                          checked={reviewForm.adminOverride}
                          onChange={(e) => setReviewForm({ ...reviewForm, adminOverride: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="admin-override" className="cursor-pointer text-sm">
                          Admin Override (approve despite budget limit)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {reviewForm.status === 'APPROVED' && (
                <>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      id="add-to-expenses"
                      checked={reviewForm.addToExpenses}
                      onChange={(e) => setReviewForm({ ...reviewForm, addToExpenses: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="add-to-expenses" className="cursor-pointer">
                      Add to expenses immediately
                    </Label>
                  </div>

                  {reviewForm.addToExpenses && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="actual-amount">Actual Amount ($) *</Label>
                          <Input
                            id="actual-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={reviewForm.actualAmount}
                            onChange={(e) => setReviewForm({ ...reviewForm, actualAmount: e.target.value })}
                            required={reviewForm.addToExpenses}
                          />
                        </div>
                        <div>
                          <Label htmlFor="expense-date">Expense Date *</Label>
                          <Input
                            id="expense-date"
                            type="date"
                            value={reviewForm.expenseDate}
                            onChange={(e) => setReviewForm({ ...reviewForm, expenseDate: e.target.value })}
                            required={reviewForm.addToExpenses}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="expense-notes">Expense Notes</Label>
                        <Input
                          id="expense-notes"
                          value={reviewForm.expenseNotes}
                          onChange={(e) => setReviewForm({ ...reviewForm, expenseNotes: e.target.value })}
                          placeholder="Additional details for the expense record"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReviewRequestOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Budget Management Dialog */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveBudget}>
            <DialogHeader>
              <DialogTitle>{editingBudget ? 'Edit Event Budget' : 'Set Event Budget'}</DialogTitle>
              <DialogDescription>
                Set the maximum budget for an event team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {division && events.length > 0 && (
                <div>
                  <Label htmlFor="budget-event">Event *</Label>
                  <select
                    id="budget-event"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={budgetForm.eventId}
                    onChange={(e) => setBudgetForm({ ...budgetForm, eventId: e.target.value })}
                    required
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {subteams.length > 0 && (
                <div>
                  <Label htmlFor="budget-subteam">Subteam (Optional)</Label>
                  <select
                    id="budget-subteam"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={budgetForm.subteamId}
                    onChange={(e) => setBudgetForm({ ...budgetForm, subteamId: e.target.value })}
                  >
                    <option value="">Club-wide (all teams)</option>
                    {subteams.map((subteam) => (
                      <option key={subteam.id} value={subteam.id}>
                        {subteam.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for club-wide budget, or select a specific team
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="max-budget">Maximum Budget ($) *</Label>
                <Input
                  id="max-budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetForm.maxBudget}
                  onChange={(e) => setBudgetForm({ ...budgetForm, maxBudget: e.target.value })}
                  required
                  placeholder="e.g., 75.00"
                />
              </div>
              {editingBudget && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p><strong>Current Spending:</strong> ${editingBudget.totalSpent.toFixed(2)}</p>
                  <p><strong>Remaining:</strong> ${editingBudget.remaining.toFixed(2)}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBudgetDialogOpen(false)
                  setEditingBudget(null)
                  setBudgetForm({ eventId: '', subteamId: '', maxBudget: '' })
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingBudget}>
                {savingBudget ? 'Saving...' : editingBudget ? 'Update Budget' : 'Set Budget'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

