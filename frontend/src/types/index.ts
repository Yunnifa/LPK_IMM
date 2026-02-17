// ========================
// Shared Types for LPK-IMM Frontend
// ========================

// ========================
// Department
// ========================
export interface Department {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
}

export interface CreateDepartmentParams {
  name: string;
  description?: string | null;
}

export interface UpdateDepartmentParams {
  name?: string;
  description?: string | null;
}

// ========================
// User
// ========================
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string | null;
  birthdate?: string | null;
  role: 'admin' | 'superadmin' | 'user' | 'head_departemen' | 'ga_transport' | 'general_affair' | 'general_service';
  departmentId?: number | null;
  departmentName?: string;
  createdAt?: string;
}

export interface CreateUserParams {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string | null;
  birthdate?: string | null;
  role?: string;
  departmentId?: number | null;
}

export interface UpdateUserParams {
  username?: string;
  password?: string;
  fullName?: string;
  email?: string;
  phone?: string | null;
  birthdate?: string | null;
  role?: string;
  departmentId?: number | null;
}

// ========================
// Vehicle
// ========================
export interface Vehicle {
  id: number;
  type: string;
  brand: string;
  model: string;
  plateNumber: string;
  year: number;
  status: 'available' | 'rented' | 'maintenance';
  dailyRate: number;
  imageUrl?: string | null;
  createdAt?: string;
}

export interface CreateVehicleParams {
  type: string;
  brand: string;
  model: string;
  plateNumber: string;
  year: number;
  status?: string;
  dailyRate: number;
  imageUrl?: string | null;
}

export interface UpdateVehicleParams {
  type?: string;
  brand?: string;
  model?: string;
  plateNumber?: string;
  year?: number;
  status?: string;
  dailyRate?: number;
  imageUrl?: string | null;
}

// ========================
// Rental
// ========================
export interface Rental {
  id: number;
  userId: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt?: string;
}

export interface CreateRentalParams {
  vehicleId: number;
  startDate: string;
  endDate: string;
}

// ========================
// Vehicle Request
// ========================
export interface VehicleRequest {
  id: number;
  ticketNumber: string;
  serviceType: 'layanan_pool' | 'izin_khusus';
  name: string;
  nik: string;
  email: string;
  departmentId: number;
  departmentName?: string;
  vehiclePurpose: string;
  purposeReason: string;
  locationType: 'desa_binaan' | 'non_desa_binaan';
  startDate: string;
  endDate: string;
  status: string;
  approval1: 'pending' | 'approved' | 'rejected';
  approval1By?: number | null;
  approval1At?: string | null;
  approval1Notes?: string | null;
  approval2: 'pending' | 'approved' | 'rejected';
  approval2By?: number | null;
  approval2At?: string | null;
  approval2Notes?: string | null;
  approval3: 'pending' | 'approved' | 'rejected';
  approval3By?: number | null;
  approval3At?: string | null;
  approval3Notes?: string | null;
  approval4: 'pending' | 'approved' | 'rejected';
  approval4By?: number | null;
  approval4At?: string | null;
  approval4Notes?: string | null;
  approvedBy?: number | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface CreateVehicleRequestParams {
  serviceType: string;
  name: string;
  nik: string;
  email: string;
  departmentId: number;
  vehiclePurpose: string;
  purposeReason: string;
  locationType: string;
  startDate: string;
  endDate: string;
  formResponses?: Array<{
    fieldId: number;
    fieldKey: string;
    value: string;
  }>;
}

export interface UpdateApprovalParams {
  level: 1 | 2 | 3 | 4;
  status: 'approved' | 'rejected';
  notes?: string;
}

// ========================
// Form Field
// ========================
export interface FormFieldOption {
  id?: number;
  value: string;
  label: string;
  sortOrder: number;
  isActive?: boolean;
}

export interface FormField {
  id: number;
  fieldKey: string;
  label: string;
  fieldType: 'text' | 'date' | 'select' | 'radio' | 'textarea' | 'checkbox' | 'datetime';
  groupName: string | null;
  placeholder: string | null;
  helpText: string | null;
  validationRules?: object | null;
  defaultValue?: string | null;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
  isSystemField: boolean;
  options: FormFieldOption[];
}

export interface CreateFormFieldParams {
  fieldKey: string;
  label: string;
  fieldType: string;
  groupName?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  validationRules?: object | null;
  defaultValue?: string | null;
  sortOrder?: number;
  isRequired?: boolean;
  isSystemField?: boolean;
  options?: Array<{
    value: string;
    label: string;
    sortOrder?: number;
  }>;
}

export interface UpdateFormFieldParams {
  fieldKey?: string;
  label?: string;
  fieldType?: string;
  groupName?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  validationRules?: object | null;
  defaultValue?: string | null;
  sortOrder?: number;
  isRequired?: boolean;
  isActive?: boolean;
  options?: Array<{
    id?: number;
    value: string;
    label: string;
    sortOrder?: number;
    isActive?: boolean;
  }>;
}

export interface FormResponse {
  id: number;
  requestId: number;
  fieldId: number;
  fieldKey: string;
  value: string;
}

export interface SaveFormResponsesParams {
  requestId: number;
  responses: Array<{
    fieldId: number;
    fieldKey: string;
    value: string;
  }>;
}

// ========================
// Auth
// ========================
export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginParams {
  username: string;
  password: string;
}

// ========================
// API Response Types
// ========================
export interface ApiError {
  error: string;
  message?: string;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}
