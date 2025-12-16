'use client';
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, Truck, MapPin, Calendar, Filter, ChevronsUpDown, Factory, Building, Tag } from "lucide-react";
import Header from "@/components/Header";
import { getHomePageData, getFinancialYearMonths, getFilterOptions } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KPI";
import ProductMarginLossChart from "@/components/charts/ProductMarginLossChart";
import VendorMarginLossChart from "@/components/charts/VendorMarginLossChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HomePageData, QuantityOutlierFilter, DataFilters } from "@/lib/types";
import { Loader2 } from 'lucide-react';
import { geoLocations } from "@/lib/data";
import ProductMarginLossPercentageChart from "@/components/charts/ProductMarginLossPercentageChart";
import { Separator } from "@/components/ui/separator";
import { format, parse } from "date-fns";
import MultiSelectFilter from "@/components/dashboard/MultiSelectFilter";
import { Button } from "@/components/ui/button";

type Scope = 'pan-india' | 'state' | 'city';
type Period = 'mtd' | string; // 'mtd' or 'YYYY-MM'

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<HomePageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { manufacturers, divisions, vendors } = useMemo(() => getFilterOptions(), []);

  // State initialization from URL or defaults
  const [scope, setScope] = useState<Scope>(() => (searchParams.get('scope') as Scope) || 'pan-india');
  const [selectedState, setSelectedState] = useState<string>(() => searchParams.get('state') || 'Telangana');
  const [selectedCityState, setSelectedCityState] = useState<string>(() => searchParams.get('cityState') || 'Telangana');
  const [selectedCity, setSelectedCity] = useState<string>(() => searchParams.get('city') || 'Hyderabad');
  const [period, setPeriod] = useState<Period>(() => searchParams.get('period') || 'mtd');
  const [quantityOutlierFilter, setQuantityOutlierFilter] = useState<QuantityOutlierFilter>(() => (searchParams.get('qof') as QuantityOutlierFilter) || 'none');

  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(['Non-Private Label']);

  const financialYearMonths = useMemo(() => getFinancialYearMonths(), []);

  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('scope', scope);
    if (scope === 'state') params.set('state', selectedState);
    if (scope === 'city') {
        params.set('city', selectedCity);
        params.set('cityState', selectedCityState);
    }
    params.set('period', period);
    params.set('qof', quantityOutlierFilter);
    if (selectedManufacturers.length > 0) params.set('manufacturers', selectedManufacturers.join(','));
    if (selectedDivisions.length > 0) params.set('divisions', selectedDivisions.join(','));
    if (selectedVendors.length > 0) params.set('vendors', selectedVendors.join(','));
    if (selectedProductTypes.length > 0) params.set('productTypes', selectedProductTypes.join(','));
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [scope, selectedState, selectedCity, selectedCityState, period, quantityOutlierFilter, selectedManufacturers, selectedDivisions, selectedVendors, selectedProductTypes, router, pathname]);

  useEffect(() => {
    const s = searchParams.get('scope') as Scope || 'pan-india';
    const st = searchParams.get('state') || 'Telangana';
    const c = searchParams.get('city') || 'Hyderabad';
    const cs = searchParams.get('cityState') || 'Telangana';
    const p = searchParams.get('period') || 'mtd';
    const qof = searchParams.get('qof') as QuantityOutlierFilter || 'none';
    const man = searchParams.get('manufacturers')?.split(',') || [];
    const div = searchParams.get('divisions')?.split(',') || [];
    const ven = searchParams.get('vendors')?.split(',') || [];
    const pt = searchParams.get('productTypes')?.split(',') || ['Non-Private Label'];

    setScope(s);
    setSelectedState(st);
    setSelectedCity(c);
    setSelectedCityState(cs);
    setPeriod(p);
    setQuantityOutlierFilter(qof);
    setSelectedManufacturers(man.filter(Boolean));
    setSelectedDivisions(div.filter(Boolean));
    setSelectedVendors(ven.filter(Boolean));
    setSelectedProductTypes(pt.filter(Boolean));

  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const geo: { state?: string, city?: string, cityState?: string } = {};
      if (scope === 'state') geo.state = selectedState;
      if (scope === 'city') {
          geo.city = selectedCity;
          geo.state = selectedCityState;
      }
      
      const filters: DataFilters = {
          geo,
          manufacturers: selectedManufacturers,
          divisions: selectedDivisions,
          vendors: selectedVendors,
          productTypes: selectedProductTypes,
      }
      
      try {
        const homePageData = await getHomePageData(filters, period, quantityOutlierFilter);
        setData(homePageData);
      } catch (error) {
        console.error("Failed to fetch home page data:", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [scope, selectedState, selectedCity, selectedCityState, period, quantityOutlierFilter, selectedManufacturers, selectedDivisions, selectedVendors, selectedProductTypes]);
  
  useEffect(() => {
      updateUrlParams();
  }, [updateUrlParams]);


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
  
  const getAnalysisPeriodTitle = () => {
      if (period === 'mtd') {
        return `Analysis for Current Month`;
      }
      try {
          const date = parse(period, 'yyyy-MM', new Date());
          return `Analysis for ${format(date, 'MMMM yyyy')}`;
      } catch(e) {
        return 'Analysis for Selected Period';
      }
  };

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

  const { analysisData, ytdTotalMarginLoss } = data;

  const topProductsByValue = analysisData?.productsSummary
    .sort((a, b) => b.totalMarginLoss - a.totalMarginLoss)
    .slice(0, 5) ?? [];

  const topProductsByPercentage = analysisData?.productsSummary
    .sort((a, b) => b.marginLossPercentage - a.marginLossPercentage)
    .slice(0, 5) ?? [];
    
  const topVendors = analysisData?.vendorsSummary
    .sort((a, b) => b.totalMarginLoss - a.totalMarginLoss)
    .slice(0, 5) ?? [];
    
  const PillSelectTrigger = ({ children, placeholder }: { children: React.ReactNode, placeholder: string }) => (
    <SelectTrigger className="w-full sm:w-auto rounded-full h-9 text-left font-normal justify-start">
        {children}
        <SelectValue placeholder={placeholder} />
    </SelectTrigger>
  );

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between gap-4">
                 <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{getDashboardTitle()}</h1>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                    <Filter className="mr-2"/>
                    {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                </Button>
            </div>
            {/* Filter Row 1 */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
                 <Select onValueChange={(value: Period) => setPeriod(value)} value={period}>
                    <PillSelectTrigger placeholder="Select Period">
                        <Calendar className="mr-2" />
                    </PillSelectTrigger>
                    <SelectContent>
                        <SelectItem value="mtd">Current Month till Date</SelectItem>
                        {financialYearMonths.map(month => (
                            <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                <Select onValueChange={(value: Scope) => setScope(value)} value={scope}>
                    <PillSelectTrigger placeholder="Select Scope">
                        <MapPin className="mr-2" />
                    </PillSelectTrigger>
                    <SelectContent>
                        <SelectItem value="pan-india">Pan India</SelectItem>
                        <SelectItem value="state">State-wise</SelectItem>
                        <SelectItem value="city">City-wise</SelectItem>
                    </SelectContent>
                </Select>

                {scope === 'state' && (
                <Select onValueChange={setSelectedState} value={selectedState}>
                    <PillSelectTrigger placeholder="Select State"><></></PillSelectTrigger>
                    <SelectContent>
                    {geoLocations.states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                )}

                {scope === 'city' && (
                <>
                    <Select onValueChange={setSelectedCityState} value={selectedCityState}>
                        <PillSelectTrigger placeholder="Select State"><></></PillSelectTrigger>
                        <SelectContent>
                        {geoLocations.states.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedCity} value={selectedCity}>
                        <PillSelectTrigger placeholder="Select City"><></></PillSelectTrigger>
                        <SelectContent>
                            {getCitiesForSelectedState().map(city => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </>
                )}
                 <MultiSelectFilter
                    title="Product Type"
                    icon={Tag}
                    options={['Private Label', 'Non-Private Label']}
                    selectedValues={selectedProductTypes}
                    onSelectedChange={setSelectedProductTypes}
                 />
            </div>
            
            {/* Filter Row 2 - Advanced */}
            {showAdvancedFilters && (
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <MultiSelectFilter
                        title="Manufacturer"
                        icon={Factory}
                        options={manufacturers}
                        selectedValues={selectedManufacturers}
                        onSelectedChange={setSelectedManufacturers}
                    />
                    <MultiSelectFilter
                        title="Division"
                        icon={Building}
                        options={divisions}
                        selectedValues={selectedDivisions}
                        onSelectedChange={setSelectedDivisions}
                    />
                    <MultiSelectFilter
                        title="Vendor"
                        icon={Truck}
                        options={vendors}
                        selectedValues={selectedVendors}
                        onSelectedChange={setSelectedVendors}
                    />
                    <Select onValueChange={(value: QuantityOutlierFilter) => setQuantityOutlierFilter(value)} value={quantityOutlierFilter}>
                        <PillSelectTrigger placeholder="Outlier Filter">
                            <Filter className="mr-2" />
                        </PillSelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Outlier Filter</SelectItem>
                        <SelectItem value="1percent">Exclude &lt; 1% Qty</SelectItem>
                        <SelectItem value="5percent">Exclude &lt; 5% Qty</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            )}
        </div>
        
        {/* KPIs for last 4 months */}
        <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
                <Separator />
                <h2 className="text-lg font-semibold whitespace-nowrap text-muted-foreground">{getAnalysisPeriodTitle()}</h2>
                <Separator />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="YTD Total Margin Loss"
                value={formatCurrency(ytdTotalMarginLoss)}
                description="Financial year margin loss"
                icon={DollarSign}
              />
              <Link href={getMarginAnalysisLink()} className="block transition-all duration-300 hover:shadow-lg hover:border-primary rounded-lg">
                  <KpiCard
                    title="Total Margin Loss"
                    value={formatCurrency(analysisData.totalMarginLoss)}
                    description="Cumulative loss for selected period"
                    icon={DollarSign}
                  />
              </Link>
              <KpiCard
                title="Total SKU's"
                value={analysisData.products.length.toString()}
                description="Total unique products with purchases"
                icon={Package}
              />
               <KpiCard
                title="Total Vendors"
                value={analysisData.vendors.length.toString()}
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
                  Products with the highest margin loss for the selected period.
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
                  Products with the highest margin loss percentage for the selected period.
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
                  Vendors associated with the highest total margin loss for the selected period.
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
