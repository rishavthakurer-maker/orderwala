'use client';

import { useState, useEffect } from 'react';
import { Save, Upload, MapPin, DollarSign, Bell, Shield, Truck, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  platformName: 'Order Wala',
  contactEmail: 'support@orderwala.com',
  contactPhone: '+91 9876543210',
  supportHours: '9:00 AM - 9:00 PM',
  baseDeliveryFee: 30,
  freeDeliveryAbove: 299,
  maxDeliveryDistance: 10,
  deliveryPartnerCommission: 80,
  estimatedDeliveryTime: '30-45 mins',
  expressDeliveryFee: 50,
  codEnabled: true,
  onlinePaymentEnabled: true,
  walletPaymentEnabled: true,
  defaultVendorCommission: 12,
  restaurantCommission: 18,
  groceryCommission: 10,
  meatFishCommission: 15,
  primaryCity: 'Patna',
  state: 'Bihar',
  servicePincodes: '800001, 800002, 800003, 800004, 800005, 800006, 800007, 800008, 800009, 800010',
  orderNotifications: true,
  promoNotifications: true,
  smsNotifications: true,
  openingTime: '06:00',
  closingTime: '23:00',
  is24x7: true,
};

export default function SettingsPage() {
  const [saving, setSaving] = useState<string | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = localStorage.getItem('adminSettings');
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch {
        // ignore parse error
      }
    }
  }, []);

  const updateSetting = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (section: string) => {
    setSaving(section);
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    setTimeout(() => {
      setSaving(null);
      toast.success(`${section} settings saved successfully!`);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage platform configurations</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Platform Name"
              value={settings.platformName}
              onChange={(e) => updateSetting('platformName', e.target.value)}
            />
            <Input
              label="Contact Email"
              type="email"
              value={settings.contactEmail}
              onChange={(e) => updateSetting('contactEmail', e.target.value)}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              value={settings.contactPhone}
              onChange={(e) => updateSetting('contactPhone', e.target.value)}
            />
            <Input
              label="Support Hours"
              value={settings.supportHours}
              onChange={(e) => updateSetting('supportHours', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform Logo</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">OW</span>
              </div>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload New Logo
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('General')} disabled={saving !== null}>
              {saving === 'General' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Base Delivery Fee"
              type="number"
              value={settings.baseDeliveryFee}
              onChange={(e) => updateSetting('baseDeliveryFee', Number(e.target.value))}
              leftIcon={<span className="text-gray-500">₹</span>}
            />
            <Input
              label="Free Delivery Above"
              type="number"
              value={settings.freeDeliveryAbove}
              onChange={(e) => updateSetting('freeDeliveryAbove', Number(e.target.value))}
              leftIcon={<span className="text-gray-500">₹</span>}
            />
            <Input
              label="Max Delivery Distance (km)"
              type="number"
              value={settings.maxDeliveryDistance}
              onChange={(e) => updateSetting('maxDeliveryDistance', Number(e.target.value))}
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Delivery Partner Commission"
              type="number"
              value={settings.deliveryPartnerCommission}
              onChange={(e) => updateSetting('deliveryPartnerCommission', Number(e.target.value))}
              leftIcon={<span className="text-gray-500">%</span>}
            />
            <Input
              label="Estimated Delivery Time"
              value={settings.estimatedDeliveryTime}
              onChange={(e) => updateSetting('estimatedDeliveryTime', e.target.value)}
            />
            <Input
              label="Express Delivery Fee"
              type="number"
              value={settings.expressDeliveryFee}
              onChange={(e) => updateSetting('expressDeliveryFee', Number(e.target.value))}
              leftIcon={<span className="text-gray-500">₹</span>}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Delivery')} disabled={saving !== null}>
              {saving === 'Delivery' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium">Cash on Delivery (COD)</p>
                <p className="text-sm text-gray-500">Allow customers to pay cash upon delivery</p>
              </div>
              <input type="checkbox" checked={settings.codEnabled} onChange={(e) => updateSetting('codEnabled', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-green-600" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium">Online Payment (Razorpay)</p>
                <p className="text-sm text-gray-500">Accept UPI, Cards, Net Banking</p>
              </div>
              <input type="checkbox" checked={settings.onlinePaymentEnabled} onChange={(e) => updateSetting('onlinePaymentEnabled', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-green-600" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium">Wallet Payment</p>
                <p className="text-sm text-gray-500">Allow payment from wallet balance</p>
              </div>
              <input type="checkbox" checked={settings.walletPaymentEnabled} onChange={(e) => updateSetting('walletPaymentEnabled', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-green-600" />
            </label>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Payment')} disabled={saving !== null}>
              {saving === 'Payment' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commission Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Default Vendor Commission"
              type="number"
              value={settings.defaultVendorCommission}
              onChange={(e) => updateSetting('defaultVendorCommission', Number(e.target.value))}
              leftIcon={<span className="text-gray-500">%</span>}
            />
            <Input
              label="Restaurant Commission"
              type="number"
              value={settings.restaurantCommission}
              onChange={(e) => updateSetting('restaurantCommission', Number(e.target.value))}
              leftIcon={<span className="text-gray-500">%</span>}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Grocery Commission"
              type="number"
              value={settings.groceryCommission}
              onChange={(e) => updateSetting('groceryCommission', Number(e.target.value))}
              leftIcon={<span className="text-gray-500">%</span>}
            />
            <Input
              label="Meat & Fish Commission"
              type="number"
              value={settings.meatFishCommission}
              onChange={(e) => updateSetting('meatFishCommission', Number(e.target.value))}
              leftIcon={<span className="text-gray-500">%</span>}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Commission')} disabled={saving !== null}>
              {saving === 'Commission' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Area Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service Area
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Primary City"
              value={settings.primaryCity}
              onChange={(e) => updateSetting('primaryCity', e.target.value)}
            />
            <Input
              label="State"
              value={settings.state}
              onChange={(e) => updateSetting('state', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Areas (Pincodes)</label>
            <textarea
              className="w-full h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={settings.servicePincodes}
              onChange={(e) => updateSetting('servicePincodes', e.target.value)}
              placeholder="Enter comma-separated pincodes"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Service Area')} disabled={saving !== null}>
              {saving === 'Service Area' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium">Order Notifications</p>
                <p className="text-sm text-gray-500">Send notifications for order updates</p>
              </div>
              <input type="checkbox" checked={settings.orderNotifications} onChange={(e) => updateSetting('orderNotifications', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-green-600" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium">Promotional Notifications</p>
                <p className="text-sm text-gray-500">Send promotional offers to customers</p>
              </div>
              <input type="checkbox" checked={settings.promoNotifications} onChange={(e) => updateSetting('promoNotifications', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-green-600" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-gray-500">Send SMS for important updates</p>
              </div>
              <input type="checkbox" checked={settings.smsNotifications} onChange={(e) => updateSetting('smsNotifications', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-green-600" />
            </label>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Notification')} disabled={saving !== null}>
              {saving === 'Notification' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Operation Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operation Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Opening Time"
              type="time"
              value={settings.openingTime}
              onChange={(e) => updateSetting('openingTime', e.target.value)}
            />
            <Input
              label="Closing Time"
              type="time"
              value={settings.closingTime}
              onChange={(e) => updateSetting('closingTime', e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.is24x7} onChange={(e) => updateSetting('is24x7', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600" />
            <span className="text-sm text-gray-700">24/7 Operations</span>
          </label>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('Operation Hours')} disabled={saving !== null}>
              {saving === 'Operation Hours' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
