'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bike, Car, FileText, CreditCard, MapPin, CheckCircle, ChevronRight, ChevronLeft,
  Loader2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';
import toast from 'react-hot-toast';

interface StepStatus {
  vehicle: boolean;
  documents: boolean;
  bankDetails: boolean;
  workingArea: boolean;
}

const STEPS = [
  { id: 'vehicle', label: 'Vehicle Info', icon: Car, description: 'Add your vehicle details' },
  { id: 'documents', label: 'Documents', icon: FileText, description: 'Submit ID documents' },
  { id: 'bankDetails', label: 'Bank Details', icon: CreditCard, description: 'Add payment info' },
  { id: 'workingArea', label: 'Working Area', icon: MapPin, description: 'Set delivery zone' },
];

export default function DeliveryOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    vehicle: false, documents: false, bankDetails: false, workingArea: false,
  });
  const [isComplete, setIsComplete] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Vehicle
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  // Documents
  const [docType, setDocType] = useState('aadhaar');
  const [docNumber, setDocNumber] = useState('');
  const [savedDocs, setSavedDocs] = useState<{ type: string; number: string; status: string }[]>([]);

  // Bank
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');

  // Working Area
  const [areaLat, setAreaLat] = useState(0);
  const [areaLng, setAreaLng] = useState(0);
  const [areaAddress, setAreaAddress] = useState('');
  const [areaRadius, setAreaRadius] = useState(5);
  const [locating, setLocating] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery/onboarding');
      const json = await res.json();
      if (json.success) {
        setStepStatus(json.data.steps);
        setIsComplete(json.data.isComplete);
        setSubmitted(json.data.onboardingSubmitted);
      }
    } catch {
      console.error('Failed to fetch onboarding status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load existing data from profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery/profile');
      const json = await res.json();
      if (json.success) {
        const p = json.data;
        if (p.vehicle) {
          setVehicleType(p.vehicle.type || 'bike');
          setVehicleBrand(p.vehicle.brand || '');
          setVehicleModel(p.vehicle.model || '');
          setVehiclePlate(p.vehicle.numberPlate || '');
          setVehicleColor(p.vehicle.color || '');
        }
        if (p.bankDetails) {
          setAccountName(p.bankDetails.accountName || '');
          setAccountNumber(p.bankDetails.accountNumber || '');
          setIfsc(p.bankDetails.ifsc || '');
          setBankName(p.bankDetails.bankName || '');
          setUpiId(p.bankDetails.upiId || '');
        }
        if (p.documents) setSavedDocs(p.documents);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchProfile();
  }, [fetchStatus, fetchProfile]);

  const saveStep = async (step: string, data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/delivery/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${STEPS.find(s => s.id === step)?.label || 'Step'} saved!`);
        fetchStatus();
        return true;
      } else {
        toast.error(json.error || 'Failed to save');
        return false;
      }
    } catch {
      toast.error('Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVehicle = async () => {
    if (!vehiclePlate) { toast.error('Registration number is required'); return; }
    const ok = await saveStep('vehicle', {
      type: vehicleType, brand: vehicleBrand, model: vehicleModel,
      numberPlate: vehiclePlate, color: vehicleColor,
    });
    if (ok) setCurrentStep(1);
  };

  const handleSaveDocument = async () => {
    if (!docNumber) { toast.error('Document number is required'); return; }
    const ok = await saveStep('documents', { documentType: docType, documentNumber: docNumber });
    if (ok) {
      setSavedDocs(prev => {
        const idx = prev.findIndex(d => d.type === docType);
        const entry = { type: docType, number: docNumber, status: 'pending' };
        if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
        return [...prev, entry];
      });
      setDocNumber('');
    }
  };

  const handleSaveBank = async () => {
    if (!accountNumber || !ifsc) { toast.error('Account number and IFSC are required'); return; }
    const ok = await saveStep('bankDetails', { accountName, accountNumber, ifsc, bankName, upiId });
    if (ok) setCurrentStep(3);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setAreaLat(lat);
        setAreaLng(lng);
        // Try reverse geocode
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          if (data.display_name) setAreaAddress(data.display_name);
        } catch {
          setAreaAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setLocating(false);
      },
      () => { toast.error('Unable to get your location'); setLocating(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveWorkingArea = async () => {
    if (!areaLat || !areaLng) { toast.error('Please detect your location first'); return; }
    await saveStep('workingArea', { lat: areaLat, lng: areaLng, address: areaAddress, radius: areaRadius });
  };

  const handleSubmitOnboarding = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/delivery/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'submit', data: {} }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Application submitted for review!');
        setSubmitted(true);
      } else {
        toast.error(json.error || 'Failed to submit');
      }
    } catch {
      toast.error('Failed to submit');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Already submitted → show status
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="mx-auto h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Application Submitted!</h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Your delivery partner application is under review. You&apos;ll be notified once approved.
            Meanwhile you can explore the dashboard.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Button onClick={() => router.push('/delivery')}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => router.push('/delivery/nearby')}>Browse Nearby Orders</Button>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = Object.values(stepStatus).filter(Boolean).length;

  const docTypeLabels: Record<string, string> = {
    aadhaar: 'Aadhaar Card',
    driving_license: 'Driving License',
    pan: 'PAN Card',
    vehicle_rc: 'Vehicle RC',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Complete Your Enrollment</h1>
        <p className="text-gray-500">Fill in your details to start delivering with Order Wala</p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{completedCount}/{STEPS.length} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-4">
            {STEPS.map((step, idx) => {
              const isDone = stepStatus[step.id as keyof StepStatus];
              const isCurrent = idx === currentStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-lg transition-colors ${
                    isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? <CheckCircle className="h-5 w-5" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
              {stepStatus.vehicle && <Badge variant="success">✓ Done</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'bike', label: 'Bike/Scooter', icon: '🏍️' },
                { value: 'bicycle', label: 'Bicycle', icon: '🚲' },
                { value: 'car', label: 'Car', icon: '🚗' },
              ].map(v => (
                <button
                  key={v.value}
                  onClick={() => setVehicleType(v.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    vehicleType === v.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{v.icon}</span>
                  <span className="text-sm font-medium">{v.label}</span>
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <Input value={vehicleBrand} onChange={e => setVehicleBrand(e.target.value)} placeholder="e.g., Honda" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <Input value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} placeholder="e.g., Activa 6G" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                <Input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value.toUpperCase())} placeholder="BR01AB1234" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <Input value={vehicleColor} onChange={e => setVehicleColor(e.target.value)} placeholder="e.g., White" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveVehicle} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save & Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Identity Documents
              {stepStatus.documents && <Badge variant="success">✓ Done</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Saved docs */}
            {savedDocs.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">Submitted Documents</p>
                {savedDocs.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">{docTypeLabels[doc.type] || doc.type}</span>
                      <span className="text-sm text-gray-500">•••{doc.number.slice(-4)}</span>
                    </div>
                    <Badge variant={doc.status === 'verified' ? 'success' : 'warning'}>
                      {doc.status === 'verified' ? '✓ Verified' : '⏳ Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500">Add at least one government-issued ID document</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="doc-type">Document Type</label>
                <select
                  id="doc-type"
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="driving_license">Driving License</option>
                  <option value="pan">PAN Card</option>
                  <option value="vehicle_rc">Vehicle RC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Number *</label>
                <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Enter document number" />
              </div>
            </div>
            <Button variant="outline" onClick={handleSaveDocument} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Document
            </Button>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentStep(0)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => { if (savedDocs.length > 0) setCurrentStep(2); else toast.error('Add at least one document'); }}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank & Payment Details
              {stepStatus.bankDetails && <Badge variant="success">✓ Done</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">Your delivery earnings will be credited to this account</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Name on account" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code *</label>
                <Input value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} placeholder="e.g., SBIN0001234" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g., SBI" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (optional)</label>
                <Input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" />
              </div>
            </div>
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleSaveBank} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save & Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Working Area
              {stepStatus.workingArea && <Badge variant="success">✓ Done</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Set your preferred delivery area. You&apos;ll get orders near this location.</p>

            <div className="bg-gray-50 rounded-xl p-6 text-center border-2 border-dashed border-gray-300">
              {areaLat && areaLng ? (
                <div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-medium text-gray-900">Location Detected</p>
                  <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{areaAddress || `${areaLat.toFixed(4)}, ${areaLng.toFixed(4)}`}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleGetLocation} disabled={locating}>
                    {locating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Update Location
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-900">Detect Your Location</p>
                  <p className="text-sm text-gray-500 mt-1">We&apos;ll use this to show you nearby delivery orders</p>
                  <Button className="mt-3" onClick={handleGetLocation} disabled={locating}>
                    {locating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <MapPin className="h-4 w-4 mr-1" />}
                    {locating ? 'Detecting...' : 'Use My Location'}
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius: {areaRadius} km</label>
              <input
                type="range"
                min="1"
                max="20"
                value={areaRadius}
                onChange={e => setAreaRadius(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1 km</span>
                <span>10 km</span>
                <span>20 km</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleSaveWorkingArea} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Working Area
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {isComplete && !submitted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">All Steps Complete!</h3>
            <p className="text-gray-500 mt-1 mb-4">Submit your application to start delivering</p>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmitOnboarding} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bike className="h-4 w-4 mr-2" />}
              Submit Application
            </Button>
          </CardContent>
        </Card>
      )}

      {!isComplete && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Complete all steps to submit</p>
            <p className="text-sm text-yellow-600">You need to fill in all sections before you can submit your delivery partner application.</p>
          </div>
        </div>
      )}
    </div>
  );
}
