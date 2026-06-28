import { useAuth } from '../../contexts/AuthContext.jsx';
import StaffLoginGate from '../../components/auth/StaffLoginGate.jsx';
import StaffLayout from '../../layouts/StaffLayout.jsx';
import KitchenPageContent from '../KitchenPage.jsx';

export default function KitchenPage() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated || (role && role !== 'Kitchen')) {
    return <StaffLoginGate role="Kitchen" title="Kitchen Staff Access" />;
  }

  return (
    <StaffLayout title="Kitchen Display">
      <div className="p-4 sm:p-6 lg:p-8">
        <KitchenPageContent />
      </div>
    </StaffLayout>
  );
}

