import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

export interface InvoiceLineItem {
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  billTo: { name: string; email?: string };
  from: { name: string; email?: string };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

function formatCurrency(amount: number, _currency: string): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  brand: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#3730A3',
  },
  invoiceTitle: {
    fontSize: 28,
    color: '#94A3B8',
  },
  metaBlock: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  metaText: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  partyBlock: {
    width: '45%',
  },
  partyLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  partyEmail: {
    fontSize: 10,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  colDescription: { width: '50%' },
  colHrs: { width: '15%', textAlign: 'right' },
  colRate: { width: '15%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },
  summaryBlock: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    width: 200,
  },
  summaryLabel: {
    width: 100,
    textAlign: 'right',
    color: '#64748B',
    marginRight: 12,
  },
  summaryValue: {
    width: 88,
    textAlign: 'right',
  },
  totalLabel: {
    width: 100,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    color: '#3730A3',
    marginRight: 12,
    fontSize: 13,
  },
  totalValue: {
    width: 88,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    color: '#3730A3',
    fontSize: 13,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerText: {
    fontSize: 9,
    color: '#94A3B8',
    marginBottom: 2,
  },
});

function InvoiceDocument({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>ORA</Text>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        <View style={styles.metaBlock}>
          <Text style={styles.metaText}>Invoice: {data.invoiceNumber}</Text>
          <Text style={styles.metaText}>Date: {data.date}</Text>
          <Text style={styles.metaText}>Due: {data.dueDate}</Text>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Bill To</Text>
            <Text style={styles.partyName}>{data.billTo.name}</Text>
            {data.billTo.email && <Text style={styles.partyEmail}>{data.billTo.email}</Text>}
          </View>
          <View style={[styles.partyBlock, { alignItems: 'flex-end' }]}>
            <Text style={styles.partyLabel}>From</Text>
            <Text style={styles.partyName}>{data.from.name}</Text>
            {data.from.email && <Text style={styles.partyEmail}>{data.from.email}</Text>}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colHrs]}>Hrs</Text>
          <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
        </View>

        {data.lineItems.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDescription}>{item.description}</Text>
            <Text style={styles.colHrs}>{item.hours}</Text>
            <Text style={styles.colRate}>{formatCurrency(item.rate, data.currency)}</Text>
            <Text style={styles.colAmount}>{formatCurrency(item.amount, data.currency)}</Text>
          </View>
        ))}

        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.subtotal, data.currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.tax, data.currency)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.total, data.currency)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Payment terms: Net 30</Text>
          <Text style={styles.footerText}>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const doc = <InvoiceDocument data={data} />;
  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}
