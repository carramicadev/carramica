import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  ImageRun,
} from "docx";

async function generateInvoiceDocx({ item, allProduct, logoBase64 }) {
  const sections = [];

  item.forEach((itm) => {
    // Header with logo + invoice title
    const header = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: logoBase64,
                      transformation: { width: 150, height: 50 },
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: "Invoice",
                      bold: true,
                      size: 32,
                      color: "336699",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    // Reference + Date block
    const infoBlock = new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph("Reference"),
                new Paragraph("Date"),
                new Paragraph("Due Date"),
                new Paragraph("Status Invoice"),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph(String(itm.invoice_id)),
                new Paragraph(String(itm.createdAt)),
                new Paragraph(String(itm.dueDate)),
                new Paragraph(String(itm.paymentStatus)),
              ],
            }),
          ],
        }),
      ],
    });

    // Product Table
    const productRows = allProduct.map(
      (prod) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(prod.nama)] }),
            new TableCell({ children: [new Paragraph(String(prod.quantity))] }),
            new TableCell({ children: [new Paragraph(String(prod.price))] }),
            new TableCell({
              children: [new Paragraph(String(prod.discount ?? ""))],
            }),
            new TableCell({ children: [new Paragraph(String(prod.amount))] }),
          ],
        })
    );

    const productTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("Product")] }),
            new TableCell({ children: [new Paragraph("Qty")] }),
            new TableCell({ children: [new Paragraph("Price")] }),
            new TableCell({ children: [new Paragraph("Disc")] }),
            new TableCell({ children: [new Paragraph("Amount")] }),
          ],
        }),
        ...productRows,
      ],
    });

    // Notes
    const notes = new Paragraph({
      children: [
        new TextRun({ text: "Notes", bold: true }),
        new TextRun("\n" + (itm.notes ?? "__")),
      ],
    });

    sections.push({
      children: [
        header,
        new Paragraph(" "),
        infoBlock,
        new Paragraph(" "),
        productTable,
        new Paragraph(" "),
        notes,
      ],
    });
  });

  const doc = new Document({ sections });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "invoice.docx");
}

export default generateInvoiceDocx;
