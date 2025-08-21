'use client';
import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, Truck, MapPin } from "lucide-react";

import Header from "@/components/Header";
import { getAppData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KPI";
import ProductMarginLossChart from "@/components/charts/ProductMarginLossChart";
import VendorMarginLossChart from "@/components/charts/VendorMarginLossChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppData, Product, Vendor, ProcessedPurchase } from "@/lib/types";
import { Loader2 } from 'lucide-react';
import { geoLocations } from "@/lib/data";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import ProductMarginLossPercentageChart from "@/components/charts/ProductMarginLossPercentageChart";

type Scope = 'pan-india' | 'state' | 'city';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state from URL or set defaults
  const [scope, setScope] = useState<Scope>(() => (searchParams.get('scope') as Scope) || 'pan-india');
  const [selectedStates, setSelectedStates] = useState<string[]>(() => searchParams.get('states')?.split(',') || []);
  const [selectedCityState, setSelectedCityState] = useState<string>(() => searchParams.get('state') || 'Telangana');
  const [selectedCity, setSelectedCity] = useState<string>(() => searchParams.get('city') || 'Hyderabad');

  const stateOptions: MultiSelectOption[] = useMemo(() => 
    geoLocations.states.map(s => ({ value: s, label: s })),
  []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const params = new URLSearchParams(searchParams);
      
      let filter: { states?: string[], city?: string, state?: string } = {};
      const currentScope = params.get('scope') as Scope || 'pan-india';
      
      if (currentScope === 'state') {
        const states = params.get('states');
        if (states) filter.states = states.split(',');
      } else if (currentScope === 'city') {
        const city = params.get('city');
        const state = params.get('state');
        if (city && state) filter = { city, state };
      }
      
      const appData = await getAppData(filter);
      setData(appData);
      setIsLoading(false);
    };

    fetchData();
  }, [searchParams]);

  const updateUrlParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(); // Start with fresh params
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleScopeChange = (value: Scope) => {
    setScope(value);
    const newParams: Record<string, string | null> = { scope: value };
    if (value === 'pan-india') {
      setSelectedStates([]);
    } else if (value === 'state') {
      // No need to set default states, user will select
    } else { // city
       newParams.state = selectedCityState;
       newParams.city = selectedCity;
    }
    updateUrlParams(newParams);
  };
  
  const handleStatesChange = (states: string[]) => {
      setSelectedStates(states);
      updateUrlParams({ scope: 'state', states: states.join(',') });
  }

  const handleCityStateChange = (state: string) => {
    setSelectedCityState(state);
    const citiesForNewState = geoLocations.citiesByState[state] || [];
    const newCity = citiesForNewState.length > 0 ? citiesForNewState[0] : '';
    setSelectedCity(newCity);
    updateUrlParams({ scope: 'city', state, city: newCity });
  };

  const handleCityChange = (city: string) => {
      setSelectedCity(city);
      updateUrlParams({ scope: 'city', state: selectedCityState, city });
  }
  
  const getCitiesForSelectedState = () => {
      return geoLocations.citiesByState[selectedCityState] || [];
  }

  const getDashboardTitle = () => {
    switch (scope) {
      case 'state':
        if (selectedStates.length === 0) return 'Dashboard - Please select states';
        if (selectedStates.length === 1) return `Dashboard for ${selectedStates[0]}`;
        return `Dashboard for ${selectedStates.length} states`;
      case 'city':
        return `Dashboard for ${selectedCity}`;
      case 'pan-india':
      default:
        return 'Pan-India Dashboard';
    }
  };

  const topProductsByValue = data?.productsSummary
    .sort((a, b) => b.totalMarginLoss - a.totalMarginLoss)
    .slice(0, 5) ?? [];

  const topProductsByPercentage = data?.productsSummary
    .sort((a, b) => b.marginLossPercentage - a.marginLossPercentage)
    .slice(0, 5) ?? [];
    
  const topVendors = data?.vendorsSummary
    .sort((a, b) => b.totalMarginLoss - a.totalMarginLoss)
    .slice(0, 5) ?? [];
  
  if (isLoading || !data) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <div className="flex flex-1 items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">{getDashboardTitle()}</h1>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Select onValueChange={(value: Scope) => handleScopeChange(value)} value={scope}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <MapPin className="mr-2" />
                <SelectValue placeholder="Select Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pan-india">Pan India</SelectItem>
                <SelectItem value="state">State-wise</SelectItem>
                <SelectItem value="city">City-wise</SelectItem>
              </SelectContent>
            </Select>

            {scope === 'state' && (
              <MultiSelect
                options={stateOptions}
                selected={selectedStates}
                onChange={handleStatesChange}
                className="w-full sm:w-[250px]"
                placeholder="Select States..."
              />
            )}

            {scope === 'city' && (
              <>
                 <Select onValueChange={handleCityStateChange} value={selectedCityState}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                    {geoLocations.states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <Select onValueChange={handleCityChange} value={selectedCity}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                        {getCitiesForSelectedState().map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            title="Total Margin Loss"
            value={formatCurrency(data.totalMarginLoss)}
            description="Cumulative loss across all products"
            icon={DollarSign}
          />
          <KpiCard
            title="Total SKU's"
            value={data.products.length.toString()}
            description="Total unique products with purchases"
            icon={Package}
          />
           <KpiCard
            title="Total Vendors"
            value={data.vendors.length.toString()}
            description="Total unique vendors in the system"
            icon={Truck}
          />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Products by Margin Loss (Value)</CardTitle>
                <CardDescription>
                  Products with the highest margin loss compared to benchmark prices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductMarginLossChart data={topProductsByValue} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Products by Margin Loss (%)</CardTitle>
                <CardDescription>
                  Products with the highest margin loss percentage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductMarginLossPercentageChart data={topProductsByPercentage} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Vendors by Margin Loss</CardTitle>
                <CardDescription>
                  Vendors associated with the highest total margin loss.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VendorMarginLossChart data={topVendors} />
              </CardContent>
            </Card>
        </div>
      </main>
    </>
  );
}
