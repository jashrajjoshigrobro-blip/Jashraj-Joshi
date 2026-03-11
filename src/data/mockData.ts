import { Flat } from '../types';

export const mockFlats: Flat[] = [
  {
    id: '1',
    flatNumber: 'A-101',
    block: 'A',
    floor: '1',
    area: 1200,
    ownerName: 'Rahul Sharma',
    ownerPhone: '9876543210',
    ownerEmail: 'rahul.s@example.com',
    occupancyStatus: 'Owner Occupied',
    occupancyHistory: [
      {
        id: 'h1',
        type: 'Owner',
        name: 'Rahul Sharma',
        startDate: '2022-01-15',
      }
    ],
    payments: [
      { id: 'pay1', receiptNumber: 'REC-001', title: 'Maintenance Oct', description: 'Monthly Maintenance', date: '2023-10-01', mode: 'UPI', amount: 5000, referenceId: 'UPI123456' }
    ],
    pendingDues: [
      { id: 'due1', title: 'Maintenance Nov', description: 'Monthly Maintenance', dueDate: '2023-11-05', amount: 5000, status: 'Pending' }
    ],
    notes: [
      { id: 'n1', text: 'Requested extra parking slot.', timestamp: '2023-10-15T10:00:00Z', author: 'Admin' }
    ]
  },
  {
    id: '2',
    flatNumber: 'B-205',
    block: 'B',
    floor: '2',
    area: 1500,
    ownerName: 'Priya Desai',
    ownerPhone: '9123456780',
    ownerEmail: 'priya.d@example.com',
    occupancyStatus: 'Tenant Occupied',
    tenant: {
      name: 'Amit Kumar',
      phone: '9988776655',
      moveInDate: '2023-05-01'
    },
    occupancyHistory: [
      {
        id: 'h2',
        type: 'Owner',
        name: 'Priya Desai',
        startDate: '2021-06-10',
        endDate: '2023-04-30'
      },
      {
        id: 'h3',
        type: 'Tenant',
        name: 'Amit Kumar',
        startDate: '2023-05-01'
      }
    ],
    payments: [
      { id: 'pay2', receiptNumber: 'REC-002', title: 'Maintenance Aug', description: 'Monthly Maintenance', date: '2023-09-05', mode: 'Bank Transfer', amount: 6000, referenceId: 'NEFT9876' }
    ],
    pendingDues: [],
    notes: []
  },
  {
    id: '3',
    flatNumber: 'C-304',
    block: 'C',
    floor: '3',
    area: 1100,
    ownerName: 'Vikram Singh',
    ownerPhone: '9001122334',
    ownerEmail: 'vikram.s@example.com',
    occupancyStatus: 'Vacant',
    occupancyHistory: [
      {
        id: 'h4',
        type: 'Owner',
        name: 'Vikram Singh',
        startDate: '2020-02-20',
        endDate: '2023-08-15'
      }
    ],
    payments: [],
    pendingDues: [
      { id: 'due2', title: 'Maintenance Sep', description: 'Monthly Maintenance', dueDate: '2023-09-05', amount: 4500, status: 'Overdue' },
      { id: 'due3', title: 'Maintenance Oct', description: 'Monthly Maintenance', dueDate: '2023-10-05', amount: 4500, status: 'Overdue' }
    ],
    notes: [
      { id: 'n2', text: 'Owner moved out, flat is up for rent.', timestamp: '2023-08-16T09:30:00Z', author: 'Admin' }
    ]
  }
];
