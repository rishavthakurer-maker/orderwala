import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Location {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface LocationStore {
  currentLocation: Location | null;
  selectedAddress: Location | null;
  setCurrentLocation: (location: Location) => void;
  setSelectedAddress: (address: Location) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      currentLocation: null,
      selectedAddress: null,

      setCurrentLocation: (location) => {
        set({ currentLocation: location });
      },

      setSelectedAddress: (address) => {
        set({ selectedAddress: address });
      },

      clearLocation: () => {
        set({ currentLocation: null, selectedAddress: null });
      },
    }),
    {
      name: 'orderwala-location',
    }
  )
);
