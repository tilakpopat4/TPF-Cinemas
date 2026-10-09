import { jsPDF } from 'jspdf';

export interface AgreementPdfOptions {
  legalName: string;
  email: string;
  productionName?: string;
  contactNo?: string;
  filmType?: 'short' | 'feature' | 'all';
  signatureDataUrl: string;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
  referenceCode?: string;
  filmTitle?: string;
}

export interface GeneratedPdfResult {
  blob: Blob;
  dataUrl: string;
  referenceCode: string;
}

export async function generateAgreementPdf(options: AgreementPdfOptions): Promise<GeneratedPdfResult> {
  const {
    legalName,
    email,
    productionName = 'Independent Production',
    contactNo = 'On Record',
    signatureDataUrl,
    timestamp = new Date(),
    referenceCode = `TPF-CONSENT-${Date.now().toString(36).toUpperCase()}-${timestamp.getFullYear()}`,
    filmTitle = 'All titles submitted via TPF Filmmaker Studio',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const formattedDate = timestamp.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const expiryDate = new Date(timestamp);
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);
  const formattedExpiry = expiryDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Helper for adding horizontal lines
  const drawHr = (currY: number, color = [40, 40, 40]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, currY, pageWidth - margin, currY);
  };

  // Helper for page break check
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      y = margin;
      renderPageHeader();
    }
  };

  const renderPageHeader = () => {
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text('TPF CINEMAS • NON-COMMERCIAL STREAMING RIGHTS CONSENT FORM', margin, y);
    doc.text(`REF: ${referenceCode}`, pageWidth - margin, y, { align: 'right' });
    y += 3;
    drawHr(y, [210, 210, 210]);
    y += 6;
  };

  // Top ref line
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('TPF CINEMAS • OFFICIAL CURATORIAL OTT PLATFORM', margin, y + 2);
  doc.text(`REF: ${referenceCode}`, pageWidth - margin, y + 2, { align: 'right' });
  y += 5;
  drawHr(y, [40, 40, 40]);
  y += 9;

  // Title: NON-COMMERCIAL STREAMING RIGHTS CONSENT FORM (16pt bold Times)
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(10, 10, 10);
  doc.text('NON-COMMERCIAL STREAMING RIGHTS CONSENT FORM', pageWidth / 2, y, {
    align: 'center',
  });
  y += 10;

  // Date line
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(`Date: ${formattedDate}`, margin, y);
  y += 9;

  // --- 1. Film Details ---
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('1. Film Details', margin, y);
  y += 6;

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(`Title of Film / Web Series: ${filmTitle}`, margin + 3, y);
  y += 5.5;
  doc.text(`Director / Filmmaker: ${legalName}`, margin + 3, y);
  y += 5.5;
  doc.text(`Production House (if applicable): ${productionName}`, margin + 3, y);
  y += 8.5;

  // --- 2. Consent and Permission ---
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('2. Consent and Permission', margin, y);
  y += 6;

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const consentP1 = 'I, the undersigned, confirm that I am the filmmaker, producer, or authorized rights holder of the above-mentioned audiovisual work.';
  const p1Lines = doc.splitTextToSize(consentP1, contentWidth - 3);
  doc.text(p1Lines, margin + 3, y);
  y += p1Lines.length * 5 + 2;

  const consentP2 = 'I hereby grant Tilak Popat Films permission to stream and showcase this work on TPF Cinemas for non-commercial purposes only.';
  const p2Lines = doc.splitTextToSize(consentP2, contentWidth - 3);
  doc.text(p2Lines, margin + 3, y);
  y += p2Lines.length * 5 + 2;

  const consentP3 = 'This permission is granted free of charge and does not involve any transfer of copyright ownership.';
  const p3Lines = doc.splitTextToSize(consentP3, contentWidth - 3);
  doc.text(p3Lines, margin + 3, y);
  y += p3Lines.length * 5 + 4;

  // --- 3. Terms of Permission ---
  ensureSpace(42);
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('3. Terms of Permission', margin, y);
  y += 6;

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const termsBullets = [
    'The work will be streamed solely for non-commercial purposes.',
    'No payment, royalties, or licensing fees will be charged or paid under this consent.',
    'The work will not be monetized, sold, or commercially exploited without further written permission.',
    'Appropriate filmmaker and production credits will be provided wherever reasonably possible.',
    'All copyright and ownership rights will remain with the original rights holder.',
    'This consent applies only to the streaming and promotional use expressly authorized above.',
  ];

  for (const bullet of termsBullets) {
    const lines = doc.splitTextToSize(`•  ${bullet}`, contentWidth - 5);
    doc.text(lines, margin + 3, y);
    y += lines.length * 4.8 + 1;
  }
  y += 3;

  // --- 4. Permission Duration ---
  ensureSpace(20);
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('4. Permission Duration', margin, y);
  y += 6;

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const durationText = `This consent shall remain valid from ${formattedDate} to ${formattedExpiry}.`;
  doc.text(durationText, margin + 3, y);
  y += 8.5;

  // --- 5. Declaration ---
  ensureSpace(75);
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('5. Declaration', margin, y);
  y += 6;

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const declText = 'I confirm that I have the authority to grant this permission and voluntarily consent to the non-commercial streaming of the above-mentioned work under the terms stated in this document.';
  const declLines = doc.splitTextToSize(declText, contentWidth - 3);
  doc.text(declLines, margin + 3, y);
  y += declLines.length * 5 + 6;

  // Two columns for signatures
  const colWidth = (contentWidth - 8) / 2;
  const col1X = margin;
  const col2X = margin + colWidth + 8;
  const boxHeight = 58;

  // Column 1: Filmmaker / Rights Holder
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.3);
  doc.rect(col1X, y, colWidth, boxHeight);

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('Filmmaker / Rights Holder', col1X + 4, y + 6);
  doc.setLineWidth(0.15);
  doc.line(col1X + 4, y + 8, col1X + colWidth - 4, y + 8);

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Full Name: ${legalName}`, col1X + 4, y + 13);
  doc.text(`Production Name: ${productionName}`, col1X + 4, y + 17.5);
  doc.text('Signature:', col1X + 4, y + 22);

  // Signature image box
  const sigImgWidth = 45;
  const sigImgHeight = 14;
  const sigX = col1X + 4;
  const sigY = y + 24;

  try {
    doc.addImage(signatureDataUrl, 'PNG', sigX, sigY, sigImgWidth, sigImgHeight);
  } catch (err) {
    console.error('Error adding signature image to PDF:', err);
    doc.text('(Digitally Executed)', sigX + 2, sigY + 8);
  }

  doc.text(`Contact No: ${contactNo}`, col1X + 4, y + 43);
  doc.text(`Mail ID: ${email}`, col1X + 4, y + 48.5);
  doc.text(`Date: ${formattedDate}`, col1X + 4, y + 54);

  // Column 2: Person / Platform Receiving Permission
  doc.setLineWidth(0.3);
  doc.rect(col2X, y, colWidth, boxHeight);

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('Person / Platform Receiving Permission', col2X + 4, y + 6);
  doc.setLineWidth(0.15);
  doc.line(col2X + 4, y + 8, col2X + colWidth - 4, y + 8);

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('Full Name: Tilak Popat / TPF Cinemas', col2X + 4, y + 13);
  doc.text('Platform: Tilak Popat Films (TPF Cinemas)', col2X + 4, y + 17.5);
  doc.text('Signature:', col2X + 4, y + 22);

  // Stamp box
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('TILAK POPAT FILMS', col2X + 6, y + 30);
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(40, 120, 60);
  doc.text('Curator Verified & Digitally Attested', col2X + 6, y + 35);
  doc.setTextColor(20, 20, 20);

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('Contact Information: curators@tilakpopatfilms.com', col2X + 4, y + 43);
  doc.text(`Date: ${formattedDate}`, col2X + 4, y + 54);

  // Bottom footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    drawHr(pageHeight - margin + 6, [210, 210, 210]);
    doc.text(
      `TPF Cinemas Non-Commercial Streaming Rights Consent Ref: ${referenceCode} • Page ${i} of ${totalPages}`,
      margin,
      pageHeight - margin + 10
    );
    doc.text(
      `Indian Information Technology Act, 2000 Attestation`,
      pageWidth - margin,
      pageHeight - margin + 10,
      { align: 'right' }
    );
  }

  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');

  return {
    blob,
    dataUrl,
    referenceCode,
  };
}
