import React from 'react';
import { 
  Home, 
  Heart, 
  Calendar, 
  Package, 
  ShoppingCart, 
  LogOut,
  User,
  ChefHat
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeSection, 
  onSectionChange 
}) => {
  const { signOut, user, profile } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { id: 'recipes', label: 'Recipes', icon: Home },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'meal-plan', label: 'Meal Plan', icon: Calendar },
    { id: 'pantry', label: 'Pantry', icon: Package },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
  ];

  return (
    <nav className="nav-container">
      <div className="nav-content">
        <div className="nav-header">
          {/* Logo */}
          <div className="nav-logo">
            <div className="nav-brand">
              <ChefHat className="text-accent" size={32} />
              <h1 className="nav-title">TastyTray</h1>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="nav-menu">
            <div className="nav-items">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`space-items ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="space-items space-x-4">
            <div className="space-items text-small text-muted">
              <User size={16} />
              <span>{profile?.name || user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="space-items nav-item text-muted hover:text-danger hover:bg-gray-50"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="nav-mobile">
          <div className="nav-mobile-menu">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`nav-mobile-item ${isActive ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
