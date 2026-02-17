from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    # Avoiding circular imports by not including full device details here yet
    # or using ForwardRef if needed
    
    model_config = ConfigDict(from_attributes=True)
