'use client';
import { useState, useEffect } from "react";
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
import type { AppData } from "@/lib/types";
import { Loader2 } from 'lucide-react';
import { geoLocations } from "@/lib/data";

type Scope = 'pan-india' | 'state' | 'city';

export default function Home() {
  const [data, setData] = useState<AppData | null>(null);
  const [scope, setScope] = useState<Scope>('pan-india');
  const [selectedState, setSelectedState] = useState<string>('Telangana');
  const [selectedCity, setSelectedCity] = useState<string>('Hyderabad');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      let filter = {};
      if (scope === 'state') {
        filter = { state: selectedState };
      } else if (scope === 'city') {
        filter = { city: selectedCity, state: findStateForCity(selectedCity) };
      }
      const appData = await getAppData(filter);
      setData(appData);
      setIsLoading(false);
    };

    fetchData();
  }, [scope, selectedState, selectedCity]);

  const handleScopeChange = (value: Scope) => {
    setScope(value);
    if (value === 'state' && !selectedState) {
      setSelectedState(geoLocations.states[0]);
    } else if (value === 'city' && !selectedCity) {
      setSelectedCity(geoLocations.citiesByState[geoLocations.states[0]][0])
    }
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    // Reset city when state changes to avoid invalid combinations
    setSelectedCity(geoLocations.citiesByState[value][0]);
  };

  const findStateForCity = (city: string) => {
    for (const state in geoLocations.citiesByState) {
        if (geoLocations.citiesByState[state].includes(city)) {
            return state;
        }
    }
    return '';
  }
  
  const getCitiesForSelectedState = () => {
      return geoLocations.citiesByState[selectedState] || [];
  }

  const getDashboardTitle = () => {
    switch (scope) {
      case 'state':
        return `Dashboard for ${selectedState}`;
      case 'city':
        return `Dashboard for ${selectedCity}`;
      case 'pan-india':
      default:
        return 'Pan-India Dashboard';
    }
  };

  const topProducts = data?.productsSummary
    .sort((a, b) => b.totalMarginLoss - a.totalMarginLoss)
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
            <Select onValueChange={(value: Scope) => handleScopeChange(value)} defaultValue={scope}>
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
              <Select onValueChange={setSelectedState} value={selectedState}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {geoLocations.states.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {scope === 'city' && (
              <>
                 <Select onValueChange={handleStateChange} value={selectedState}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                    {geoLocations.states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <Select onValueChange={setSelectedCity} value={selectedCity}>
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
                <CardTitle>Top 5 Products by Margin Loss</CardTitle>
                <CardDescription>
                  Products with the highest margin loss compared to benchmark prices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductMarginLossChart data={topProducts} />
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
