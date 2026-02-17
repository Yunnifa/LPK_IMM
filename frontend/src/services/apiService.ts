import api from './api';
import type {
  User,
  CreateUserParams,
  UpdateUserParams,
  Department,
  CreateDepartmentParams,
  UpdateDepartmentParams,
  Vehicle,
  CreateVehicleParams,
  UpdateVehicleParams,
  Rental,
  CreateRentalParams,
  VehicleRequest,
  CreateVehicleRequestParams,
  UpdateApprovalParams,
  FormField,
  CreateFormFieldParams,
  UpdateFormFieldParams,
  FormResponse,
  LoginResponse,
} from '../types';

// ========================
// Auth
// ========================
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { username, password });
  // Handle both response formats: { token, user } or { success, data: { token, user } }
  const data = response.data;
  if (data.data) {
    return data.data;
  }
  return data;
};

export const register = async (userData: CreateUserParams): Promise<User> => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// ========================
// Vehicles
// ========================
export const getVehicles = async (): Promise<Vehicle[]> => {
  const response = await api.get('/vehicles');
  return response.data;
};

export const getVehicle = async (id: number): Promise<Vehicle> => {
  const response = await api.get(`/vehicles/${id}`);
  return response.data;
};

export const createVehicle = async (vehicleData: CreateVehicleParams): Promise<Vehicle> => {
  const response = await api.post('/vehicles', vehicleData);
  return response.data;
};

export const updateVehicle = async (id: number, vehicleData: UpdateVehicleParams): Promise<Vehicle> => {
  const response = await api.put(`/vehicles/${id}`, vehicleData);
  return response.data;
};

export const deleteVehicle = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/vehicles/${id}`);
  return response.data;
};

// ========================
// Rentals
// ========================
export const getRentals = async (): Promise<Rental[]> => {
  const response = await api.get('/rentals');
  return response.data;
};

export const getRental = async (id: number): Promise<Rental> => {
  const response = await api.get(`/rentals/${id}`);
  return response.data;
};

export const createRental = async (rentalData: CreateRentalParams): Promise<Rental> => {
  const response = await api.post('/rentals', rentalData);
  return response.data;
};

export const updateRentalStatus = async (id: number, status: string): Promise<Rental> => {
  const response = await api.patch(`/rentals/${id}/status`, { status });
  return response.data;
};

export const cancelRental = async (id: number): Promise<Rental> => {
  const response = await api.patch(`/rentals/${id}/cancel`);
  return response.data;
};

// ========================
// Users
// ========================
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateUser = async (id: number, userData: UpdateUserParams): Promise<User> => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const resetUserPassword = async (id: number, password: string): Promise<{ message: string; user: User }> => {
  const response = await api.put(`/users/${id}/reset-password`, { password });
  return response.data;
};

export const deleteUser = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// ========================
// Departments
// ========================
export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get('/departments');
  return response.data;
};

export const getDepartment = async (id: number): Promise<Department> => {
  const response = await api.get(`/departments/${id}`);
  return response.data;
};

export const createDepartment = async (departmentData: CreateDepartmentParams): Promise<Department> => {
  const response = await api.post('/departments', departmentData);
  return response.data;
};

export const updateDepartment = async (id: number, departmentData: UpdateDepartmentParams): Promise<Department> => {
  const response = await api.put(`/departments/${id}`, departmentData);
  return response.data;
};

export const deleteDepartment = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/departments/${id}`);
  return response.data;
};

// ========================
// Vehicle Requests
// ========================
export const getVehicleRequests = async (): Promise<VehicleRequest[]> => {
  const response = await api.get('/vehicle-requests');
  return response.data;
};

export const getVehicleRequest = async (id: number): Promise<VehicleRequest> => {
  const response = await api.get(`/vehicle-requests/${id}`);
  return response.data;
};

// Search ticket by ticket number (PUBLIC - no auth required)
export const searchTicket = async (ticketNumber: string): Promise<VehicleRequest> => {
  const response = await api.get(`/vehicle-requests/search/${ticketNumber}`);
  return response.data;
};

// Create vehicle request (PUBLIC - no auth required)
export const createVehicleRequest = async (requestData: CreateVehicleRequestParams): Promise<VehicleRequest> => {
  const response = await api.post('/vehicle-requests', requestData);
  return response.data;
};

export const updateVehicleRequestStatus = async (
  id: number,
  status: string,
  rejectionReason?: string
): Promise<VehicleRequest> => {
  const response = await api.patch(`/vehicle-requests/${id}/status`, { status, rejectionReason });
  return response.data;
};

export const updateVehicleRequestApproval = async (
  id: number,
  approvalData: UpdateApprovalParams
): Promise<VehicleRequest> => {
  const response = await api.patch(`/vehicle-requests/${id}/approval`, approvalData);
  return response.data;
};

export const deleteVehicleRequest = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/vehicle-requests/${id}`);
  return response.data;
};

export const cancelVehicleRequest = async (id: number): Promise<VehicleRequest> => {
  const response = await api.patch(`/vehicle-requests/${id}/status`, { status: 'cancelled' });
  return response.data;
};

// ========================
// Form Fields (Kelola Pertanyaan)
// ========================

// Get all active form fields (untuk public form)
export const getFormFields = async (): Promise<FormField[]> => {
  const response = await api.get('/form-fields');
  return response.data;
};

// Get all form fields including inactive (untuk admin)
export const getAllFormFields = async (): Promise<FormField[]> => {
  const response = await api.get('/form-fields/all');
  return response.data;
};

// Get single form field
export const getFormField = async (id: number): Promise<FormField> => {
  const response = await api.get(`/form-fields/${id}`);
  return response.data;
};

// Create form field
export const createFormField = async (fieldData: CreateFormFieldParams): Promise<FormField> => {
  const response = await api.post('/form-fields', fieldData);
  return response.data;
};

// Update form field
export const updateFormField = async (id: number, fieldData: UpdateFormFieldParams): Promise<FormField> => {
  const response = await api.put(`/form-fields/${id}`, fieldData);
  return response.data;
};

// Delete form field (soft delete)
export const deleteFormField = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/form-fields/${id}`);
  return response.data;
};

// Reorder form fields
export const reorderFormFields = async (
  fieldOrders: Array<{ id: number; sortOrder: number }>
): Promise<{ message: string }> => {
  const response = await api.post('/form-fields/reorder', { fieldOrders });
  return response.data;
};

// Get responses for a request
export const getFormResponses = async (requestId: number): Promise<FormResponse[]> => {
  const response = await api.get(`/form-fields/responses/${requestId}`);
  return response.data;
};

// Save responses for a request
export const saveFormResponses = async (
  requestId: number,
  responses: Array<{ fieldId: number; fieldKey: string; value: string }>
): Promise<{ message: string }> => {
  const response = await api.post('/form-fields/responses', { requestId, responses });
  return response.data;
};

// ========================
// Re-export types for convenience
// ========================
export type {
  User,
  CreateUserParams,
  UpdateUserParams,
  Department,
  CreateDepartmentParams,
  UpdateDepartmentParams,
  Vehicle,
  CreateVehicleParams,
  UpdateVehicleParams,
  Rental,
  CreateRentalParams,
  VehicleRequest,
  CreateVehicleRequestParams,
  UpdateApprovalParams,
  FormField,
  CreateFormFieldParams,
  UpdateFormFieldParams,
  FormResponse,
  LoginResponse,
} from '../types';
