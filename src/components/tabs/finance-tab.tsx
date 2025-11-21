'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { DollarSign, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, ShoppingCart } from 'lucide-react'

interface FinanceTabProps {
  teamId: string
  isCaptain: boolean
  currentMembershipId: string
}

interface Expense {
  id: string
  description: string
  category: string | null
  amount: number
  date: string
  notes: string | null
  purchaseRequestId: string | null
  addedById: string
  createdAt: string
  updatedAt: string
  purchaseRequest?: {
    id: string
    requesterId: string
    description: string
  }
}

interface PurchaseRequest {
  id: string
  teamId: string
  requesterId: string
  description: string
  category: string | null
  estimatedAmount: number
  justification: string | null
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED'
  reviewedById: string | null
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  expense?: {
    id: string
    amount: number
    date: string
  }
}

export default function FinanceTab({ teamId, isCaptain, currentMembershipId }: FinanceTabProps) {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Add Expense Dialog
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
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
  })
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
  })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    fetchData()
  }, [teamId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [expensesRes, requestsRes] = await Promise.all([
        fetch(`/api/expenses?teamId=${teamId}`),
        fetch(`/api/purchase-requests?teamId=${teamId}`),
      ])

      if (expensesRes.ok) {
        const data = await expensesRes.json()
        setExpenses(data.expenses)
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setPurchaseRequests(data.purchaseRequests)
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
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingExpense(true)

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          description: expenseForm.description,
          category: expenseForm.category || undefined,
          amount: parseFloat(expenseForm.amount),
          date: new Date(expenseForm.date).toISOString(),
          notes: expenseForm.notes || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add expense')
      }

      toast({
        title: 'Expense Added',
        description: 'The expense has been added to the spreadsheet',
      })

      setExpenseForm({
        description: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      setAddExpenseOpen(false)
      await fetchData()
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
    })
    setEditExpenseOpen(true)
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense) return

    setUpdatingExpense(true)

    try {
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editExpenseForm.description,
          category: editExpenseForm.category || undefined,
          amount: parseFloat(editExpenseForm.amount),
          date: new Date(editExpenseForm.date).toISOString(),
          notes: editExpenseForm.notes || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update expense')
      }

      toast({
        title: 'Expense Updated',
        description: 'The expense has been updated',
      })

      setEditExpenseOpen(false)
      setEditingExpense(null)
      await fetchData()
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

    try {
      const response = await fetch(`/api/expenses/${deletingExpense.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete expense')
      }

      toast({
        title: 'Expense Deleted',
        description: 'The expense has been removed',
      })

      setDeleteExpenseOpen(false)
      setDeletingExpense(null)
      await fetchData()
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

    try {
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          description: purchaseRequestForm.description,
          category: purchaseRequestForm.category || undefined,
          estimatedAmount: parseFloat(purchaseRequestForm.estimatedAmount),
          justification: purchaseRequestForm.justification || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit request')
      }

      toast({
        title: 'Request Submitted',
        description: 'Your purchase request has been submitted for review',
      })

      setPurchaseRequestForm({
        description: '',
        category: '',
        estimatedAmount: '',
        justification: '',
      })
      setRequestPurchaseOpen(false)
      await fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request',
        variant: 'destructive',
      })
    } finally {
      setSubmittingRequest(false)
    }
  }

  const handleReviewRequestClick = (request: PurchaseRequest) => {
    setReviewingRequest(request)
    setReviewForm({
      status: 'APPROVED',
      reviewNote: '',
      addToExpenses: true,
      actualAmount: request.estimatedAmount.toString(),
      expenseDate: new Date().toISOString().split('T')[0],
      expenseNotes: '',
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

      setReviewRequestOpen(false)
      setReviewingRequest(null)
      await fetchData()
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

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  if (loading) {
    return <div className="p-4">Loading finance data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Total */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Finance</h2>
          <p className="text-muted-foreground">
            Total Expenses: <span className="text-xl font-semibold">${totalExpenses.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setRequestPurchaseOpen(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Request Purchase
          </Button>
          {isCaptain && (
            <Button onClick={() => setAddExpenseOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          )}
        </div>
      </div>

      {/* Purchase Requests Section */}
      {(isCaptain || purchaseRequests.some(req => req.requesterId === currentMembershipId)) && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Requests</CardTitle>
            <CardDescription>
              {isCaptain ? 'Review and approve purchase requests from team members' : 'Your purchase requests'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchaseRequests.length === 0 ? (
                <p className="text-muted-foreground text-sm">No purchase requests</p>
              ) : (
                purchaseRequests
                  .filter(req => isCaptain || req.requesterId === currentMembershipId)
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
                        {request.category && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Category: {request.category}
                          </p>
                        )}
                        <p className="text-sm font-medium">
                          Estimated: ${request.estimatedAmount.toFixed(2)}
                        </p>
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
                      {isCaptain && request.status === 'PENDING' && (
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
          <CardTitle>Expense Spreadsheet</CardTitle>
          <CardDescription>
            {isCaptain ? 'View and manage all team expenses' : 'View team expenses'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  {isCaptain && <th className="text-right p-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={isCaptain ? 5 : 4} className="p-8 text-center text-muted-foreground">
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
                      <td className="p-3">{expense.category || '-'}</td>
                      <td className="p-3 text-right font-medium">${expense.amount.toFixed(2)}</td>
                      {isCaptain && (
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
              <DialogDescription>Add a new expense to the team's finance spreadsheet</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                Submit a purchase request for captain approval
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
    </div>
  )
}

