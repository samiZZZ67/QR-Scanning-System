import { useAuth } from '../../contexts/AuthContext.jsx';
import StaffLoginGate from '../../components/auth/StaffLoginGate.jsx';
import StaffLayout from '../../layouts/StaffLayout.jsx';
import WaiterPageContent from '../WaiterPage.jsx';

export default function WaiterPage() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated || (role && role !== 'Waiter')) {
    return <StaffLoginGate role="Waiter" title="Waiter Staff Access" />;
  }

  return (
    <StaffLayout title="Waiter Panel">
      <div className="p-4 sm:p-6 lg:p-8">
        <WaiterPageContent />
      </div>
    </StaffLayout>
  );
}

