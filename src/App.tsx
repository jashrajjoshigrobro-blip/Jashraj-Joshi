/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FlatDirectory from './pages/FlatDirectory';
import FlatProfile from './pages/FlatProfile';
import Ledger from './pages/Ledger';
import ExpenseManagement from './pages/ExpenseManagement';
import NoticeManagement from './pages/NoticeManagement';
import ParkingManagement from './pages/ParkingManagement';
import MyProfile from './pages/MyProfile';
import { FlatsProvider } from './context/FlatsContext';
import { LedgerProvider } from './context/LedgerContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { NoticeProvider } from './context/NoticeContext';
import { ParkingProvider } from './context/ParkingContext';
import { ProfileProvider } from './context/ProfileContext';

export default function App() {
  return (
    <ProfileProvider>
      <FlatsProvider>
        <ExpenseProvider>
          <LedgerProvider>
            <NoticeProvider>
              <ParkingProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="flats" element={<FlatDirectory />} />
                      <Route path="flats/:id" element={<FlatProfile />} />
                      <Route path="ledger" element={<Ledger />} />
                      <Route path="expenses" element={<ExpenseManagement />} />
                      <Route path="notices" element={<NoticeManagement />} />
                      <Route path="parking" element={<ParkingManagement />} />
                      {/* Placeholders for other routes */}
                      <Route path="residents" element={<div className="p-6 text-gray-500">Residents Module (Coming Soon)</div>} />
                      <Route path="reports" element={<div className="p-6 text-gray-500">Reports Module (Coming Soon)</div>} />
                      <Route path="settings" element={<MyProfile />} />
                    </Route>
                  </Routes>
                </BrowserRouter>
              </ParkingProvider>
            </NoticeProvider>
          </LedgerProvider>
        </ExpenseProvider>
      </FlatsProvider>
    </ProfileProvider>
  );
}
