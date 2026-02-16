from pydantic import BaseModel

class AccountCreate(BaseModel):
    name: str
    initial_balance: float = 0.0

class AccountResponse(BaseModel):
    id: int
    name: str
    balance: float
