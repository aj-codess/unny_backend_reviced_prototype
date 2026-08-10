import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { config } from '../config/env.js';
import { putObjectBuffer } from '../config/s3.js';
import { logger } from '../utils/logger.js';

/**
 * Generates a .docx certificate of approval for a project and uploads it
 * to object storage. Returns the S3 key, or null if S3 isn't configured
 * (kept non-fatal so approving a project never fails because of this).
 */
export const generateApprovalCertificate = async ({
  projectId,
  studentName,
  projectTitle,
  department,
  academicYear,
  supervisorName,
}) => {
  if (!config.aws.bucket) {
    logger.warn('AWS_S3_BUCKET not configured — skipping certificate generation');
    return null;
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Certificate of Project Approval', bold: true, size: 36 })],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'This certifies that', size: 24 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: studentName, bold: true, size: 28 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `has successfully had the final year project titled "${projectTitle}" approved on Unny.`,
                size: 24,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: `Department: ${department}`, size: 22 }),
          new Paragraph({ text: `Academic Year: ${academicYear}`, size: 22 }),
          new Paragraph({ text: `Supervisor: ${supervisorName || 'N/A'}`, size: 22 }),
          new Paragraph({ text: `Issued: ${new Date().toDateString()}`, size: 22 }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const key = `certificates/${projectId}-${Date.now()}.docx`;

  await putObjectBuffer(
    key,
    buffer,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );

  return key;
};
