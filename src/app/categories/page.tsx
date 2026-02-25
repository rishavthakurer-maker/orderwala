'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, Skeleton } from '@/components/ui';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  icon?: string;
  description?: string;
}

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories?isActive=true');
        const data = await res.json();
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Fallback categories if API returns empty
  const fallbackCategories = [
    { _id: '1', name: 'Vegetables', slug: 'vegetables', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', icon: '🥬', description: 'Fresh vegetables from local farms' },
    { _id: '2', name: 'Fruits', slug: 'fruits', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400', icon: '🍎', description: 'Fresh seasonal fruits' },
    { _id: '3', name: 'Meat & Fish', slug: 'meat-fish', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400', icon: '🥩', description: 'Fresh meat and seafood' },
    { _id: '4', name: 'Dairy & Eggs', slug: 'dairy-eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400', icon: '🥚', description: 'Milk, cheese, eggs and more' },
    { _id: '5', name: 'Groceries', slug: 'groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', icon: '🛒', description: 'Daily essentials and staples' },
    { _id: '6', name: 'Snacks', slug: 'snacks', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400', icon: '🍿', description: 'Chips, namkeen and more' },
    { _id: '7', name: 'Beverages', slug: 'beverages', image: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400', icon: '🥤', description: 'Drinks and juices' },
  ];

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-gray-500 hover:text-primary-600">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Categories</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Categories</h1>
          <p className="text-gray-600">Browse our wide range of product categories</p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayCategories.map((category) => (
              <Link key={category._id} href={`/category/${category.slug}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full bg-linear-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                          <span className="text-6xl">{category.icon || '📦'}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="text-3xl">{category.icon || '📦'}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
