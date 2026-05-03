import { ElectronAPI } from '@electron-toolkit/preload'

interface AksilAPI {
  login: (
    username: string,
    password: string
  ) => Promise<{
    success: boolean
    user?: { id: number; username: string; fullName: string; role: string }
    error?: string
  }>
  changePassword: (
    userId: number,
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>
  getProducts: () => Promise<{ success: boolean; data?: unknown[]; error?: string }>
  getProduct: (id: number) => Promise<{ success: boolean; data?: unknown; error?: string }>
  createProduct: (
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>
  updateProduct: (
    id: number,
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>
  deleteProduct: (id: number) => Promise<{ success: boolean; error?: string }>
  getLowStock: () => Promise<{ success: boolean; data?: unknown[]; error?: string }>
  getMovements: (
    filters?: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown[]; error?: string }>
  addMovement: (
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>
  getStockLevels: () => Promise<{ success: boolean; data?: unknown[]; error?: string }>
  getSales: (
    filters?: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown[]; error?: string }>
  getSale: (id: number) => Promise<{ success: boolean; data?: unknown; error?: string }>
  createSale: (
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>
  getSalesStats: () => Promise<{ success: boolean; data?: unknown; error?: string }>
  getCustomers: (type?: string) => Promise<{ success: boolean; data?: unknown[]; error?: string }>
  getCustomer: (id: number) => Promise<{ success: boolean; data?: unknown; error?: string }>
  createCustomer: (
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>
  updateCustomer: (
    id: number,
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>
  deleteCustomer: (id: number) => Promise<{ success: boolean; error?: string }>
  getInvoices: (
    filters?: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown[]; error?: string }>
  getInvoice: (id: number) => Promise<{ success: boolean; data?: unknown; error?: string }>
  createInvoice: (
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>
  updateInvoiceStatus: (
    id: number,
    status: string
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>
  deleteInvoice: (id: number) => Promise<{ success: boolean; error?: string }>
  getSalesReport: (period: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
  getInventoryValuation: () => Promise<{ success: boolean; data?: unknown; error?: string }>
  getSettings: () => Promise<{ success: boolean; data?: Record<string, string>; error?: string }>
  updateSetting: (key: string, value: string) => Promise<{ success: boolean; error?: string }>
  updateSettings: (
    settings: Record<string, string>
  ) => Promise<{ success: boolean; error?: string }>
  backup: () => Promise<{ success: boolean; data?: { path: string }; error?: string }>
  restore: () => Promise<{ success: boolean; data?: { message: string }; error?: string }>
  selectLogo: () => Promise<{ success: boolean; data?: { path: string }; error?: string }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AksilAPI
  }
}
