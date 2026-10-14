import * as Print from "expo-print";
import { getDB } from "../db/database";

export const handleGeneratePDF = async (quotationId: number) => {
  try {
    const db = await getDB();

    // obtener datos completos del presupuesto y cliente
    const quotation: any = await db.getFirstAsync(
      `SELECT q.*, c.name AS client_name, c.doc_type, c.doc_id AS client_document, c.address AS client_address, c.phone AS client_phone
       FROM quotations q
       JOIN clients c ON q.client_id = c.id
       WHERE q.id = ?;`,
      [quotationId],
    );

    if (!quotation) return;

    // obtener los ítems del presupuesto
    const details: any[] = await db.getAllAsync(
      `SELECT d.*, c.name AS catalog_name
       FROM quotation_details d
       JOIN catalog c ON d.catalog_id = c.id
       WHERE d.quotation_id = ?;`,
      [quotationId],
    );

    // obtener datos de la empresa
    const company: any = await db.getFirstAsync(
      "SELECT * FROM company_settings LIMIT 1;",
    );

    // convierte cualquier numero a decimales manejables
    const formatMoney = (val: number) => (val ?? 0).toFixed(2);

    // plantilla HTML
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Helvetica', Arial, sans-serif; padding: 30px; color: #1E293B; background-color: #FFFFFF; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563EB; padding-bottom: 15px; margin-bottom: 25px; }
            .company-name { font-size: 20px; font-weight: bold; color: #0F172A; }
            .doc-title { font-size: 26px; font-weight: bold; color: #2563EB; text-align: right; }
            .doc-info { font-size: 13px; color: #475569; text-align: right; margin-top: 4px; }
            .section-title { font-size: 14px; font-weight: bold; color: #1E293B; margin-bottom: 6px; text-transform: uppercase; }
            .client-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            th, td { border: 1px solid #CBD5E1; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #F1F5F9; color: #0F172A; font-weight: bold; }
            .text-right { text-align: right; }
            .totals-container { width: 280px; float: right; margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #475569; }
            .grand-total { font-size: 16px; font-weight: bold; color: #2563EB; border-top: 2px solid #2563EB; padding-top: 8px; margin-top: 4px; }
            .notes { margin-top: 60px; border-top: 1px dashed #CBD5E1; padding-top: 15px; font-size: 12px; color: #64748B; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company-name">${company?.name || "Mi Empresa SAC"}</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 4px;">RUC: ${company?.doc_id || "20000000001"}</div>
              <div style="font-size: 12px; color: #64748B;">Tel: ${company?.phone || "999999999"}</div>
            </div>
            <div>
              <div class="doc-title">PRESUPUESTO</div>
              <div class="doc-info"><strong>N°:</strong> ${quotation.code || "COT-0001"}</div>
              <div class="doc-info"><strong>Fecha:</strong> ${quotation.date}</div>
            </div>
          </div>

          <div class="client-box">
            <div class="section-title">Datos del Cliente</div>
            <div><strong>Cliente:</strong> ${quotation.client_name}</div>
            <div><strong>${quotation.doc_type || "DOC"}:</strong> ${quotation.client_document}</div>
            ${quotation.client_address ? `<div><strong>Dirección:</strong> ${quotation.client_address}</div>` : ""}
          </div>

          <table>
            <thead>
              <tr>
                <th>Descripción del Ítem</th>
                <th class="text-right">Cant.</th>
                <th class="text-right">P. Unitario</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${details
                .map(
                  (item) => `
                <tr>
                  <td>${item.catalog_name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">S/ ${formatMoney(item.unit_price)}</td>
                  <td class="text-right">S/ ${formatMoney(item.subtotal_line)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals-container">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>S/ ${formatMoney(quotation.subtotal)}</span>
            </div>
            <div class="total-row">
              <span>IGV (18%):</span>
              <span>S/ ${formatMoney(quotation.tax)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total a Pagar:</span>
              <span>S/ ${formatMoney(quotation.total)}</span>
            </div>
          </div>

          ${
            quotation.notes
              ? `
            <div style="clear: both;"></div>
            <div class="notes">
              <strong>Observaciones / Condiciones:</strong><br/>
              ${quotation.notes}
            </div>
          `
              : ""
          }
        </body>
      </html>
    `;

    //abre el pdf en pantalla
    await Print.printAsync({ html: htmlContent });
  } catch (error) {
    console.log("Error al previsualizar el PDF:", error);
  }
};
