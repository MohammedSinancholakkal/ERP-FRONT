import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";
import { getSaleByIdApi } from "../services/allAPI";

// COZY SANITARYWARE STYLE PDF GENERATOR
export const generateSalesInvoicePDF = async (saleId, settings) => {
  try {
    const toastId = toast.loading("Generating PDF...");

    // 1. Fetch full details
    const res = await getSaleByIdApi(saleId);
    if (res.status !== 200) {
      toast.dismiss(toastId);
      toast.error("Failed to fetch invoice details");
      return;
    }
    const fullSale = res.data.sale;
    const saleDetails = res.data.details || [];

    // 2. Setup jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width; // ~210mm
    const pageHeight = doc.internal.pageSize.height; // ~297mm
    const margin = 12; 
    const contentWidth = pageWidth - (margin * 2);

    // Layout Constants
    const headerH = 40;
    const infoGridH = 65; 
    const footerH = 65; 
    const tableStartY = 124;
    const footerStartY = pageHeight - margin - footerH;

    // Colors
    const cozyBlue = [25, 55, 109];
    const cozyGray = [230, 230, 230];
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    const textDark = [25, 55, 109];

    // --- DRAWING HELPERS ---
    const drawBox = (x, y, w, h) => doc.rect(x, y, w, h);

    const drawHeader = () => {
       // 1. Blue Background
       doc.setFillColor(...cozyBlue);
       doc.rect(0, 0, pageWidth, headerH, "F");
   
       // 2. Left Gray Polygon
       doc.setFillColor(...cozyGray);
       doc.rect(0, 0, 75, headerH, 'F');
       doc.triangle(75, 0, 85, headerH/2, 75, headerH, 'F');
   
       // 3. Company Name
       doc.setTextColor(...textDark);
       doc.setFont("helvetica", "bold");
       
       const companyName = settings?.companyName || "Cozy";
       let fontSize = 26;
       doc.setFontSize(fontSize);
       
       const maxNameW = 70; // Fits within 0-75 gray box
       while (doc.getTextWidth(companyName) > maxNameW && fontSize > 8) {
           fontSize -= 1;
           doc.setFontSize(fontSize);
       }
       
       // Center at Y=22 for better vertical alignment since subtitle is removed
       doc.text(companyName, 37.5, 22, { align: "center" });
   
       // "Sanitaryware LLP" REMOVED

       // 4. Vertical White Strip
       const stripX = 90;
       const stripW = 8;
       const stripY = 5;
       const stripH = 30;
       
       doc.setFillColor(...white);
       doc.triangle(stripX, stripY + 2, stripX + stripW, stripY + 2, stripX + (stripW/2), stripY, 'F');
       doc.rect(stripX, stripY + 2, stripW, stripH - 4, 'F');
       doc.triangle(stripX, stripY + stripH - 2, stripX + stripW, stripY + stripH - 2, stripX + (stripW/2), stripY + stripH, 'F');
   
       // Icons
       doc.setTextColor(...cozyBlue);
       doc.setFontSize(7);
       doc.text("H", stripX + 4, stripY + 8, { align: "center" });
       doc.text("P", stripX + 4, stripY + 16, { align: "center" });
       doc.text("M", stripX + 4, stripY + 24, { align: "center" });
   
       // 5. Address & Contact
       doc.setTextColor(...white);
       doc.setFontSize(9);
       doc.setFont("helvetica", "normal");
       
       const textX = stripX + stripW + 5; 
       const fullAddress = settings?.address || "8-A, N/H., Opp. LIOLI CERAMIC, At. Juna Sadulka, Morbi-363642 (Guj.)";
       const addrLines = doc.splitTextToSize(fullAddress, 70);
       
       let currentTextY = 12;
       doc.text(addrLines, textX, currentTextY);
       currentTextY += (addrLines.length * 5);
       doc.text(`Mo. +91 ${settings?.phone || "95583 96106"}`, textX, currentTextY);
       currentTextY += 5;
       doc.text(`E-mail - ${settings?.companyEmail || "cozysw2018@gmail.com"}`, textX, currentTextY);
   
       // 6. Right Logo Box - REMOVED
       // Reset
       doc.setTextColor(...black);
       doc.setDrawColor(0);
       doc.setLineWidth(0.1);
    };

    const drawInfoGrid = (pageY) => {
      let y = pageY;
      
      // Title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Tax Invoice", pageWidth / 2, y + 8, { align: "center" });
      y += 10;

      // Row 1: PAN/GSTIN
      const row1H = 12;
      doc.rect(margin, y, contentWidth, row1H);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");

      // PAN: Use setting or extract from GSTIN (chars 3-12)
      const panCode = settings?.pan || 
        (settings?.vatNo && settings.vatNo.length >= 12 
          ? settings.vatNo.substring(2, 12) 
          : (settings?.vatNo || "N/A"));
        
      doc.text(`PAN No.         : ${panCode}`, margin + 2, y + 4);
      doc.text(`GSTIN No.       : ${settings?.vatNo || "N/A"}`, margin + 2, y + 9);
      
      doc.text("ORIGINAL FOR RECIPIENT", pageWidth - margin - 2, y + 4, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text("Tax Payable On Reverse Charges : NO", pageWidth - margin - 2, y + 9, { align: "right" });
      y += row1H;

      // Row 2: Buyer/Invoice
      const row2H = 28;
      doc.rect(margin, y, contentWidth, row2H);
      const midLineX = pageWidth / 2 + 15;
      doc.line(midLineX, y, midLineX, y + row2H);

      // Left
      doc.setFont("helvetica", "bold");
      doc.text("Details of Receiver (Buyer Detail)", margin + 2, y + 4);
      doc.setFont("helvetica", "bold"); 
      doc.text(fullSale.CustomerName || "Customer Name", margin + 2, y + 9);
      doc.setFont("helvetica", "normal");
      doc.text("Address: " + (fullSale.CustomerAddress || "Pending Address Join"), margin + 2, y + 13);
      doc.text(`Place of Supply : ${fullSale.State || "-"}`, margin + 2, y + 17);
      doc.text(`PAN No. : ${fullSale.CustomerPAN || "-"}`, margin + 2, y + 21);
      doc.text(`GSTIN   : ${fullSale.CustomerGSTIN || "-"}`, margin + 2, y + 25);

      // Right
      const rightRowH = row2H / 2;
      doc.line(midLineX, y + rightRowH, pageWidth - margin, y + rightRowH);
      doc.setFontSize(9);
      doc.text("INVOICE NO.", midLineX + 2, y + 5);
      doc.setFont("helvetica", "bold");
      const vNo = fullSale.VNo || fullSale.InvoiceNo || "";
      const displayVNo = vNo.toString().startsWith("GSTIN/") ? vNo : `GSTIN/${vNo}`;
      doc.text(`: ${displayVNo}`, midLineX + 35, y + 5);
      doc.setFont("helvetica", "normal");
      doc.text("INVOICE DATE", midLineX + 2, y + rightRowH + 5);
      doc.setFont("helvetica", "bold");
      doc.text(`: ${new Date(fullSale.Date).toLocaleDateString()}`, midLineX + 35, y + rightRowH + 5);
      
      y += row2H;

      // Row 3: Consignee/Transport
      const row3H = 25;
      doc.rect(margin, y, contentWidth, row3H);
      doc.line(midLineX, y, midLineX, y + row3H);

      // Left
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Details of Consignee (Shipped Detail)", margin + 2, y + 4);
      doc.setFont("helvetica", "normal");
      doc.text(fullSale.CustomerName || "Same as Buyer", margin + 2, y + 9);
      doc.text("Address Line 1...", margin + 2, y + 13);
      
      // Right
      doc.setFont("helvetica", "bold");
      doc.text("Transport Details", midLineX + 2, y + 4);
    };

    const drawFooter = (pageNum, totalPages) => {
        const startY = footerStartY;
        const boxH = footerH;
        
        // 1. TOTAL ROW (Above Footer Box)
        // Fixed height bar
        const totalRowH = 8;
        const totalRowY = startY - totalRowH; 
        
        doc.setFillColor(...white);
        doc.setDrawColor(...black);
        doc.rect(margin, totalRowY, contentWidth, totalRowH);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...black);
        
        // Align "TOTAL" label to before QTY column (approx X=115-120)
        doc.text("TOTAL", margin + 115, totalRowY + 5, { align: 'right' });
        
        // Total Qty - Align with QTY Column (Ends at margin + 132)
        const totalQty = fullSale.TotalQuantity || saleDetails.reduce((a,b)=>a+(b.quantity||0),0);
        doc.text(`${totalQty}`, margin + 130, totalRowY + 5, { align: 'right' });
        
        // Total Amount - Align with Amount Column (Ends at pageWidth - margin)
        doc.text(parseFloat(fullSale.GrandTotal).toFixed(2), pageWidth - margin - 2, totalRowY + 5, { align: 'right' });


        // 2. MAIN FOOTER BOX
        drawBox(margin, startY, contentWidth, boxH);
        
        // Dividers
        const dividerX = pageWidth - margin - 60; // 60mm wide right box
        doc.line(dividerX, startY, dividerX, startY + boxH);
        
        // --- LEFT SECTION ---
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("REMARKS:", margin + 2, startY + 5);
        
        const wordsY = startY + 12;
        doc.line(margin, wordsY, dividerX, wordsY);
        doc.text("Rupees In Words:", margin + 2, wordsY + 4);
        doc.setFont("helvetica", "bold");
        doc.text(`INR ${parseFloat(fullSale.GrandTotal).toFixed(0)} Only`, margin + 35, wordsY + 4);
        
        const bankY = wordsY + 8;
        doc.line(margin, bankY, dividerX, bankY);
        doc.setFont("helvetica", "bold");
        doc.text("Bank Details", margin + 2, bankY + 4);
        doc.setFont("helvetica", "normal");
        
        const bankLabelX = margin + 2;
        const bankValX = margin + 25;
        const bankLineH = 4;
        
        doc.text("Bank Name", bankLabelX, bankY + 9);
        doc.text(`: ${settings?.bankName || "HDFC BANK"}`, bankValX, bankY + 9);
        doc.text("Account No", bankLabelX, bankY + 9 + bankLineH);
        doc.text(`: ${settings?.accNo || "502000..."}`, bankValX, bankY + 9 + bankLineH);
        doc.text("IFSC Code", bankLabelX, bankY + 9 + (bankLineH*2));
        doc.text(`: ${settings?.ifsc || "HDFC000..."}`, bankValX, bankY + 9 + (bankLineH*2));

        const termsY = bankY + 24; 
        
        // Draw terms line ONLY on left side
        doc.line(margin, termsY, dividerX, termsY); // Stop at divider
        
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("TERMS & CONDITIONS:", margin + 2, termsY + 4);
        doc.setFont("helvetica", "normal");
        doc.text("1) Goods once sold will not be taken back.", margin + 2, termsY + 8);
        doc.text("2) Subject to Mumbai Jurisdiction.", margin + 2, termsY + 12);
        doc.text("3) Interest @ 18% p.a. will be charged if delayed.", margin + 2, termsY + 16);

        // --- RIGHT SECTION (Calculations) ---
        let calcY = startY;
        const rEnd = pageWidth - margin - 2;
        const calcLabelX = dividerX + 2;
        const rowStep = 6;
        
        const drawCalcRow = (label, value, isBold=false) => {
             if(isBold) doc.setFont("helvetica", "bold");
             else doc.setFont("helvetica", "normal");
             doc.text(label, calcLabelX, calcY + 4);
             doc.text(value, rEnd, calcY + 4, { align: 'right' });
             doc.line(dividerX, calcY + rowStep, pageWidth - margin, calcY + rowStep);
             calcY += rowStep;
        };
        
        doc.setFontSize(9);
        drawCalcRow("Basic Amount", parseFloat(fullSale.NetTotal || 0).toFixed(2));
        drawCalcRow("CGST", (parseFloat(fullSale.TotalTax || 0) / 2).toFixed(2));
        drawCalcRow("SGST", (parseFloat(fullSale.TotalTax || 0) / 2).toFixed(2));
        drawCalcRow("Freight", parseFloat(fullSale.ShippingCost || 0).toFixed(2));
        drawCalcRow("Discount", parseFloat(fullSale.TotalDiscount || 0).toFixed(2));
        drawCalcRow("Round Off", "0.00");

        // Grand Total Box (Bottom Right)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Grand Total", dividerX + 2, startY + boxH - 6);
        doc.text(parseFloat(fullSale.GrandTotal).toFixed(2), rEnd, startY + boxH - 6, { align: 'right' });

        // Signatory
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("For, " + (settings?.companyName || "Cozy"), pageWidth - margin - 2, startY + boxH + 8, { align: 'right' });
        doc.text("[Authorised Signatory]", pageWidth - margin - 2, startY + boxH + 16, { align: 'right' });
        
        // Page Number
        doc.setFontSize(8);
        doc.text(`${pageNum}/${totalPages}`, margin, pageHeight - 5);
    };

    // --- MAIN GENERATION LOOP ---
    const itemsPerPage = 10;
    const itemsCount = saleDetails.length;
    
    // Create chunks
    const chunks = [];
    if (itemsCount === 0) {
        chunks.push([]);
    } else {
        for (let i = 0; i < itemsCount; i += itemsPerPage) {
            chunks.push(saleDetails.slice(i, i + itemsPerPage));
        }
    }
    
    const totalPages = chunks.length;

    chunks.forEach((chunk, pageIndex) => {
        if (pageIndex > 0) {
            doc.addPage();
        }

        const pageNum = pageIndex + 1;
        
        // 1. Header
        drawHeader();
        
        // 2. Info Grid (Y=40)
        drawInfoGrid(40);

        // 3. Table
        // Need to pad chunk to 10 items
        const paddedChunk = [...chunk];
        while (paddedChunk.length < itemsPerPage) {
            paddedChunk.push({}); 
        }

        const tableBody = paddedChunk.map((item, index) => {
            const globalIndex = (pageIndex * itemsPerPage) + index + 1;
            const isPadding = !item.id && !item.productId && !item.ProductName; 

            if (isPadding) {
                return ["", "", "", "","", "", "", "", ""]; 
            }

            return [
                globalIndex,
                item.hsnCode || item.HSNCode || "",
                item.productName || item.ProductName,
                item.colour || item.Colour || "White",
                item.grade || item.Grade || "Sup",
                item.quantity || item.Quantity || 0,
                item.unitName || item.UnitName || "Nos",
                parseFloat(item.unitPrice || item.UnitPrice || 0).toFixed(2),
                parseFloat(item.total || item.Total || 0).toFixed(2)
            ];
        });

        doc.autoTable({
            startY: tableStartY, 
            head: [["Sr\nNo", "HSN Code", "Description of Goods", "Colour", "Grade", "QTY", "Unit", "Rate", "Amount"]],
            body: tableBody,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                valign: 'middle',
                textColor: 0,
                minCellHeight: 6 
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 60, halign: 'left' },
                3: { cellWidth: 15, halign: 'center' },
                4: { cellWidth: 15, halign: 'center' },
                5: { cellWidth: 12, halign: 'right' },
                6: { cellWidth: 12, halign: 'center' },
                7: { cellWidth: 18, halign: 'right' },
                8: { cellWidth: 24, halign: 'right' }
            },
            margin: { left: margin, right: margin }
        });

        // 4. Footer (Fixed Bottom)
        drawFooter(pageNum, totalPages);
    });

    doc.save(`Invoice_${fullSale.VNo || fullSale.id}.pdf`);
    toast.dismiss(toastId);
    toast.success("PDF Generated");

  } catch (error) {
    console.error(error);
    toast.dismiss();
    toast.error("Failed to generate PDF");
  }
};
