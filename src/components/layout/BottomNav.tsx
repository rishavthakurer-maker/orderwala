'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User, Heart } from 'lucide-react';
import { useCartStore } from '@/store';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Cart', href: '/cart', icon: ShoppingCart, badge: cartCount },
    { name: 'Favorites', href: '/favorites', icon: Heart },
    { name: 'Account', href: '/account', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="mx-3 mb-3 rounded-2xl border border-gray-200/60 bg-white/90 backdrop-blur-xl shadow-elegant">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200',
                  isActive 
                    ? 'text-orange-600' 
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <div className="relative">
                  <div className={cn(
                    'p-1.5 rounded-xl transition-all duration-200',
                    isActive && 'bg-orange-100'
                  )}>
                    <Icon className={cn('h-5 w-5 transition-all duration-200', isActive && 'scale-110')} />
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[9px] font-bold text-white shadow-lg shadow-orange-200 ring-2 ring-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-semibold transition-all duration-200',
                  isActive ? 'text-orange-700' : ''
                )}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
