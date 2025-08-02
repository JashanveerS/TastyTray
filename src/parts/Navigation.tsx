import React, { useState } from 'react';
import { 
  Home, 
  Heart, 
  Calendar, 
  Package, 
  ShoppingCart, 
  LogOut,
  User,
  ChefHat,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileCard } from './ProfileCard';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeSection, 
  onSectionChange 
}) => {
  const { signOut, user, profile } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setMobileMenuOpen(false); // Close mobile menu when navigating
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
              <h1 className="nav-title text-lg sm:text-2xl">TastyTray</h1>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <div className="nav-menu">
            <div className="nav-items">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`space-items ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                  >
                    <Icon size={18} />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex space-items space-x-4">
            <button
              onClick={() => setProfileOpen(true)}
              className="space-items text-small text-muted hover:text-gray-600 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
            >
              <User size={16} />
              <span className="hidden lg:inline">{profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}</span>
            </button>

            <button
              onClick={handleSignOut}
              className="space-items nav-item text-muted hover:text-danger hover:bg-gray-50"
            >
              <LogOut size={16} />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-orange-600 hover:bg-gray-50 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              
              {/* Mobile User Options */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <button
                  onClick={() => {
                    setProfileOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-orange-600 hover:bg-gray-50 transition-colors"
                >
                  <User size={20} className="mr-3" />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50 transition-colors"
                >
                  <LogOut size={20} className="mr-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Profile Card Modal */}
      <ProfileCard isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </nav>
  );
};
