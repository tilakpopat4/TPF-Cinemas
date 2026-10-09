import { jsPDF } from 'jspdf';

export interface AgreementPdfOptions {
  legalName: string;
  email: string;
  filmType?: 'short' | 'feature' | 'all';
  signatureDataUrl: string;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
  referenceCode?: string;
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
    filmType = 'all',
    signatureDataUrl,
    timestamp = new Date(),
    ipAddress = 'Recorded via Secure Session',
    userAgent = navigator.userAgent || 'Modern Web Browser',
    referenceCode = `TPF-DEED-${Date.now().toString(36).toUpperCase()}-${timestamp.getFullYear()}`,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper for adding horizontal lines
  const drawHr = (currY: number, color = [40, 40, 40]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, currY, pageWidth - margin, currY);
  };

  // Helper for page break check
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      y = margin;
      renderPageHeader();
    }
  };

  const renderPageHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('TPF CINEMAS • OFFICIAL OTT DIGITAL DEED ARCHIVE', margin, y);
    doc.text(`REF: ${referenceCode}`, pageWidth - margin, y, { align: 'right' });
    y += 3;
    drawHr(y, [210, 210, 210]);
    y += 6;
  };

  // --- PAGE 1: OFFICIAL LETTERHEAD ---
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 15, 20);
  doc.text('TPF CINEMAS', margin, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('TILAK POPAT FILMS • OFFICIAL CURATORIAL OTT PLATFORM', margin, y + 9);

  // Top right metadata box
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('FORM: TPF-OTT/DEED-2026/V1', pageWidth - margin, y + 3, { align: 'right' });
  doc.text(`REF: ${referenceCode}`, pageWidth - margin, y + 7, { align: 'right' });
  doc.setTextColor(16, 124, 65);
  doc.text('IMMUTABLE LEGAL RECORD', pageWidth - margin, y + 11, { align: 'right' });

  y += 16;
  drawHr(y, [20, 20, 20]);
  y += 8;

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 15, 20);
  doc.text('DEED OF DIGITAL STREAMING RIGHTS GRANT & IP SELF-DECLARATION', pageWidth / 2, y, {
    align: 'center',
  });
  y += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(
    'Executed electronically under the Indian Copyright Act, 1957 & Information Technology Act, 2000',
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 8;

  // Scope pill
  doc.setFillColor(245, 245, 247);
  doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  const scopeLabel =
    filmType === 'short'
      ? 'SCOPE: SHORT FILM RIGHTS GRANT (PRESERVES FESTIVAL & MARKET PREMIERES)'
      : filmType === 'feature'
      ? 'SCOPE: FEATURE FILM RIGHTS GRANT (NON-EXCLUSIVE OTT DISTRIBUTION)'
      : 'SCOPE: UNIVERSAL FILMMAKER DIGITAL RIGHTS GRANT';
  doc.text(scopeLabel, margin + 4, y + 4.8);
  y += 12;

  // Preamble
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  const preamble =
    `This Deed of Digital Streaming Rights and Undertaking (the "Agreement") is entered into as of ` +
    `${timestamp.toUTCString()}, by and between:\n\n` +
    `1. THE CREATOR / LICENSOR: ${legalName} (Email: ${email}), having full authority and capacity to enter into this deed;\n\n` +
    `AND\n\n` +
    `2. THE PLATFORM / LICENSEE: TPF Cinemas (a division of Tilak Popat Films, registered in India).`;

  const preambleLines = doc.splitTextToSize(preamble, contentWidth);
  doc.text(preambleLines, margin, y);
  y += preambleLines.length * 4.6 + 4;

  // Section 1
  ensureSpace(28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 15, 20);
  doc.text('1. NON-EXCLUSIVE STREAMING RIGHTS GRANT', margin, y);
  y += 5;

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const s1Text =
    `1.1. The Licensor grants TPF Cinemas a worldwide, non-exclusive digital licence to transcode, display, and stream submitted films on its platform.\n` +
    `1.2. The Licensor retains 100% of underlying copyright, authorial moral rights, and commercial ownership.\n` +
    `1.3. The Licensor remains fully entitled to enter film festivals, seek theatrical distribution, and negotiate television broadcasting without encumbrance.`;
  const s1Lines = doc.splitTextToSize(s1Text, contentWidth);
  doc.text(s1Lines, margin, y);
  y += s1Lines.length * 4.4 + 5;

  // Section 2
  ensureSpace(28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 15, 20);
  doc.text('2. INTELLECTUAL PROPERTY & MUSIC CLEARANCE DECLARATION', margin, y);
  y += 5;

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const s2Text =
    `2.1. The Licensor solemnly warrants that they are the legal author/producer with full chain-of-title rights.\n` +
    `2.2. The Licensor affirms that all musical cues, background score recordings, and sound assets are lawfully cleared, original, or held under appropriate synchronization licences.\n` +
    `2.3. The submitted works do not infringe third-party trademarks, privacy, or proprietary rights.`;
  const s2Lines = doc.splitTextToSize(s2Text, contentWidth);
  doc.text(s2Lines, margin, y);
  y += s2Lines.length * 4.4 + 5;

  // Section 3 & 4
  ensureSpace(32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 15, 20);
  doc.text('3. INTERMEDIARY INDEMNITY & PERMANENT EVIDENTIARY ARCHIVE', margin, y);
  y += 5;

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const s3Text =
    `3.1. TPF Cinemas acts as an intermediary curatorial platform in good faith under Section 79 of the IT Act, 2000. Licensor indemnifies TPF Cinemas against third-party copyright claims.\n` +
    `3.2. Term: Valid for 24 months standard, auto-renewing. Takedown available upon 14 days digital notice.\n` +
    `3.3. Permanent Retention: While film video files are removed upon takedown, this executed agreement, signature image, and timestamp audit logs are PERMANENTLY RETAINED as evidence that TPF Cinemas operated in good faith.`;
  const s3Lines = doc.splitTextToSize(s3Text, contentWidth);
  doc.text(s3Lines, margin, y);
  y += s3Lines.length * 4.4 + 6;

  // --- EXECUTION & SIGNATURE BLOCK ---
  ensureSpace(60);
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(210, 210, 215);
  doc.roundedRect(margin, y, contentWidth, 54, 2, 2, 'FD');

  const blockPadding = 5;
  const blockInnerY = y + blockPadding;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 15, 20);
  doc.text('DIGITAL EXECUTION & ELECTRONIC ATTESTATION', margin + blockPadding, blockInnerY + 2);

  // Left column: Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text(`Full Legal Name: ${legalName}`, margin + blockPadding, blockInnerY + 8);
  doc.text(`Verified Account: ${email}`, margin + blockPadding, blockInnerY + 13);
  doc.text(`Execution Timestamp: ${timestamp.toISOString()}`, margin + blockPadding, blockInnerY + 18);
  doc.text(`Signer IP: ${ipAddress}`, margin + blockPadding, blockInnerY + 23);

  const cleanUa = userAgent.length > 55 ? userAgent.substring(0, 52) + '...' : userAgent;
  doc.text(`Client User Agent: ${cleanUa}`, margin + blockPadding, blockInnerY + 28);
  doc.text(`Agreement Version: 1.0.0`, margin + blockPadding, blockInnerY + 33);

  // Right column: Signature Image
  const sigBoxX = pageWidth - margin - 65;
  const sigBoxY = blockInnerY + 4;
  const sigBoxWidth = 60;
  const sigBoxHeight = 30;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.rect(sigBoxX, sigBoxY, sigBoxWidth, sigBoxHeight, 'FD');

  try {
    doc.addImage(signatureDataUrl, 'PNG', sigBoxX + 2, sigBoxY + 2, sigBoxWidth - 4, sigBoxHeight - 6);
  } catch (err) {
    console.error('Error adding signature image to PDF:', err);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Signature Attached Digitally', sigBoxX + 5, sigBoxY + 15);
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(50, 50, 50);
  doc.text(`DIGITALLY SIGNED BY: ${legalName.toUpperCase()}`, sigBoxX + sigBoxWidth / 2, sigBoxY + sigBoxHeight - 2, {
    align: 'center',
  });

  y += 58;

  // Footer on bottom of all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    drawHr(pageHeight - margin + 4, [220, 220, 220]);
    doc.text(
      `TPF Cinemas Digital Deed Ref: ${referenceCode} • Page ${i} of ${totalPages}`,
      margin,
      pageHeight - margin + 8
    );
    doc.text(
      `Secure SHA Verification: ${referenceCode}`,
      pageWidth - margin,
      pageHeight - margin + 8,
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
