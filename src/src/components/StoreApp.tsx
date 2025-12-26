import { useState } from 'react';
import { Header } from './Header';
import { PurchaseForm } from './PurchaseForm';
import { MerchantDashboard } from './MerchantDashboard';
import '../styles/StoreApp.css';

export function StoreApp() {
  const [activeTab, setActiveTab] = useState<'buy' | 'merchant'>('buy');

  return (
    <div className="store-app">
      <Header />
      <main className="main-content">
        <div className="tab-navigation">
          <nav className="tab-nav">
            <button
              onClick={() => setActiveTab('buy')}
              className={`tab-button ${activeTab === 'buy' ? 'active' : 'inactive'}`}
            >
              New Purchase
            </button>
            <button
              onClick={() => setActiveTab('merchant')}
              className={`tab-button ${activeTab === 'merchant' ? 'active' : 'inactive'}`}
            >
              Merchant Dashboard
            </button>
          </nav>
        </div>

        {activeTab === 'buy' && <PurchaseForm />}
        {activeTab === 'merchant' && <MerchantDashboard />}
      </main>
    </div>
  );
}

