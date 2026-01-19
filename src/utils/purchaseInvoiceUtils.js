import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";
import { getPurchaseByIdApi, getSuppliersApi } from "../services/allAPI";
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

    // 2. Fetch Supplier if name is missing (common in Purchase API)
    if (!purchase.supplierName && !purchase.SupplierName && purchase.SupplierId) {
        try {
            // Using getSuppliersApi as fallback since getSupplierById might not be available or imported
            const supRes = await getSuppliersApi(1, 1000); 
            if (supRes.status === 200) {
                 const records = supRes.data.records || supRes.data;
                 const found = records.find(s => s.id == purchase.SupplierId);
                 if (found) {
                     purchase.supplierName = found.companyName;
                     purchase.Address = found.address;
                     purchase.Phone = found.phone;
                     purchase.GSTIN = found.gstin || found.vatNo; 
                     purchase.email = found.email;
                 }
            }
        } catch(err) { 
            console.error("Supplier fetch failed", err); 
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

       // Company Name (Right Aligned in box)
       const companyName = settings?.companyName || "";
       doc.setFontSize(16);
       doc.text(companyName, pageWidth - margin - 5, boxTopY + 8, { align: "right" });
       
       // Address
       doc.setFontSize(8);
       doc.setFont("helvetica", "normal");
       const address = settings?.address || "";
       const addressLines = doc.splitTextToSize(address, 100);
       doc.text(addressLines, pageWidth - margin - 5, boxTopY + 14, { align: "right" });
       
       // Contact
       doc.text(`Phone no: ${settings?.phone || ""} Email: ${settings?.companyEmail || ""}`, pageWidth - margin - 5, boxTopY + 22, { align: "right" });
       doc.text(`GSTIN: ${settings?.gstin || settings?.GSTIN || ""}`, pageWidth - margin - 5, boxTopY + 26, { align: "right" });

       return boxTopY + boxH;
    };

    // Supplier & Transport Section
    const drawSupplierSection = (y) => {
        const sectionH = 35;
        drawBox(margin, y, contentWidth, sectionH);
        
        const midX = margin + (contentWidth * 0.35); 
        const rightX = pageWidth - margin - 50; 
        
        // Vertical Dividers
        doc.line(midX, y, midX, y + sectionH); 
        doc.line(rightX, y, rightX, y + sectionH); 
        doc.line(margin, y + 6, pageWidth - margin, y + 6); // Headers line

        // Headers
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Supplier Details", margin + 2, y + 4);
        doc.text("Transportation Details", midX + 2, y + 4);
        
        // --- COL 1: Supplier ---
        doc.setFont("helvetica", "bold");
        doc.text(purchase.supplierName || purchase.SupplierName || "", margin + 2, y + 10);
        
        doc.setFont("helvetica", "normal");
        const suppAddr = purchase.Address || purchase.address || "";
        const suppAddrLines = doc.splitTextToSize(suppAddr, (midX - margin) - 4);
        doc.text(suppAddrLines, margin + 2, y + 14);


        let detailsY = y + 14 + (suppAddrLines.length * 4);  // approx 3 units per line height
        
        if (purchase.Phone || purchase.phone) {
            doc.text(`Phone: ${purchase.Phone || purchase.phone}`, margin + 2, detailsY);
            detailsY += 4;
        }
        
        const gstinVal = purchase.supplierGSTIN || purchase.SupplierGSTIN || purchase.GSTIN || purchase.gstin;
        if (gstinVal) {
             doc.text(`GSTIN: ${gstinVal}`, margin + 2, detailsY);
        }
        
        // --- COL 2: Transport ---
        doc.setFont("helvetica", "normal");
        doc.text("Vehicle Number:", midX + 2, y + 10);
        doc.text(purchase.VehicleNo || purchase.vehicleNo || "-", midX + 2, y + 15);
        
        // --- COL 3: PO/Invoice Data ---
        doc.setFont("helvetica", "bold");
        doc.text("Invoice No:", rightX + 2, y + 10); // Changed from PO No to Invoice No
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
          { content: 'Name of Product', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
          { content: 'HSN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Qty', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Rate', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
          { content: 'Taxable', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
          { content: 'IGST', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Total', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } }
        ],
        [
          { content: '%', styles: { halign: 'center' } },
          { content: 'Amount', styles: { halign: 'right' } }
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
            isTaxApplicable ? formatCurrency(taxable) : ""
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
    const footerNeededSpace = 85; 
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
      { content: isTaxApplicable ? totalTaxable.toFixed(2) : "", styles: { halign: 'right', fontStyle: 'bold' } },
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
    const requiredFooterH = 85; 
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
    const rightRowH = 9; 
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
    
    drawRightRow("Taxable Amount", isTaxApplicable ? totalTaxable.toFixed(2) : "", rightRowH);
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
