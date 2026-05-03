import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Auth
  login: (username: string, password: string) =>
    ipcRenderer.invoke('auth:login', username, password),
  changePassword: (userId: number, currentPassword: string, newPassword: string) =>
    ipcRenderer.invoke('auth:changePassword', userId, currentPassword, newPassword),

  // Products
  getProducts: () => ipcRenderer.invoke('products:getAll'),
  getProduct: (id: number) => ipcRenderer.invoke('products:getById', id),
  createProduct: (data: Record<string, unknown>) => ipcRenderer.invoke('products:create', data),
  updateProduct: (id: number, data: Record<string, unknown>) =>
    ipcRenderer.invoke('products:update', id, data),
  deleteProduct: (id: number) => ipcRenderer.invoke('products:delete', id),
  getLowStock: () => ipcRenderer.invoke('products:getLowStock'),

  // Inventory
  getMovements: (filters?: Record<string, unknown>) =>
    ipcRenderer.invoke('inventory:getMovements', filters),
  addMovement: (data: Record<string, unknown>) => ipcRenderer.invoke('inventory:addMovement', data),
  getStockLevels: () => ipcRenderer.invoke('inventory:getStockLevels'),

  // Sales
  getSales: (filters?: Record<string, unknown>) => ipcRenderer.invoke('sales:getAll', filters),
  getSale: (id: number) => ipcRenderer.invoke('sales:getById', id),
  createSale: (data: Record<string, unknown>) => ipcRenderer.invoke('sales:create', data),
  getSalesStats: () => ipcRenderer.invoke('sales:getStats'),

  // Customers
  getCustomers: (type?: string) => ipcRenderer.invoke('customers:getAll', type),
  getCustomer: (id: number) => ipcRenderer.invoke('customers:getById', id),
  createCustomer: (data: Record<string, unknown>) => ipcRenderer.invoke('customers:create', data),
  updateCustomer: (id: number, data: Record<string, unknown>) =>
    ipcRenderer.invoke('customers:update', id, data),
  deleteCustomer: (id: number) => ipcRenderer.invoke('customers:delete', id),

  // Invoices
  getInvoices: (filters?: Record<string, unknown>) =>
    ipcRenderer.invoke('invoices:getAll', filters),
  getInvoice: (id: number) => ipcRenderer.invoke('invoices:getById', id),
  createInvoice: (data: Record<string, unknown>) => ipcRenderer.invoke('invoices:create', data),
  updateInvoiceStatus: (id: number, status: string) =>
    ipcRenderer.invoke('invoices:updateStatus', id, status),
  deleteInvoice: (id: number) => ipcRenderer.invoke('invoices:delete', id),

  // Reports
  getSalesReport: (period: string) => ipcRenderer.invoke('reports:salesReport', period),
  getInventoryValuation: () => ipcRenderer.invoke('reports:inventoryValuation'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  updateSetting: (key: string, value: string) => ipcRenderer.invoke('settings:update', key, value),
  updateSettings: (settings: Record<string, string>) =>
    ipcRenderer.invoke('settings:updateMany', settings),
  backup: () => ipcRenderer.invoke('settings:backup'),
  restore: () => ipcRenderer.invoke('settings:restore'),
  selectLogo: () => ipcRenderer.invoke('settings:selectLogo')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
