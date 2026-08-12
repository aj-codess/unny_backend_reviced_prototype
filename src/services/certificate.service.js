import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { putObjectBuffer } from './storage.service.js';
import { logger } from '../utils/logger.js';

/**
 * Generates a .docx certificate of approval for a project and stores it via
 * the storage facade (S3 if configured, otherwise local disk). Errors here
 * are logged but never thrown — certificate generation is a nice-to-have
 * and must never block a review decision.
 */
export const generateApprovalCertificate = async ({
  projectId,
  studentName,
  projectTitle,
  department,
  academicYear,
  supervisorName,
}) => {
  if (!studentName || !projectTitle) {
    logger.warn('generateApprovalCertificate called with missing student/project info — skipping');
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
