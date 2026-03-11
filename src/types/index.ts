export type OccupancyStatus = 'Owner Occupied' | 'Tenant Occupied' | 'Vacant';

export interface Tenant {
  name: string;
  phone: string;
  moveInDate: string;
  moveOutDate?: string;
}

export interface OccupancyHistory {
  id: string;
  type: 'Owner' | 'Tenant';
  name: string;
  startDate: string;
  endDate?: string;
}

export type ParkingSlotType = 'Car' | 'Bike' | 'EV' | 'Visitor';
export type ParkingAllocationStatus = 'Available' | 'Allocated' | 'Reserved' | 'Under Maintenance';

export interface ParkingSlot {
  id: string;
  zone: string;
  level: string;
  slotNumber: string;
  slotType: ParkingSlotType;
  status: ParkingAllocationStatus;
  allocatedToFlatId?: string;
  assignedDate?: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  title?: string;
  description?: string;
  date: string;
  mode: string;
  amount: number;
  referenceId: string;
}

export interface PendingDue {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  amount: number;
  status: 'Pending' | 'Overdue';
}

export interface Note {
  id: string;
  text: string;
  timestamp: string;
  author: string;
}

export type TransactionType = 'Income' | 'Expense';

export type IncomeCategory = 'Maintenance' | 'Penalty' | 'Other Income';
export type ExpenseCategory = 'Electricity' | 'Water' | 'Repairs' | 'Salary' | 'Cleaning' | 'Security' | 'Other Expense';

export type TransactionCategory = IncomeCategory | ExpenseCategory;

export interface LedgerTransaction {
  id: string;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  flatNumber?: string;
  flatId?: string;
  occupantName?: string;
}

export type ExpenseEntryCategory = 'Resident Charge' | 'Society Operational Expense';

export interface ExpenseEntry {
  id: string;
  date: string;
  expenseCategory: ExpenseEntryCategory;
  expenseType: string;
  description: string;
  linkedScope: 'Society Level' | 'All Flats' | string[]; // Array of flat IDs for specific flats
  amount: number;
  status: 'Recorded' | 'Billed' | 'Settled';
}

export type NoticeStatus = 'Draft' | 'Published';

export interface Notice {
  id: string;
  title: string;
  description: string;
  status: NoticeStatus;
  createdAt: string;
  publishedAt?: string;
}

export interface Flat {
  id: string;
  flatNumber: string;
  block: string;
  floor: string;
  area: number;
  
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  
  occupancyStatus: OccupancyStatus;
  tenant?: Tenant;
  occupancyHistory: OccupancyHistory[];
  
  payments: Payment[];
  pendingDues: PendingDue[];
  
  notes: Note[];
}
