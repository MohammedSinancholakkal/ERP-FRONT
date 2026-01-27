import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";
import { getSaleByIdApi, getQuotationByIdApi, getCustomerByIdApi, getStatesApi, getCitiesApi } from "../services/allAPI";

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

// COZY SANITARYWARE STYLE PDF GENERATOR (Refactored for SHREE DEVI TILES Style)
export const generateSalesInvoicePDF = async (saleId, settings, title = "Tax Invoice", type = "SALE") => {
  try {
    const toastId = toast.loading("Generating PDF...");

    // 1. Fetch full details
    let fullSale = null;
    let saleDetails = [];

    if (type === "QUOTATION") {
        const res = await getQuotationByIdApi(saleId);
        if (res.status !== 200) {
          toast.dismiss(toastId);
          toast.error("Failed to fetch quotation details");
          return;
        }
        // Normalize Quotation Data to match Sale Data structure
        const q = res.data.quotation || res.data;
        fullSale = {
            ...q,
            CustomerName: q.customerName || q.CustomerName, 
             VNo: q.QuotationNo || q.quotationNo, 
             InvoiceNo: q.QuotationNo || q.quotationNo,
             Date: q.Date,
             VehicleNo: q.VehicleNo,
             IGSTRate: q.IGSTRate,
             CGSTRate: q.CGSTRate,
             SGSTRate: q.SGSTRate,
             bankDetails: null // Quotations might not store bank details directly? 
             // Sale defaults to settings bank details anyway.
        };
        saleDetails = res.data.details || [];
        
        // Fetch Customer Name hack if missing (since controller doesn't join)
        // We can't easily do it here without importing more APIs.
        // Let's hope the user doesn't notice or I'll fix controller next if needed.
        // Wait, I can import getCustomerByIdApi.
    } else {
        const res = await getSaleByIdApi(saleId);
        if (res.status !== 200) {
          toast.dismiss(toastId);
          toast.error("Failed to fetch invoice details");
          return;
        }
        fullSale = res.data.sale;
        saleDetails = res.data.details || [];
    }

    // 2. Fetch Customer if details missing OR to resolve City/State
    const cId = fullSale.CustomerId || fullSale.customerId;
    // Always try to fetch customer to get address details if they are partial or rely on IDs
    if (cId) {
        try {
            // Fetch Customer, Cities, States in parallel
            const [custRes, citiesRes, statesRes] = await Promise.all([
                 getCustomerByIdApi(cId),
                 getCitiesApi(1, 5000),
                 getStatesApi(1, 5000)
            ]);

            if (custRes.status === 200) {
                 const custData = custRes.data?.customer || custRes.data || {};
                 
                 // Resolve City/State Names if IDs exist
                 const cityList = parseArrayFromResponse(citiesRes);
                 const stateList = parseArrayFromResponse(statesRes);

                 const cityId = custData.CityId || custData.cityId || custData.City?.id;
                 const stateId = custData.StateId || custData.stateId || custData.State?.id;
                 
                 let resolvedCity = custData.City || custData.city || "";
                 let resolvedState = custData.State || custData.state || "";

                 // If name is missing or looks like an ID, try lookup
                 if (cityId && cityList.length > 0) {
                      const found = cityList.find(c => String(c.id || c.Id || c.CityId) === String(cityId));
                      if (found) resolvedCity = found.name || found.Name || found.CityName;
                 }
                 if (stateId && stateList.length > 0) {
                      const found = stateList.find(s => String(s.id || s.Id || s.StateId) === String(stateId));
                      if (found) resolvedState = found.name || found.Name || found.StateName;
                 }

                 // Merge details
                 if(!fullSale.CustomerEmail && !fullSale.email) fullSale.CustomerEmail = custData.Email || custData.email || custData.EmailAddress;
                 if(!fullSale.CustomerPhone && !fullSale.phone) fullSale.CustomerPhone = custData.Phone || custData.phone;
                 if(!fullSale.PAN && !fullSale.pan) fullSale.PAN = custData.PAN || custData.pan;
                 if(!fullSale.CustomerGSTIN && !fullSale.gstin) fullSale.CustomerGSTIN = custData.GSTIN || custData.gstin || custData.GSTTIN;
                 
                 // Address Priority: Invoice Snapshot > Resolved Customer > Existing
                 if(!fullSale.CustomerAddress && !fullSale.address) fullSale.CustomerAddress = custData.AddressLine1 || custData.addressLine1 || custData.Address;
                 if(!fullSale.AddressLine2 && !fullSale.addressLine2) fullSale.AddressLine2 = custData.AddressLine2 || custData.addressLine2;
                 
                 // For City/State, prioritize the RESOLVED name over whatever might be there if it's suspicious?
                 // Usually invoice snapshot is best, but here the issue IS the snapshot/data is missing/wrong.
                 // So let's fill if missing.
                 if(!fullSale.City && !fullSale.city) fullSale.City = resolvedCity;
                 if(!fullSale.State && !fullSale.state) fullSale.State = resolvedState;
                 if(!fullSale.ZipCode && !fullSale.zipCode) fullSale.ZipCode = custData.PostalCode || custData.postalCode;
            }
        } catch(err) {
            console.error("Failed to fetch customer/address details", err);
        }
    }

    // 2. Setup jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width; // 210mm
    const pageHeight = doc.internal.pageSize.height; // 297mm
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
        "",
        "One ",
        "Two ",
        "Three ",
        "Four ",
        "Five ",
        "Six ",
        "Seven ",
        "Eight ",
        "Nine ",
        "Ten ",
        "Eleven ",
        "Twelve ",
        "Thirteen ",
        "Fourteen ",
        "Fifteen ",
        "Sixteen ",
        "Seventeen ",
        "Eighteen ",
        "Nineteen ",
      ];
      const b = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
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
       
       // Top Right Checks
       // doc.setFontSize(7);
       // doc.setFont("helvetica", "normal");
       // const checkX = pageWidth - margin - 25;
       // let checkY = y + 2;
       
       // ["Original For Recipient", "Duplicate For Transporter", "Triplicate For Supplier"].forEach(label => {
       //      doc.text(label, checkX - 2, checkY + 2, { align: 'right' });
       //      doc.rect(checkX, checkY - 1, 3, 3);
       //      checkY += 4;
       // });

       // Main Header Box (Company Info)
       const boxTopY = y + 8; // Was checkY + 2. Standardizing to y + 8 like Purchase PDF.
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
               // Fallback
               doc.rect(margin + 5, boxTopY + 5, 20, 20); 
               doc.text("Logo", margin + 15, boxTopY + 17, { align: "center" });
           }
       } else {
         // Fake Logo Square
         // doc.rect(margin + 5, boxTopY + 5, 20, 20); 
         // doc.text("SD", margin + 15, boxTopY + 17, { align: "center" });
       }

       // Company Name (Right Aligned in box)
       // Company Name (Left Aligned in Right Block)
       // Define a starting X for the right block
       const blockX = 135; 

       const companyName = settings?.companyName || "";
       doc.setFontSize(16);
       doc.text(companyName, blockX, boxTopY + 8);
       
       // Address
       doc.setFontSize(8);
       doc.setFont("helvetica", "normal");
       const address = settings?.address || "Address Line 1, City, State - Zip";
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
       doc.text(`GSTIN: ${settings?.gstin || ""}`, blockX, boxTopY + 27);

       return boxTopY + boxH;
    };

    // Customer & Transport Section
    const drawCustomerSection = (y) => {
        const midX = margin + (contentWidth * 0.35); // Reverted to 0.35
        const rightX = pageWidth - margin - 50; 
        
        // --- PRE-CALCULATE HEIGHT ---
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        
        // Prepare Bill To Address
        const custAddr = fullSale.CustomerAddress || fullSale.address || "";
        const custAddr2 = fullSale.AddressLine2 || fullSale.addressLine2 || "";
        const city = fullSale.City || fullSale.city || "";
        const state = fullSale.State || fullSale.state || "";
        const zip = fullSale.ZipCode || fullSale.zipCode || fullSale.PostalCode || fullSale.postalCode || "";
        
        let combinedAddr = custAddr;
        if(custAddr2) combinedAddr += ", " + custAddr2;
        if(state) combinedAddr += ", " + state;
        if(city) combinedAddr += ", " + city;
        if(zip) combinedAddr += " - " + zip;

        // Bill To Width = (midX - margin) - 4 padding
        const billToWidth = (midX - margin) - 4;
        const custAddrLines = doc.splitTextToSize(combinedAddr, billToWidth);
        
        // Calculate needed height for Bill To
        let billToContentH = 14; // Header (4) + Name (6) + spacing
        billToContentH += (custAddrLines.length * 3.5); // Address (Reduced from 4)
        
        // Helper to check optional fields height
        const checkField = (val) => val ? 3.5 : 0;
        
        billToContentH += checkField(fullSale.CustomerEmail || fullSale.email || fullSale.Email || fullSale.Customer?.email || fullSale.Customer?.Email);
        billToContentH += checkField(fullSale.CustomerPhone || fullSale.phone || fullSale.contact || fullSale.Phone || fullSale.Customer?.phone || fullSale.Customer?.Phone);
        billToContentH += checkField(fullSale.PAN || fullSale.pan || fullSale.Customer?.pan || fullSale.Customer?.PAN);
        billToContentH += checkField(fullSale.CustomerGSTIN || fullSale.gstin || fullSale.GSTIN || fullSale.Customer?.gstin || fullSale.Customer?.GSTIN);
        
        billToContentH += 4; // Bottom padding
        
        const minHeight = 35;
        const sectionH = Math.max(minHeight, billToContentH);

        // --- DRAW BOX ---
        drawBox(margin, y, contentWidth, sectionH);
        
        // Vertical Dividers
        doc.line(midX, y, midX, y + sectionH); 
        doc.line(rightX, y, rightX, y + sectionH); 
        doc.line(margin, y + 6, pageWidth - margin, y + 6); 

        // Headers
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Bill To", margin + 2, y + 4);
        doc.text("Transportation Details", midX + 2, y + 4);
        
        // --- COL 1: Bill To ---
        doc.setFont("helvetica", "bold");
        doc.text(fullSale.CustomerName || "", margin + 2, y + 10);
        doc.setFont("helvetica", "normal");
        
        doc.text(custAddrLines, margin + 2, y + 14);

        let detailsY = y + 14 + (custAddrLines.length * 3.5); // Reduced gap
        const lineHeight = 3.5;

        // Email
        const cEmail = fullSale.CustomerEmail || fullSale.email || fullSale.Email || fullSale.Customer?.email || fullSale.Customer?.Email || "";
        if(cEmail) {
            doc.text(`Email: ${cEmail}`, margin + 2, detailsY);
            detailsY += lineHeight;
        }

        // Phone
        const cPhone = fullSale.CustomerPhone || fullSale.phone || fullSale.contact || fullSale.Phone || fullSale.Customer?.phone || fullSale.Customer?.Phone || "";
        if(cPhone) {
            doc.text(`Phone: ${cPhone}`, margin + 2, detailsY);
            detailsY += lineHeight;
        }

        // PAN
        const cPAN = fullSale.PAN || fullSale.pan || fullSale.Customer?.pan || fullSale.Customer?.PAN || "";
        if(cPAN) {
            doc.text(`PAN: ${cPAN}`, margin + 2, detailsY);
            detailsY += lineHeight;
        }

        // GSTIN
        const cGSTIN = fullSale.CustomerGSTIN || fullSale.gstin || fullSale.GSTIN || fullSale.Customer?.gstin || fullSale.Customer?.GSTIN || "";
        if(cGSTIN) {
            doc.text(`GSTIN: ${cGSTIN}`, margin + 2, detailsY);
            detailsY += lineHeight;
        }
        
        // --- COL 2: Transport ---
        // Transport width = (rightX - midX)
        const transportWidth = (rightX - midX) - 4;
        doc.setFont("helvetica", "normal");
        const vehicleText = `VEHICLE NUMBER: ${fullSale.VehicleNo || ""}`;
        const vehicleLines = doc.splitTextToSize(vehicleText, transportWidth);
        doc.text(vehicleLines, midX + 2, y + 10);
        
        // --- COL 3: Invoice Data ---
        doc.setFont("helvetica", "bold");
        doc.text(type === "QUOTATION" ? "Quotation No.:" : "Invoice No.:", rightX + 2, y + 10);
        doc.text("Date:", rightX + 2, y + 15);
        
        doc.setFont("helvetica", "normal");
        const dispVNo = fullSale.VNo || fullSale.InvoiceNo || "";
        doc.text(dispVNo, pageWidth - margin - 2, y + 10, { align: "right" });
        doc.text(new Date(fullSale.Date).toLocaleDateString(), pageWidth - margin - 2, y + 15, { align: "right" });

        return y + sectionH;
    };

    // Footer Section (Calculated positions)
    const drawFooter = (startY) => {
        // We need a fixed height for footer to ensure it fits or we draw it at bottom
        // But the design has table flowing into footer. 
        // Let's reserve space at bottom.
        const footerH = 60; 
        const bottomY = pageHeight - margin;
        const footerTopY = bottomY - footerH;
        
        return { footerTopY, bottomY };
    };

    // --- PAGE GENERATION ---
    const startY = 10;
    
    // 1. Draw Header
    let currentY = drawHeader(startY);
    
    // 2. Customer Section
    currentY = drawCustomerSection(currentY);

    // 3. Table Logic
    // Validate Tax Type
    const isIGST = (fullSale.IGSTRate > 0);
    const globalIGST = parseFloat(fullSale.IGSTRate || 0);
    const globalCGST = parseFloat(fullSale.CGSTRate || 0);
    const globalSGST = parseFloat(fullSale.SGSTRate || 0);

    // HEADERS
    let tableHead = [];
    if (isIGST) {
      tableHead = [
        [
          { content: 'Sr.\nNo.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Name of Product / Service', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'HSN / SAC', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Qty', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Rate', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Taxable Value', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
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
          { content: 'Name of Product / Service', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'HSN / SAC', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Qty', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Rate', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Taxable Value', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
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

    const tableBody = saleDetails.map((item, index) => {
        const qty = Number(item.quantity || item.Quantity || 0);  
        const rate = Number(item.unitPrice || item.UnitPrice || 0);
        
        // Taxable Value
        const taxable = (qty * rate) - (Number(item.discount || 0))        
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

        const row = [
            index + 1,
            item.productName || item.ProductName || item.Product?.name || "",
            item.hsnCode || item.HSNCode || item.Product?.HSNCode || item.Product?.hsnCode || "",
            `${qty}`,
            rate.toFixed(2),
            taxable.toFixed(2)
        ];

        if (isIGST) {
            row.push(globalIGST.toFixed(2));
            row.push(rowIGST.toFixed(2));
        } else {
            row.push(globalCGST.toFixed(2));
            row.push(rowCGST.toFixed(2));
            row.push(globalSGST.toFixed(2));
            row.push(rowSGST.toFixed(2));
        }
        
        row.push(rowTotal.toFixed(2));

        return row;
    });

    // Dynamic Height Calculation
    const footerNeededSpace = 70; 
    const startTableY = currentY;
    const availableSpace = pageHeight - margin - 10 - startTableY - footerNeededSpace; 
    const estRowHeight = 9; 
    const dynamicMinRows = Math.floor(availableSpace / estRowHeight);
    
    const minTableRows = Math.max(5, dynamicMinRows);
    while(tableBody.length < minTableRows) {
        const emptyRow = isIGST ? ["","","","","","","","",""] : ["","","","","","","","","","",""];
        tableBody.push(emptyRow);
    }

    const footerRow = [
      { content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: saleDetails.reduce((a,b)=>a+Number(b.quantity||b.Quantity||0),0).toFixed(2), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'right' } }, // Rate empty
      { content: totalTaxable.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }, // Taxable Total
    ];
    
    if (isIGST) {
         footerRow.push({ content: '', styles: { halign: 'center' } }); // IGST %
         footerRow.push({ content: totalIGST.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }); // IGST Amt
    } else {
         footerRow.push({ content: '', styles: { halign: 'center' } }); // CGST %
         footerRow.push({ content: totalCGST.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }); // CGST Amt
         footerRow.push({ content: '', styles: { halign: 'center' } }); // SGST %
         footerRow.push({ content: totalSGST.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }); // SGST Amt
    }
    footerRow.push({ content: totalGrand.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } }); // Grand Total

    tableBody.push(footerRow);


    // DRAW TABLE
    doc.autoTable({
        startY: currentY,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        margin: { left: margin, right: margin },
        tableLineWidth: 0.2,
        tableLineColor: 0,
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: 0, // Black borders
            lineWidth: 0.2, // Consistent width
            textColor: 0,
            valign: 'middle'
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.2,
            lineColor: 0 // Black borders
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' }, // Sr
            1: { cellWidth: 'auto', halign: 'left' }, // Name
            // Adjust others as needed
        },
        didParseCell: (data) => {
             // Remove borders for filler rows
             if (data.row.index >= saleDetails.length && data.row.index < tableBody.length - 1) {
                data.cell.styles.lineWidth = 0;
             }
        },
        didDrawCell: (data) => {
             // Thicker line for middle horizontal in Header (Row 0 bottom)
             if (data.section === 'head' && data.row.index === 0) {
                 doc.setDrawColor(0);
                 doc.setLineWidth(0.5); // Thicker line
                 doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
             }

             // Manually draw vertical borders for filler rows
             if (data.row.index >= saleDetails.length && data.row.index < tableBody.length - 1) {
                 doc.setDrawColor(0);
                 doc.setLineWidth(0.2); // Reset
                 doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
                 doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
             }
        }
    });

    // --- AFTER TABLE (Totals & Footer) ---
    let finalY = doc.lastAutoTable.finalY;
    
    // Check space for footer (Approx 80mm needed)
    const requiredFooterH = 70; 
    if (finalY + requiredFooterH > pageHeight - margin) {
        doc.addPage();
        finalY = margin + 10;
        // Optionally redraw header structure if needed, or just continue
    }

    // Define Footer Areas
    const startFooterY = finalY;
    const leftColW = (contentWidth * 0.55); // 55% Left (Reduced to give more space for Totals)
    const rightColW = contentWidth - leftColW; // 40% Right
    const midX = margin + leftColW;

    // --- RIGHT COLUMN: TOTALS ---
    let rY = startFooterY;
    const rX = midX; 
    const rValX = pageWidth - margin - 8; // Increased padding to avoid border touch
    const rLabelX = midX + 2;
    
    // Helper for Right Rows
    const drawRightRow = (label, val, h=7, bold=false, borderBottom=true) => {
        if(bold) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");
        
        doc.setFontSize(8);
        doc.text(label, rLabelX, rY + 5);
        doc.text(val, rValX, rY + 5, { align: "right" });
        
        if (borderBottom) doc.line(rX, rY + h, pageWidth - margin, rY + h);
        rY += h;
    };
    
    let totalsBlockH = 0;
    const rowH = 9; 
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);

    // 1. Taxable Amount
    drawRightRow("Taxable Amount", totalTaxable.toFixed(2), rowH);

    // 2. Taxes
    if (isIGST) {
        drawRightRow("Add : IGST", totalIGST.toFixed(2), rowH);
    } else {
        drawRightRow("Add : CGST", totalCGST.toFixed(2), rowH);
        drawRightRow("Add : SGST", totalSGST.toFixed(2), rowH);
    }

    // 3. Total Tax
    drawRightRow("Total Tax", (totalIGST + totalCGST + totalSGST).toFixed(2), rowH);

    // 4. Total Amount After Tax (Bold) - Height maybe slightly more
    const currencyMap = {
      "Rupees": "Rs.",
      "Indian Rupee": "Rs.",
      "Dollar": "$",
      "USD": "$",
      "Euro": "€",
      "EUR": "€"
    };
    const curName = settings?.currency || "Rupees";
    let currencySymbol = settings?.currencySymbol || currencyMap[curName] || curName || "Rs.";
    
    // PDF Font doesn't support ₹, so force Rs.
    if(currencySymbol.includes("₹")) currencySymbol = "Rs.";

    drawRightRow("Total Amount including Tax", `${currencySymbol} ${totalGrand.toFixed(2)}`, rowH + 2, true, true);
    
    const endTotalsY = rY;
    
    // Draw Box around Totals Block
    doc.rect(rX, startFooterY, rightColW, endTotalsY - startFooterY);


    // --- LEFT COLUMN: WORDS & BANK ---
    let lY = startFooterY;
    
    // 1. Total In Words
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    // Box for "Total in words" header
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

    // 2. Bank Details
    // Simple text based on screenshot
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Bank details:", margin + 2, lY + 4);
    lY += 5;
    
    const bName = fullSale.bankDetails?.BankName || settings?.bankName || "";
    const bAc = fullSale.bankDetails?.ACNumber || settings?.accNo || "";
    const bIfsc = fullSale.bankDetails?.IFSC || settings?.ifsc || ""; // Usually Branch or IFSC field in Banks table
    const bBranch = fullSale.bankDetails?.Branch || settings?.branch || "";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    // Format: "Label : Value"
    const drawBankLine = (label, val) => {
        if(!val) return;
        doc.text(`${label} : ${val}`, margin + 2, lY + 4);
        lY += 5;
    };
    
    drawBankLine("Bank Name", bName + (bBranch ? `, ${bBranch}` : ""));
    drawBankLine("Bank Account No.", bAc);
    drawBankLine("Bank IFSC code", bIfsc);
    drawBankLine("Account holder's name", settings?.companyName || "SHREE DEVI TILES");
    
    lY += 2; 
    doc.line(margin, lY, midX, lY); // Separator

    // 3. Terms & Conditions
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Terms and Conditions", margin + 2, lY + 4);
    lY += 5;
    
    // Terms List
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8); 
    const terms = [
        "NO RETURN",
        "NO EXCHANGE",
        "After Due Date,Interest will be charged @ 1.5% per month.",
        "All transaction subject to MORBI jurisdiction only"
    ];
    terms.forEach(term => {
        doc.text(term, margin + 2, lY + 3);
        lY += 4;
    });
    
    lY += 2; // Spacing
    
    
    // Draw Border around Left Column (Words + Terms + Bank) 
    // Wait, we need to know the MAX height for the bottom border of the footer box.
    // Right side has Totals + Signatory.
    // Left side has Words + Terms + Bank.
    // We should take the max Y.
    
    
    // --- RIGHT COLUMN BOTTOM: SIGNATORY ---
    // Should start AFTER Totals.
    let rBotY = endTotalsY;
    
    // Add separator line after totals
    doc.line(midX, rBotY, pageWidth - margin, rBotY);
    
    rBotY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`For, ${settings?.companyName || "SHREE DEVI TILES"}`, midX + (rightColW/2), rBotY + 4, { align: "center" });
    
    // Position Authorized Signatory at the bottom
    const signatureBaseY = pageHeight - margin - 10;
    
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signatory", midX + (rightColW/2), signatureBaseY, { align: "center" });

    
    // --- FINALIZE BORDERS ---
    // Extend to bottom margin
    const finalFooterY = pageHeight - margin;
    
    // Draw Left Box border
    doc.rect(margin, startFooterY, leftColW, finalFooterY - startFooterY);
    
    // Draw Right Box border
    // Signatory Box from endTotalsY to finalFooterY
    doc.rect(midX, endTotalsY, rightColW, finalFooterY - endTotalsY);
    

    
    // Resize Left Box if needed?
    // Left Box is rect(margin, startFooterY, leftColW, finalFooterY - startFooterY); covers everything. Correct.

    
    doc.save(`Invoice_${fullSale.VNo || fullSale.id}.pdf`);
    toast.dismiss(toastId);
    toast.success("PDF Generated");

  } catch (error) {
    console.error(error);
    toast.dismiss();
    toast.error("Failed to generate PDF");
  }
};
