import CustomerLayout from '../../layouts/CustomerLayout.jsx';
import ItemPageContent from '../ItemPage.jsx';

export default function ItemPage() {
  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <ItemPageContent />
      </div>
    </CustomerLayout>
  );
}
