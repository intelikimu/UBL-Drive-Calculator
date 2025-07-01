// pages/loan-calculators.tsx
// Workflow Summary:
// 1. User fills customer, vehicle, and loan details in the form (Tab: Loan Form)
// 2. Optional: User enables monthly insurance checkbox
// 3. User clicks 'Calculate' => validation runs
// 4. On success, repayment schedule and financial summary is computed and stored in `results`
// 5. User can navigate to 'Results' tab to see breakdown
// 6. User can export results to JSON, Excel, or PDF
// 7. User can also import prefilled data via a JSON file
"use client";

import { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function LoanCalculators() {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Loan Calculators</h1>
      <AutoLoanCalculator />
    </div>
  );
}

function AutoLoanCalculator() {
  const resultRef = useRef<HTMLDivElement>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '', cnic: '', filerStatus: '', driveProduct: '', variant: '', productType: '', makeModel: ''
  });
  const [price, setPrice] = useState<number | string>('');
  const [downPaymentPercent, setDownPaymentPercent] = useState(65);
  const [markupRate, setMarkupRate] = useState(14.5);
  const [irr, setIrr] = useState(14.5);
  const [insuranceCompany, setInsuranceCompany] = useState("TPL");
  const [insuranceRate, setInsuranceRate] = useState(1.5);
  const [documentationCharges, setDocumentationCharges] = useState(14950);
  const [monthlyInsurance, setMonthlyInsurance] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);



  const formatCnic = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 13);
    if (digits.length < 6) return digits;
    if (digits.length < 13) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  };

  const handleCustomerChange = (field: string, value: string) => {
    if (field === "cnic") value = formatCnic(value);
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateFields = () => {
    const errs = [];
    const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicPattern.test(customerInfo.cnic)) errs.push("Invalid CNIC format (xxxxx-xxxxxxx-x)");
    if (+price <= 0) errs.push("Vehicle price must be greater than 0");
    if (downPaymentPercent < 0 || downPaymentPercent > 100) errs.push("Down payment % must be between 0 and 100");
    if (markupRate <= 0 || markupRate > 100) errs.push("Markup rate must be a valid %");
    if (irr <= 0 || irr > 100) errs.push("IRR must be a valid %");
    if (insuranceRate < 0 || insuranceRate > 100) errs.push("Insurance rate must be a valid %");
    return errs;
  };

  const calculate = () => {
    const errs = validateFields();
    if (errs.length > 0) {
      setErrors(errs);
      toast.error("Validation failed. Please fix the errors.");
      return;
    }
    setErrors([]);

    const downPayment = (+downPaymentPercent / 100) * +price;
    const financeAmount = +price - downPayment;
    const factor = 0.09002;
    const monthlyInstallment = Math.round(financeAmount * factor);
    const insurance = Math.round(financeAmount * (insuranceRate / 100));
    const monthlyInsuranceAmount = monthlyInsurance ? Math.round(insurance / 12) : 0;
    const totalMonthly = monthlyInstallment + monthlyInsuranceAmount;
    const upfront = downPayment + (monthlyInsurance ? 0 : insurance) + documentationCharges;
    const schedule = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthlyInstallment,
      insurance: monthlyInsuranceAmount,
      total: totalMonthly
    }));

    setResults({ ...customerInfo, price, downPayment, financeAmount, markupRate, irr, insuranceCompany, insuranceRate, insurance, documentationCharges, upfront, schedule });
    toast.success("Calculation successful.");
  };

  const exportToCSV = () => {
    if (!results) return;
    const rows = results.schedule.map((row: any) => ({ Month: row.month, Installment: row.monthlyInstallment, Insurance: row.insurance, Total: row.total }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, "repayment_schedule.xlsx");
    toast.success("Exported to Excel.");
  };

 const exportToPDF = async () => {
    if (!resultRef.current) return;

    const current = resultRef.current;
    const clone = current.cloneNode(true) as HTMLElement;

    // Inject clean styles
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        background-color: #fff !important;
        color: #000 !important;
        border-color: #000 !important;
        box-shadow: none !important;
        font-family: Arial, sans-serif !important;
        font-size: 12px !important;
        padding: 6px !important;
        line-height: 1.4 !important;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th, td {
        border: 1px solid #000;
        text-align: left;
        padding: 6px;
      }
      h3 {
        margin-top: 16px;
      }
      ul {
        margin-bottom: 16px;
      }
    `;
    clone.prepend(style);

    clone.style.padding = '40px';
    clone.style.border = '1px solid #ccc';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.width = '800px';
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        useCORS: true,
        scale: 2,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      pdf.save('loan-summary.pdf');
      toast.success('Exported to PDF.');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF. See console for details.');
    } finally {
      document.body.removeChild(clone);
    }
  };






  const loadFromJSON = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setCustomerInfo({
          name: data.name || '',
          cnic: data.cnic || '',
          filerStatus: data.filerStatus || '',
          driveProduct: data.driveProduct || '',
          variant: data.variant || '',
          productType: data.productType || '',
          makeModel: data.makeModel || '',
        });
        setPrice(data.price || 0);
        setDownPaymentPercent(data.downPaymentPercent || 0);
        setMarkupRate(data.markupRate || 0);
        setIrr(data.irr || 0);
        setInsuranceCompany(data.insuranceCompany || '');
        setInsuranceRate(data.insuranceRate || 0);
        setDocumentationCharges(data.documentationCharges || 0);
        setMonthlyInsurance(!!data.schedule?.[0]?.insurance);
        toast.success("Data loaded from JSON.");
      } catch {
        toast.error("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Tabs defaultValue="form">
      <TabsList className="mb-4">
        <TabsTrigger value="form">Loan Form</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
      </TabsList>

   <TabsContent value="form">
                <Card><CardContent className="space-y-4 p-4">
                    <h2 className="text-xl font-semibold">UBL Drive - Auto Loan Calculator</h2>
                    <input type="file" accept="application/json" onChange={loadFromJSON} />
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={monthlyInsurance} onChange={e => setMonthlyInsurance(e.target.checked)} /> Monthly Insurance?
                    </label>

                    {/* Customer Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['name', 'cnic', 'filerStatus', 'driveProduct', 'variant', 'productType', 'makeModel'].map(key => (
                            <div key={key}><Label>{key.replace(/([A-Z])/g, ' $1')}</Label><Input value={(customerInfo as any)[key]} onChange={e => handleCustomerChange(key, e.target.value)} /></div>
                        ))}
                    </div>

                    {/* Loan Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Total Cost of Vehicle (PKR)</Label><Input type="number" value={price} onChange={e => setPrice(+e.target.value)} /></div>
                        <div><Label>Down Payment (%)</Label><Input type="number" value={downPaymentPercent} onChange={e => setDownPaymentPercent(+e.target.value)} /></div>
                        <div><Label>Markup Rate (%)</Label><Input type="number" value={markupRate} onChange={e => setMarkupRate(+e.target.value)} /></div>
                        <div><Label>I.R.R (%)</Label><Input type="number" value={irr} onChange={e => setIrr(+e.target.value)} /></div>
                        <div><Label>Insurance Company</Label><Input value={insuranceCompany} onChange={e => setInsuranceCompany(e.target.value)} /></div>
                        <div><Label>Insurance Rate (%)</Label><Input type="number" value={insuranceRate} onChange={e => setInsuranceRate(+e.target.value)} /></div>
                        <div><Label>Documentation Charges</Label><Input type="number" value={documentationCharges} onChange={e => setDocumentationCharges(+e.target.value)} /></div>
                    </div>

                    {errors.length > 0 && <ul className="bg-red-100 text-red-700 p-2 rounded text-sm">{errors.map((err, i) => <li key={i}>• {err}</li>)}</ul>}

                    <Button onClick={calculate}>Calculate</Button>
                </CardContent></Card>
            </TabsContent>

      <TabsContent value="results">
        {!results ? (
          <div className="text-red-600 p-4">Please fill and calculate the form first.</div>
        ) : (
          <Card>
            <CardContent ref={resultRef} className="space-y-4 p-4">
              <h3 className="font-semibold">Up-Front Payments</h3>
              <ul className="list-disc pl-6">
                <li><strong>Down Payment:</strong> Rs. {results.downPayment.toLocaleString()}</li>
                <li><strong>1st Year Insurance:</strong> Rs. {results.insurance.toLocaleString()}</li>
                <li><strong>Documentation Charges:</strong> Rs. {results.documentationCharges.toLocaleString()}</li>
                <li><strong>Total Payable:</strong> Rs. {results.upfront.toLocaleString()}</li>
              </ul>
              <h3 className="font-semibold">Repayment Schedule</h3>
              <div className="overflow-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr><th className="border px-2">Month</th><th className="border px-2">Installment</th><th className="border px-2">Insurance</th><th className="border px-2">Total</th></tr>
                  </thead>
                  <tbody>
                    {results.schedule.map((row: any) => (
                      <tr key={row.month}>
                        <td className="border px-2 text-center">{row.month}</td>
                        <td className="border px-2 text-right">Rs. {row.monthlyInstallment}</td>
                        <td className="border px-2 text-right">Rs. {row.insurance}</td>
                        <td className="border px-2 text-right">Rs. {row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={exportToCSV}>Export Excel</Button>
                <Button onClick={exportToPDF}>Export PDF</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
