
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
import { DollarSign, Package, Truck, MapPin, Calendar, Filter, ChevronsUpDown, Factory, Building, Tag, Users } from "lucide-react";
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
  const productTypes = ['Private Label', 'Non-Private Label'];

  // State initialization from URL or defaults
  const [scope, setScope] = useState<Scope>(() => (searchParams.get('scope') as Scope) || 'pan-india');
  const [selectedState, setSelectedState] = useState<string>(() => searchParams.get('state') || 'Telangana');
  const [selectedCityState, setSelectedCityState] = useState<string>(() => searchParams.get('cityState') || 'Telangana');
  const [selectedCity, setSelectedCity] = useState<string>(() => searchParams.get('city') || 'Hyderabad');
  const [period, setPeriod] = useState<Period>(() => searchParams.get('period') || 'mtd');
  const [quantityOutlierFilter, setQuantityOutlierFilter] = useState<QuantityOutlierFilter>(() => (searchParams.get('qof') as QuantityOutlierFilter) || 'none');

  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedProductType, setSelectedProductType] = useState<string>('all');

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
    if (selectedManufacturer !== 'all') params.set('manufacturer', selectedManufacturer);
    if (selectedDivision !== 'all') params.set('division', selectedDivision);
    if (selectedVendor !== 'all') params.set('vendor', selectedVendor);
    if (selectedProductType !== 'all') params.set('productType', selectedProductType);
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [scope, selectedState, selectedCity, selectedCityState, period, quantityOutlierFilter, selectedManufacturer, selectedDivision, selectedVendor, selectedProductType, router, pathname]);

  useEffect(() => {
    const s = searchParams.get('scope') as Scope || 'pan-india';
    const st = searchParams.get('state') || 'Telangana';
    const c = searchParams.get('city') || 'Hyderabad';
    const cs = searchParams.get('cityState') || 'Telangana';
    const p = searchParams.get('period') || 'mtd';
    const qof = searchParams.get('qof') as QuantityOutlierFilter || 'none';
    const man = searchParams.get('manufacturer') || 'all';
    const div = searchParams.get('division') || 'all';
    const ven = searchParams.get('vendor') || 'all';
    const pt = searchParams.get('productType') || 'all';

    setScope(s);
    setSelectedState(st);
    setSelectedCity(c);
    setSelectedCityState(cs);
    setPeriod(p);
    setQuantityOutlierFilter(qof);
    setSelectedManufacturer(man);
    setSelectedDivision(div);
    setSelectedVendor(ven);
    setSelectedProductType(pt);

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
          manufacturer: selectedManufacturer,
          division: selectedDivision,
          vendor: selectedVendor,
          productType: selectedProductType,
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
  }, [scope, selectedState, selectedCity, selectedCityState, period, quantityOutlierFilter, selectedManufacturer, selectedDivision, selectedVendor, selectedProductType]);
  
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
    const vendorId = data?.analysisData.vendors[0]?.id;
    if (selectedVendor !== 'all' && vendorId) {
      return `/vendors/${vendorId}?${queryString}`;
    }
    return `/margin-analysis${queryString ? `?${queryString}` : ''}`;
  }
  
  const getAnalysisPeriodTitle = () => {
      if (period === 'mtd') {
        return `Current Month Analysis`;
      }
      try {
          const date = parse(period, 'yyyy-MM', new Date());
          return `Analysis for ${format(date, 'MMMM yyyy')}`;
      } catch(e) {
        return 'Selected Period Analysis';
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
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-4 md:p-8">
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{getDashboardTitle()}</h1>
                </div>
            </div>
            
            <Card>
                <CardContent className="p-4 flex flex-col gap-4">
                    {/* Top Row Filters */}
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

                        <div className="flex-grow"></div>
                        <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                        </Button>
                    </div>

                     {/* Advanced Filters */}
                    {showAdvancedFilters && (
                         <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                             <Select onValueChange={setSelectedManufacturer} value={selectedManufacturer}>
                                <PillSelectTrigger placeholder="Manufacturer"><Factory className="mr-2" /></PillSelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Manufacturers</SelectItem>
                                    {manufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={setSelectedDivision} value={selectedDivision}>
                                <PillSelectTrigger placeholder="Division"><Building className="mr-2" /></PillSelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Divisions</SelectItem>
                                    {divisions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={setSelectedVendor} value={selectedVendor}>
                                <PillSelectTrigger placeholder="Vendor"><Truck className="mr-2" /></PillSelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Vendors</SelectItem>
                                    {vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={setSelectedProductType} value={selectedProductType}>
                                <PillSelectTrigger placeholder="Product Type">
                                    <Tag className="mr-2" />
                                </PillSelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Product Types</SelectItem>
                                    {productTypes.map(pt => (
                                        <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>
        
        {/* KPIs for last 4 months */}
        <div className="mt-4">
            <div className="flex items-center gap-4 mb-4">
                <Separator />
                <h2 className="text-lg font-semibold whitespace-nowrap text-muted-foreground">{getAnalysisPeriodTitle()}</h2>
                <Separator />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="YTD Total Margin Loss"
                value={formatCurrency(ytdTotalMarginLoss)}
                description="Financial year-to-date margin loss"
                icon={DollarSign}
              />
              <Link href={getMarginAnalysisLink()} className="block">
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
                description="Total unique vendors with purchases"
                icon={Truck}
              />
            </div>
        </div>


        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 mt-4">
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
            <Card className="lg:col-span-2">
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

    