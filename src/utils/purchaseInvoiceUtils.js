import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";
import { getPurchaseByIdApi, getSuppliersApi, getSupplierByIdApi, getStatesApi, getCitiesApi } from "../services/allAPI";

const parseArrayFromResponse = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data?.records) return res.data.records;
  if (res.records) return res.records;
  const maybeArray = Object.values(res).find((v) => Array.isArray(v));
  return Array.isArray(maybeArray) ? maybeArray : [];
};
import { serverURL } from "../services/serverURL";

// Helper: Format Currency
const formatCurrency = (amount) => {
  return Number(amount || 0).toFixed(2);
};

// PURCHASE INVOICE PDF GENERATOR
export const generatePurchaseInvoicePDF = async (purchaseId, settings, title = "Purchase Invoice") => {
  try {
    const toastId = toast.loading("Generating PDF...");

    // 1. Fetch full details
    const res = await getPurchaseByIdApi(purchaseId);
    if (res.status !== 200) {
      toast.dismiss(toastId);
      toast.error("Failed to fetch purchase details");
      return;
    }
    const purchase = res.data.purchase;
    const details = res.data.details || [];

    // 2. Fetch Supplier if details missing OR to resolve City/State
    if (purchase.SupplierId) {
        try {
            // Parallel Fetch
            const [supRes, citiesRes, statesRes] = await Promise.all([
                 getSupplierByIdApi(purchase.SupplierId),
                 getCitiesApi(1, 5000),
                 getStatesApi(1, 5000)
            ]);

            if (supRes.status === 200) {
                 const sData = supRes.data?.supplier || supRes.data?.data || supRes.data || {};
                 
                 // Resolve Names
                 const cityList = parseArrayFromResponse(citiesRes);
                 const stateList = parseArrayFromResponse(statesRes);

                 const cityId = sData.CityId || sData.cityId;
                 const stateId = sData.StateId || sData.stateId;
                 
                 let resolvedCity = sData.City || sData.city || "";
                 let resolvedState = sData.State || sData.state || "";

                 if (cityId && cityList.length > 0) {
                      const found = cityList.find(c => String(c.id || c.Id || c.CityId) === String(cityId));
                      if (found) resolvedCity = found.name || found.Name || found.CityName;
                 }
                 if (stateId && stateList.length > 0) {
                      const found = stateList.find(s => String(s.id || s.Id || s.StateId) === String(stateId));
                      if (found) resolvedState = found.name || found.Name || found.StateName;
                 }
                 
                 // Assign
                 if(!purchase.supplierName) purchase.supplierName = sData.companyName || sData.CompanyName;
                 if(!purchase.Address) purchase.Address = sData.address || sData.Address;
                 if(!purchase.Phone) purchase.Phone = sData.phone || sData.Phone;
                 if(!purchase.GSTIN) purchase.GSTIN = sData.gstin || sData.GSTIN || sData.vatNo; 
                 if(!purchase.email) purchase.email = sData.email || sData.Email || sData.EmailAddress;
                 
                 // Map detailed address fields
                 if(!purchase.AddressLine1) purchase.AddressLine1 = sData.addressLine1 || sData.AddressLine1;
                 if(!purchase.AddressLine2) purchase.AddressLine2 = sData.addressLine2 || sData.AddressLine2;
                 if(!purchase.City) purchase.City = resolvedCity;
                 if(!purchase.State) purchase.State = resolvedState;
                 if(!purchase.ZipCode) purchase.ZipCode = sData.postalCode || sData.PostalCode;
                 if(!purchase.PAN) purchase.PAN = sData.pan || sData.PAN;
            }
        } catch(err) { 
            console.error("Supplier/Address fetch failed", err); 
        }
    }

    // 3. Setup jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width; 
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);

    // Helper: Draw Box
    const drawBox = (x, y, w, h) => {
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.rect(x, y, w, h);
    };

    // Helper: Number to Words (Indian Format)
    const numberToWords = (num) => {
      const a = [
        "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
        "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
      ];
      const b = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
      ];

      const n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return "";
      
      let str = "";
      str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore " : "";
      str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh " : "";
      str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand " : "";
      str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred " : "";
      str += (Number(n[5]) !== 0) ? ((str !== "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) : "";
      
      return str.trim() + " Rupees Only";
    };

    // --- RENDER FUNCTIONS ---
    
    // Header Section
    const drawHeader = (y) => {
       // Title
       doc.setFont("helvetica", "bold");
       doc.setFontSize(10);
       doc.text(title, pageWidth / 2, y + 4, { align: "center" });
       
       // Main Header Box (Company Info)
       const boxTopY = y + 8;
       const boxH = 30;
       drawBox(margin, boxTopY, contentWidth, boxH);
       
       // Logo
       const logoPath = settings?.logoPath; 
       if(logoPath) {
           try {
               const baseUrl = serverURL.replace("/api", "");
               const fullLogoUrl = logoPath.startsWith("http") ? logoPath : `${baseUrl}/${logoPath}`;
               doc.addImage(fullLogoUrl, 'PNG', margin + 2, boxTopY + 2, 25, 25);
           } catch(e) {
               console.error("Logo error", e);
           }
       }

       // Company Name (Left Aligned in Right Block)
       // Define a starting X for the right block
       const blockX = 135; 

       const companyName = settings?.companyName || "";
       doc.setFontSize(16);
       doc.text(companyName, blockX, boxTopY + 8); // Default align is left
       
       // Address
       doc.setFontSize(8);
       doc.setFont("helvetica", "normal");
       const address = settings?.address || "";
       // split text relative to the remaining width (pageWidth - margin - blockX)
       const remainingWidth = pageWidth - margin - blockX - 2;
       const addressLines = doc.splitTextToSize(address, remainingWidth);
       doc.text(addressLines, blockX, boxTopY + 14);
       
       // Contact - Split rows
       // 1. Email
       doc.text(`Email: ${settings?.companyEmail || ""}`, blockX, boxTopY + 19);
       // 2. Phone
       doc.text(`Phone: ${settings?.phone || ""}`, blockX, boxTopY + 23);
       // 3. GSTIN
       doc.text(`GSTIN: ${settings?.gstin || settings?.GSTIN || ""}`, blockX, boxTopY + 27);
       
       return boxTopY + boxH;
    };

    // Supplier & Transport Section
    const drawSupplierSection = (y) => {
        const midX = margin + (contentWidth * 0.35); // Reverted to 0.35
        const rightX = pageWidth - margin - 50; 
        
        // --- PRE-CALCULATE HEIGHT ---
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        // Construct Address
        let finalAddrLines = [];
        const line1 = purchase.AddressLine1 || purchase.addressLine1;
        
        let otherParts = [];
        if(purchase.AddressLine2 || purchase.addressLine2) otherParts.push(purchase.AddressLine2 || purchase.addressLine2);
        if(purchase.State || purchase.state) otherParts.push(purchase.State || purchase.state);
        if(purchase.City || purchase.city) otherParts.push(purchase.City || purchase.city);
        if(purchase.ZipCode || purchase.postalCode) otherParts.push(purchase.ZipCode || purchase.postalCode);
        
        if (line1) {
             finalAddrLines.push(line1);
             if(otherParts.length > 0) finalAddrLines.push(otherParts.join(", "));
        } else {
             const full = purchase.Address || purchase.address || "";
             if (full) {
                 finalAddrLines.push(full);
             } else if (otherParts.length > 0) {
                 finalAddrLines.push(otherParts.join(", "));
             }
        }
        
        // Calculate needed height for Supplier
        const supplierWidth = (midX - margin) - 4;
        let supplierContentH = 14; 
        
        let calculatedLines = []; // Store them to reuse
        finalAddrLines.forEach(lineStr => {
             const wrapped = doc.splitTextToSize(lineStr, supplierWidth);
             calculatedLines.push(...wrapped);
        });

        supplierContentH += (calculatedLines.length * 3.5); // Reduced from 4
        
        const checkField = (val) => val ? 3.5 : 0;
        supplierContentH += checkField(purchase.email || purchase.Email);
        supplierContentH += checkField(purchase.Phone || purchase.phone);
        supplierContentH += checkField(purchase.PAN || purchase.pan);
        supplierContentH += checkField(purchase.supplierGSTIN || purchase.SupplierGSTIN || purchase.GSTIN || purchase.gstin);
        
        supplierContentH += 4; // Buffer

        const minHeight = 35;
        const sectionH = Math.max(minHeight, supplierContentH);

        // --- DRAW BOX ---
        drawBox(margin, y, contentWidth, sectionH);
        
        // Vertical Dividers
        doc.line(midX, y, midX, y + sectionH); 
        doc.line(rightX, y, rightX, y + sectionH); 
        doc.line(margin, y + 6, pageWidth - margin, y + 6); 

        // Headers
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Supplier Details", margin + 2, y + 4);
        doc.text("Transportation Details", midX + 2, y + 4);
        
        // --- COL 1: Supplier ---
        doc.setFont("helvetica", "bold");
        doc.text(purchase.supplierName || purchase.SupplierName || "", margin + 2, y + 10);
        
        doc.setFont("helvetica", "normal");
        
        // Render Address Lines
        let currentTextY = y + 14;
        calculatedLines.forEach(lineStr => {
             doc.text(lineStr, margin + 2, currentTextY);
             currentTextY += 3.5; // Reduced from 4
        });
        
        let detailsY = currentTextY; 
        const lineHeight = 3.5; 

        // Email if available?
        if (purchase.email || purchase.Email) {
             doc.text(`Email: ${purchase.email || purchase.Email}`, margin + 2, detailsY);
             detailsY += lineHeight;
        }
        
        if (purchase.Phone || purchase.phone) {
            doc.text(`Phone: ${purchase.Phone || purchase.phone}`, margin + 2, detailsY);
            detailsY += lineHeight;
        }

        // Add PAN logic
        const panVal = purchase.PAN || purchase.pan;
        if(panVal) {
             doc.text(`PAN: ${panVal}`, margin + 2, detailsY);
             detailsY += lineHeight;
        }
        
        const gstinVal = purchase.supplierGSTIN || purchase.SupplierGSTIN || purchase.GSTIN || purchase.gstin;
        if (gstinVal) {
             doc.text(`GSTIN: ${gstinVal}`, margin + 2, detailsY);
        }
        
        // --- COL 2: Transport ---
        doc.setFont("helvetica", "normal");
        const transportWidth = (rightX - midX) - 4;
        const vehicleText = `Vehicle Number: ${purchase.VehicleNo || purchase.vehicleNo || "-"}`;
        const vehicleLines = doc.splitTextToSize(vehicleText, transportWidth);
        doc.text(vehicleLines, midX + 2, y + 10);
        
        // --- COL 3: PO/Invoice Data ---
        doc.setFont("helvetica", "bold");
        doc.text("Invoice No:", rightX + 2, y + 10);
        doc.text("Date:", rightX + 2, y + 15);
        
        doc.setFont("helvetica", "normal");
        const dbVNo = purchase.InvoiceNo || purchase.invoiceNo || purchase.VNo || purchase.vno;
        const dbSeq = purchase.POSequence || purchase.poSequence;
        let finalDisp = "";

        if (dbVNo) {
             finalDisp = dbVNo;
        } else if (dbSeq) {
             finalDisp = String(dbSeq).padStart(4, '0');
        } else {
             finalDisp = String(purchase.id || purchase.Id).padStart(4, '0');
        }

        doc.text(finalDisp, pageWidth - margin - 2, y + 10, { align: "right" });
        doc.text(new Date(purchase.Date || purchase.date).toLocaleDateString(), pageWidth - margin - 2, y + 15, { align: "right" });

        return y + sectionH;
    };

    // --- PAGE GENERATION ---
    const startY = 10;
    
    // 1. Draw Header
    let currentY = drawHeader(startY);
    
    // 2. Supplier Section
    currentY = drawSupplierSection(currentY);

    // 3. Table Logic
    const isIGST = (parseFloat(purchase.IGSTRate || purchase.igstRate || 0) > 0);
    const globalIGST = parseFloat(purchase.IGSTRate || purchase.igstRate || 0);
    const globalCGST = parseFloat(purchase.CGSTRate || purchase.cgstRate || 0);
    const globalSGST = parseFloat(purchase.SGSTRate || purchase.sgstRate || 0);

    // HEADERS
    let tableHead = [];
    if (isIGST) {
      tableHead = [
        [
          { content: 'Sr.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Code', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Name of Product', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'HSN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Qty', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Rate', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Taxable', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'IGST', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Total', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
        ],
        [
          { content: '%', styles: { halign: 'center' } },
          { content: 'Amount', styles: { halign: 'center' } }
        ]
      ];
    } else {
      tableHead = [
        [
          { content: 'Sr.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Code', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Name of Product', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'HSN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Qty', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Rate', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Taxable', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'CGST', colSpan: 2, styles: { halign: 'center' } },
          { content: 'SGST', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Total', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
        ],
        [
          { content: '%', styles: { halign: 'center' } },
          { content: 'Amount', styles: { halign: 'center' } },
          { content: '%', styles: { halign: 'center' } },
          { content: 'Amount', styles: { halign: 'center' } }
        ]
      ];
    }

    // BODY
    let totalTaxable = 0;
    let totalIGST = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalGrand = 0;

    const isTaxApplicable = !(purchase.NoTax || purchase.noTax || (parseFloat(purchase.TotalTax || purchase.totalTax || 0) === 0));

    const tableBody = details.map((item, index) => {
        const qty = Number(item.Quantity || item.quantity || 0);  
        const rate = Number(item.UnitPrice || item.unitPrice || 0);
        
        // Taxable Value
        const taxable = (qty * rate) - (Number(item.Discount || item.discount || 0))        
        let rowIGST = 0, rowCGST = 0, rowSGST = 0;
        
        if (isIGST) {
             rowIGST = taxable * (globalIGST / 100);
        } else {
             rowCGST = taxable * (globalCGST / 100);
             rowSGST = taxable * (globalSGST / 100);
        }

        const rowTotal = taxable + rowIGST + rowCGST + rowSGST;

        // Accumulate
        totalTaxable += taxable;
        totalIGST += rowIGST;
        totalCGST += rowCGST;
        totalSGST += rowSGST;
        totalGrand += rowTotal;

        totalGrand += rowTotal;

        const rowData = [
            index + 1,
            item.Barcode || item.barcode || item.Product?.code || item.Product?.productCode || "", 
            item.productName || item.ProductName || item.Product?.name || "",
            item.HSNCode || item.hsnCode || item.Product?.hsnCode || item.Product?.HSNCode || "",
            `${qty}`,
            formatCurrency(rate),

            isTaxApplicable ? formatCurrency(taxable) : formatCurrency(taxable)
        ];

        if (isIGST) {
            rowData.push(`${globalIGST}%`, formatCurrency(rowIGST));
        } else {
            rowData.push(`${globalCGST}%`, formatCurrency(rowCGST), `${globalSGST}%`, formatCurrency(rowSGST));
        }
        
        rowData.push(formatCurrency(rowTotal));
        return rowData;
    });

    // Dynamic Height Calculation & Fillers
    const footerNeededSpace = 72; 
    const startTableY = currentY;
    const availableSpace = pageHeight - margin - 10 - startTableY - footerNeededSpace; 
    const estRowHeight = 8; 
    const dynamicMinRows = Math.floor(availableSpace / estRowHeight);
    
    const minTableRows = Math.max(5, dynamicMinRows);
    while(tableBody.length < minTableRows) {
        // Match column count! 
        // IGST: 9 columns. Non-IGST: 11 columns.
        // Match column count! 
        // IGST: 10 cols, Non-IGST: 12 cols
        const emptyRow = isIGST ? ["","","","","","","","","",""] : ["","","","","","","","","","","",""];
        tableBody.push(emptyRow);
    }

    // Footer Row in Table
    const footerRow = [
      { content: 'Total', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: details.reduce((a,b)=>a+Number(b.Quantity||b.quantity||0),0).toFixed(2), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'right' } },
      { content: totalTaxable.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
    ];
    
    if (isIGST) {
         footerRow.push({ content: '', styles: { halign: 'center' } });
         footerRow.push({ content: totalIGST.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } });
    } else {
         footerRow.push({ content: '', styles: { halign: 'center' } });
         footerRow.push({ content: totalCGST.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } });
         footerRow.push({ content: '', styles: { halign: 'center' } });
         footerRow.push({ content: totalSGST.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } });
    }
    footerRow.push({ content: totalGrand.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } });

    tableBody.push(footerRow);

    // DRAW TABLE
    doc.autoTable({
        startY: currentY,         
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: 0,
            lineWidth: 0.2,
            textColor: 0,
            valign: 'middle',
            halign: 'center'
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.2,
            lineColor: 0
        },
        didParseCell: (data) => {
             if (data.row.index >= details.length && data.row.index < tableBody.length - 1) {
                data.cell.styles.lineWidth = 0;
             }
        },
        didDrawCell: (data) => {
             if (data.section === 'head' && data.row.index === 0) {
                 doc.setDrawColor(0);
                 doc.setLineWidth(0.5);
                 doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
             }
             if (data.row.index >= details.length && data.row.index < tableBody.length - 1) {
                 doc.setDrawColor(0);
                 doc.setLineWidth(0.2);
                 doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
                 doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
             }
        }
    });

    // --- AFTER TABLE (Totals & Footer) ---
    let finalY = doc.lastAutoTable.finalY;
    const requiredFooterH = 70; 
    if (finalY + requiredFooterH > pageHeight - margin) {
        doc.addPage();
        finalY = margin + 10;
    }

    const startFooterY = finalY;
    const leftColW = (contentWidth * 0.55); 
    const rightColW = contentWidth - leftColW;
    const midX = margin + leftColW;

    // --- RIGHT COLUMN: TOTALS ---
    let rY = startFooterY;
    const rightRowH = 7; 
    const rValX = pageWidth - margin - 8;
    const rLabelX = midX + 2;
    
    const drawRightRow = (label, val, h=7, bold=false) => {
        if(bold) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(label, rLabelX, rY + 5);
        doc.text(val, rValX, rY + 5, { align: "right" });
        doc.line(midX, rY + h, pageWidth - margin, rY + h);
        rY += h;
    };
    
    drawRightRow("Taxable Amount", totalTaxable.toFixed(2), rightRowH);
    if (isIGST) {
        drawRightRow("Add : IGST", totalIGST.toFixed(2), rightRowH);
    } else {
        drawRightRow("Add : CGST", totalCGST.toFixed(2), rightRowH);
        drawRightRow("Add : SGST", totalSGST.toFixed(2), rightRowH);
    }
    drawRightRow("Total Tax", (totalIGST + totalCGST + totalSGST).toFixed(2), rightRowH);
    
    const curName = settings?.currency || "Rupees";
    let currencySymbol = settings?.currencySymbol || "Rs.";
    if(currencySymbol.includes("₹")) currencySymbol = "Rs.";

    drawRightRow("Total Amount including Tax", `${currencySymbol} ${totalGrand.toFixed(2)}`, rightRowH + 2, true);
    
    const endTotalsY = rY;
    doc.rect(midX, startFooterY, rightColW, endTotalsY - startFooterY);

    // --- LEFT COLUMN: WORDS & BANK ---
    let lY = startFooterY;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Total in words", margin + 2, lY + 4);
    doc.line(margin, lY + 6, midX, lY + 6);
    lY += 6;
    
    doc.setFont("helvetica", "bold"); 
    doc.setFontSize(9);
    const amountWord = numberToWords(Math.round(totalGrand));
    const wordLines = doc.splitTextToSize(amountWord, leftColW - 4);
    doc.text(wordLines, margin + 4, lY + 4);
    lY += 10; 
    doc.line(margin, lY, midX, lY); 

    // Terms
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Terms and Conditions", margin + 2, lY + 4);
    lY += 5;
    
    doc.setFont("helvetica", "normal");
    const terms = [
        "1. Adherence to the product specification is a must.",
        "2. Goods once sold will not be taken back."
    ];
    terms.forEach(term => {
        doc.text(term, margin + 2, lY + 3);
        lY += 4;
    });
    
    const finalFooterY = pageHeight - margin;
    doc.rect(margin, startFooterY, leftColW, finalFooterY - startFooterY);
    
    // Signatory
    let rBotY = endTotalsY;
    doc.line(midX, rBotY, pageWidth - margin, rBotY); 
    
    // Right Bottom Box
    doc.rect(midX, endTotalsY, rightColW, finalFooterY - endTotalsY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`For, ${settings?.companyName || ""}`, midX + (rightColW/2), rBotY + 8, { align: "center" });
    
    const signatureBaseY = pageHeight - margin - 10;
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signatory", midX + (rightColW/2), signatureBaseY, { align: "center" });

    const fileId = purchase.InvoiceNo || purchase.invoiceNo || purchase.VNo || purchase.vno || purchase.Id || purchase.id || "Document";
    doc.save(`PurchaseInvoice_${fileId}.pdf`);
    toast.dismiss(toastId);
    toast.success("PDF Generated");

  } catch (error) {
    console.error(error);
    toast.dismiss();
    toast.error("Failed to generate PDF");
  }
};
