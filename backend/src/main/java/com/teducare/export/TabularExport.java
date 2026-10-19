package com.teducare.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

/**
 * Turns one plain (headers, rows-of-strings) shape into any of the three
 * formats a tabular export can be requested in. Deliberately generic — any
 * module wanting more than a bare CSV just needs to hand over its data in
 * this one shape rather than writing its own XLSX/PDF code.
 */
public final class TabularExport {

    private TabularExport() {
    }

    public static byte[] write(ExportFormat format, List<String> headers, List<List<String>> rows) {
        return switch (format) {
            case CSV -> toCsv(headers, rows).getBytes(StandardCharsets.UTF_8);
            case XLSX -> toXlsx(headers, rows);
            case PDF -> toPdf(headers, rows);
        };
    }

    private static String toCsv(List<String> headers, List<List<String>> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append(csvLine(headers));
        for (List<String> row : rows) {
            sb.append(csvLine(row));
        }
        return sb.toString();
    }

    private static String csvLine(List<String> cells) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            String cell = cells.get(i) == null ? "" : cells.get(i);
            sb.append('"').append(cell.replace("\"", "\"\"")).append('"');
        }
        sb.append('\n');
        return sb.toString();
    }

    private static byte[] toXlsx(List<String> headers, List<List<String>> rows) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Export");

            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(boldFont);

            Row headerRow = sheet.createRow(0);
            for (int c = 0; c < headers.size(); c++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(c);
                cell.setCellValue(headers.get(c));
                cell.setCellStyle(headerStyle);
            }

            for (int r = 0; r < rows.size(); r++) {
                Row row = sheet.createRow(r + 1);
                List<String> values = rows.get(r);
                for (int c = 0; c < values.size(); c++) {
                    row.createCell(c).setCellValue(values.get(c) == null ? "" : values.get(c));
                }
            }

            for (int c = 0; c < headers.size(); c++) {
                sheet.autoSizeColumn(c);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    private static byte[] toPdf(List<String> headers, List<List<String>> rows) {
        Document document = new Document(headers.size() > 5 ? PageSize.A4.rotate() : PageSize.A4, 24, 24, 24, 24);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            com.lowagie.text.Font titleFont =
                    new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 14, com.lowagie.text.Font.BOLD);
            document.add(new Paragraph("Export", titleFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(headers.size());
            table.setWidthPercentage(100);

            com.lowagie.text.Font headerFont =
                    new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 10, com.lowagie.text.Font.BOLD);
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setHorizontalAlignment(Element.ALIGN_LEFT);
                cell.setPadding(5);
                table.addCell(cell);
            }

            com.lowagie.text.Font cellFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 9);
            for (List<String> row : rows) {
                for (String value : row) {
                    PdfPCell cell = new PdfPCell(new Phrase(value == null ? "" : value, cellFont));
                    cell.setPadding(4);
                    table.addCell(cell);
                }
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException ex) {
            throw new RuntimeException("Failed to generate PDF export.", ex);
        }
    }
}
