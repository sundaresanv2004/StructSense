from fastapi import APIRouter, HTTPException
from ...schemas.account import AccountCreate, AccountResponse
from ...schemas.transaction import Transaction
from ...db import accounts, transaction_history

router = APIRouter()

@router.post("", response_model=AccountResponse)
def create_account(account: AccountCreate):
    account_id = len(accounts) + 1
    new_account = {
        "id": account_id,
        "name": account.name,
        "balance": account.initial_balance
    }
    accounts[account_id] = new_account
    transaction_history[account_id] = []
    return new_account

@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: int):
    if account_id not in accounts:
        raise HTTPException(status_code=404, detail="Account not found")
    return accounts[account_id]

@router.post("/{account_id}/deposit", response_model=AccountResponse)
def deposit(account_id: int, transaction: Transaction):
    if account_id not in accounts:
        raise HTTPException(status_code=404, detail="Account not found")
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")
    
    accounts[account_id]["balance"] += transaction.amount
    transaction_history[account_id].append({"type": "deposit", "amount": transaction.amount})
    return accounts[account_id]

@router.post("/{account_id}/withdraw", response_model=AccountResponse)
def withdraw(account_id: int, transaction: Transaction):
    if account_id not in accounts:
        raise HTTPException(status_code=404, detail="Account not found")
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")
    if accounts[account_id]["balance"] < transaction.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    accounts[account_id]["balance"] -= transaction.amount
    transaction_history[account_id].append({"type": "withdraw", "amount": transaction.amount})
    return accounts[account_id]
