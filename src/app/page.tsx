'use client';
import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, Truck, MapPin, Calendar, BarChartHorizontal } from "lucide-react";

import Header from "@/components/Header";
import { getHomePageData, getFinancialYearMonths } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KPI";
import ProductMarginLossChart from "@/components/charts/ProductMarginLossChart";
import VendorMarginLossChart from "@/components/charts/VendorMarginLossChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HomePageData } from "@/lib/types";
import { Loader2 } from 'lucide-react';
import { geoLocations } from "@/lib/data";
import ProductMarginLossPercentageChart from "@/components/charts/ProductMarginLossPercentageChart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";


type Scope = 'pan-india' | 'state' | 'city';
type Period = 'mtd' | string; // 'mtd' or 'YYYY-MM'

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<HomePageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State initialization from URL or defaults
  const [scope, setScope] = useState<Scope>(() => (searchParams.get('scope') as Scope) || 'pan-india');
  const [selectedState, setSelectedState] = useState<string>(() => searchParams.get('state') || 'Telangana');
  const [selectedCityState, setSelectedCityState] = useState<string>(() => searchParams.get('cityState') || 'Telangana');
  const [selectedCity, setSelectedCity] = useState<string>(() => searchParams.get('city') || 'Hyderabad');
  const [period, setPeriod] = useState<Period>(() => searchParams.get('period') || 'mtd');
  
  const financialYearMonths = useMemo(() => getFinancialYearMonths(), []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const params = new URLSearchParams(searchParams);
      
      let filter: { state?: string, city?: string, cityState?: string } = {};
      const currentScope = params.get('scope') as Scope || 'pan-india';
      const currentPeriod = params.get('period') as Period || 'mtd';

      if (currentScope === 'state') {
        const state = params.get('state');
        if (state) filter.state = state;
      } else if (currentScope === 'city') {
        const city = params.get('city');
        const cityState = params.get('cityState');
        if (city && cityState) filter = { city, state: cityState };
      }
      
      const homePageData = await getHomePageData(filter, currentPeriod);

      setData(homePageData);
      setIsLoading(false);
    };

    fetchData();
  }, [searchParams]);

  const updateUrlParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleScopeChange = (value: Scope) => {
    setScope(value);
    const newParams: Record<string, string | null> = { scope: value, state: null, city: null, cityState: null };
    if (value === 'state') {
      newParams.state = selectedState;
    } else if (value === 'city') {
       newParams.cityState = selectedCityState;
       newParams.city = selectedCity;
    }
    newParams.period = period;
    updateUrlParams(newParams);
  };
  
  const handleStateChange = (state: string) => {
      setSelectedState(state);
      updateUrlParams({ scope: 'state', state: state, city: null, cityState: null, period: period });
  }

  const handleCityStateChange = (state: string) => {
    setSelectedCityState(state);
    const citiesForNewState = geoLocations.citiesByState[state] || [];
    const newCity = citiesForNewState.length > 0 ? citiesForNewState[0] : '';
    setSelectedCity(newCity);
    updateUrlParams({ scope: 'city', cityState: state, city: newCity, state: null, period: period });
  };

  const handleCityChange = (city: string) => {
      setSelectedCity(city);
      updateUrlParams({ scope: 'city', cityState: selectedCityState, city, state: null, period: period });
  }
  
  const handlePeriodChange = (value: Period) => {
    setPeriod(value);
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('period', value);
    router.push(`${pathname}?${currentParams.toString()}`);
  }

  const getCitiesForSelectedState = () => {
      return geoLocations.citiesByState[selectedCityState] || [];
  }

  const getDashboardTitle = () => {
    switch (scope) {
      case 'state':
        return `Dashboard for ${selectedState}`;
      case 'city':
        return `Dashboard for ${selectedCity}, ${selectedCityState}`;
      case 'pan-india':
      default:
        return 'Pan-India Dashboard';
    }
  };
  
  const getMarginAnalysisLink = () => {
    const queryString = searchParams.toString();
    return `/margin-analysis${queryString ? `?${queryString}` : ''}`;
  }

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

  const { periodData, last3MonthsData } = data;

  const topProductsByValue = periodData?.productsSummary
    .sort((a, b) => b.totalMarginLoss - a.totalMarginLoss)
    .slice(0, 5) ?? [];

  const topProductsByPercentage = periodData?.productsSummary
    .sort((a, b) => b.marginLossPercentage - a.marginLossPercentage)
    .slice(0, 5) ?? [];
    
  const topVendors = periodData?.vendorsSummary
    .sort((a, b) => b.totalMarginLoss - a.totalMarginLoss)
    .slice(0, 5) ?? [];
  
  const getPeriodLabel = () => {
    if (period === 'mtd') return "Current Month till Date";
    const month = financialYearMonths.find(m => m.value === period);
    return month ? month.label : "Selected Period";
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{getDashboardTitle()}</h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <Select onValueChange={(value: Period) => handlePeriodChange(value)} value={period}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <Calendar className="mr-2" />
                            <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mtd">Current Month till Date</SelectItem>
                            {financialYearMonths.map(month => (
                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

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
            <div className="flex justify-end">
                <Button variant="outline" asChild>
                    <Link href={getMarginAnalysisLink()}>
                        <BarChartHorizontal className="mr-2 h-4 w-4" />
                        Margin Analysis
                    </Link>
                </Button>
            </div>
        </div>
        
        {/* KPIs for selected period */}
        <div>
            <div className="flex items-center gap-4 mb-4">
                <Separator />
                <h2 className="text-lg font-semibold whitespace-nowrap text-muted-foreground">Analysis for {getPeriodLabel()}</h2>
                <Separator />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                title="Total Margin Loss"
                value={formatCurrency(periodData.totalMarginLoss)}
                description="Cumulative loss across all products"
                icon={DollarSign}
              />
              <KpiCard
                title="Total SKU's"
                value={periodData.products.length.toString()}
                description="Total unique products with purchases"
                icon={Package}
              />
               <KpiCard
                title="Total Vendors"
                value={periodData.vendors.length.toString()}
                description="Total unique vendors in the system"
                icon={Truck}
              />
            </div>
        </div>

        {/* KPIs for last 3 months */}
        <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
                <Separator />
                <h2 className="text-lg font-semibold whitespace-nowrap text-muted-foreground">Analysis for Last 3 Months</h2>
                <Separator />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                title="Total Margin Loss"
                value={formatCurrency(last3MonthsData.totalMarginLoss)}
                description="Cumulative loss across all products"
                icon={DollarSign}
              />
              <KpiCard
                title="Total SKU's"
                value={last3MonthsData.products.length.toString()}
                description="Total unique products with purchases"
                icon={Package}
              />
               <KpiCard
                title="Total Vendors"
                value={last3MonthsData.vendors.length.toString()}
                description="Total unique vendors in the system"
                icon={Truck}
              />
            </div>
        </div>


        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Products by Margin Loss (Value)</CardTitle>
                <CardDescription>
                  Products with the highest margin loss for {getPeriodLabel()}.
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
                  Products with the highest margin loss percentage for {getPeriodLabel()}.
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
                  Vendors associated with the highest total margin loss for {getPeriodLabel()}.
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
