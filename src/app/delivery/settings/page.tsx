'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Phone, Mail, MapPin, Car, FileText, Bell, CreditCard, Shield, Save, Camera, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';
import toast from 'react-hot-toast';

interface ProfileData {
  name: string;
  phone: string;
  email: string;
  address: string;
  joinedDate: string;
  stats: {
    avgRating: number;
    totalDeliveries: number;
  };
  vehicle: {
    type: string;
    brand: string;
    model: string;
    numberPlate: string;
    color: string;
  };
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    upiId: string;
  };
  documents: { name: string; status: string; uploadedAt: string }[];
}

export default function DeliverySettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [vehicleData, setVehicleData] = useState({ type: 'bike', brand: '', model: '', numberPlate: '', color: '' });
  const [bankData, setBankData] = useState({ accountName: '', accountNumber: '', ifsc: '', bankName: '', upiId: '' });

  const [notifications, setNotifications] = useState({
    newOrders: true, orderUpdates: true, earnings: true, promotions: false, sound: true, vibration: true,
  });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery/profile');
      const json = await res.json();
      if (json.success) {
        const p = json.data;
        setProfile(p);
        setFormData({ name: p.name || '', phone: p.phone || '', email: p.email || '', address: p.address || '' });
        setVehicleData(p.vehicle || { type: 'bike', brand: '', model: '', numberPlate: '', color: '' });
        setBankData(p.bankDetails || { accountName: '', accountNumber: '', ifsc: '', bankName: '', upiId: '' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/delivery/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        fetchProfile();
      } else {
        toast.error(json.error || 'Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVehicle = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/delivery/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle: vehicleData }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Vehicle info updated');
        fetchProfile();
      } else {
        toast.error(json.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save vehicle info');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBank = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/delivery/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankDetails: bankData }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Bank details updated');
        fetchProfile();
      } else {
        toast.error(json.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'vehicle', label: 'Vehicle', icon: Car },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'bank', label: 'Bank Details', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const initials = (profile?.name || 'DL').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your profile and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <Card className="lg:w-64 shrink-0">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <section.icon className="h-5 w-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <Button
                  variant={isEditing ? 'default' : 'outline'}
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : isEditing ? <Save className="h-4 w-4 mr-2" /> : null}
                  {isEditing ? 'Save' : 'Edit'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center relative">
                    <span className="text-3xl font-bold text-blue-600">{initials}</span>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white" aria-label="Change profile photo">
                        <Camera className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{profile?.name || 'Delivery Partner'}</p>
                    <p className="text-gray-500">Member since {profile?.joinedDate || 'N/A'}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <Badge variant="success">⭐ {profile?.stats?.avgRating?.toFixed(1) || '0.0'} Rating</Badge>
                      <span className="text-sm text-gray-500">{profile?.stats?.totalDeliveries || 0} Deliveries</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} disabled={!isEditing} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vehicle Section */}
          {activeSection === 'vehicle' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="vehicle-type">Vehicle Type</label>
                    <select
                      id="vehicle-type"
                      className="w-full px-3 py-2 border rounded-lg"
                      value={vehicleData.type}
                      onChange={(e) => setVehicleData({ ...vehicleData, type: e.target.value })}
                    >
                      <option value="bike">Two Wheeler (Bike/Scooter)</option>
                      <option value="car">Car</option>
                      <option value="bicycle">Bicycle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <Input value={vehicleData.brand} onChange={(e) => setVehicleData({ ...vehicleData, brand: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <Input value={vehicleData.model} onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <Input value={vehicleData.numberPlate} onChange={(e) => setVehicleData({ ...vehicleData, numberPlate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <Input value={vehicleData.color} onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSaveVehicle} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Vehicle Info
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Documents Section */}
          {activeSection === 'documents' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(profile?.documents && profile.documents.length > 0) ? profile.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">Uploaded: {doc.uploadedAt}</p>
                        </div>
                      </div>
                      <Badge variant={doc.status === 'verified' ? 'success' : 'warning'}>
                        {doc.status === 'verified' ? '✓ Verified' : '⏳ Pending'}
                      </Badge>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">No documents uploaded yet</div>
                  )}
                </div>

                <div className="mt-6 p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 mb-2">Upload additional documents</p>
                  <Button variant="outline">Choose File</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Details Section */}
          {activeSection === 'bank' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700">Your earnings will be transferred to the account below</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                    <Input value={bankData.accountName} onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <Input value={bankData.accountNumber} onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <Input value={bankData.ifsc} onChange={(e) => setBankData({ ...bankData, ifsc: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <Input value={bankData.bankName} onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })} />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">UPI Details</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                    <Input value={bankData.upiId} onChange={(e) => setBankData({ ...bankData, upiId: e.target.value })} />
                  </div>
                </div>

                <Button onClick={handleSaveBank} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Bank Details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[
                    { key: 'newOrders', label: 'New Order Alerts', description: 'Get notified when new orders are available nearby' },
                    { key: 'orderUpdates', label: 'Order Updates', description: 'Updates about order status changes' },
                    { key: 'earnings', label: 'Earnings Updates', description: 'Notifications about your earnings and payments' },
                    { key: 'promotions', label: 'Promotions & Offers', description: 'Special bonuses and incentive announcements' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[item.key as keyof typeof notifications]}
                        onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                        className="h-5 w-5 text-blue-600 rounded"
                      />
                    </label>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Sound & Vibration</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span>Sound</span>
                      <input
                        type="checkbox"
                        checked={notifications.sound}
                        onChange={(e) => setNotifications({ ...notifications, sound: e.target.checked })}
                        className="h-5 w-5 text-blue-600 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Vibration</span>
                      <input
                        type="checkbox"
                        checked={notifications.vibration}
                        onChange={(e) => setNotifications({ ...notifications, vibration: e.target.checked })}
                        className="h-5 w-5 text-blue-600 rounded"
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Change Password</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <Input type="password" placeholder="Enter current password" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <Input type="password" placeholder="Enter new password" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <Input type="password" placeholder="Confirm new password" />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3 text-red-600">Danger Zone</h4>
                  <div className="p-4 border border-red-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                      Once you delete your account, you will lose all data and cannot recover it.
                    </p>
                    <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
