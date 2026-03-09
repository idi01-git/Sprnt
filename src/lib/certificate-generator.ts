interface CertificateData {
  studentName: string;
  collegeName?: string;
  branch?: string;
  courseName: string;
  grade: string;
  issueDate: string;
  certificateId: string;
}

export async function generateCertificateSVG(data: CertificateData): Promise<string> {
  const gradeColors: Record<string, string> = {
    'Distinction': '#10b981',
    'First Class': '#3b82f6',
    'Pass': '#f59e0b',
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
  </defs>
  
  <rect width="800" height="600" fill="url(#bg)"/>
  
  <rect x="100" y="50" width="600" height="500" rx="20" fill="white" filter="drop-shadow(0 25px 50px rgba(0,0,0,0.25))"/>
  
  <text x="400" y="120" text-anchor="middle" font-family="system-ui, sans-serif" font-size="42" font-weight="bold" fill="#1f2937">
    Certificate of Completion
  </text>
  
  <text x="400" y="180" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#6b7280">
    This is to certify that
  </text>
  
  <text x="400" y="230" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" fill="#9333ea">
    ${escapeXml(data.studentName)}
  </text>
  
  <text x="400" y="280" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#6b7280">
    has successfully completed
  </text>
  
  <text x="400" y="320" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="#1f2937">
    ${escapeXml(data.courseName)}
  </text>
  
  <rect x="250" y="360" width="120" height="60" rx="8" fill="#f3f4f6"/>
  <text x="310" y="382" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#9ca3af">Grade</text>
  <text x="310" y="408" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="${gradeColors[data.grade] || '#6b7280'}">${escapeXml(data.grade)}</text>
  
  <rect x="430" y="360" width="120" height="60" rx="8" fill="#f3f4f6"/>
  <text x="490" y="382" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#9ca3af">Issue Date</text>
  <text x="490" y="408" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#1f2937">${escapeXml(data.issueDate)}</text>
  
  <text x="400" y="520" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#9ca3af">
    Certificate ID: ${escapeXml(data.certificateId)} | sprintern.in/verify
  </text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function generateCertificatePNG(data: CertificateData): Promise<Buffer> {
  const svg = await generateCertificateSVG(data);
  
  try {
    const { Resvg } = require('@resvg/resvg');
    const resvg = new Resvg(svg);
    return resvg.render().asPng();
  } catch {
    return Buffer.from(svg);
  }
}

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const png = await generateCertificatePNG(data);
  
  try {
    const PDFDocument = require('pdfkit');
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      doc.image(png, 0, 0, {
        fit: [doc.page.width, doc.page.height],
        align: 'center',
        valign: 'center',
      });
      
      doc.end();
    });
  } catch {
    return png;
  }
}

export async function generateCertificateBuffer(data: CertificateData, format: 'svg' | 'png' | 'pdf' = 'png'): Promise<Buffer | string> {
  switch (format) {
    case 'svg':
      return generateCertificateSVG(data);
    case 'png':
      return generateCertificatePNG(data);
    case 'pdf':
      return generateCertificatePDF(data);
    default:
      return generateCertificatePNG(data);
  }
}
