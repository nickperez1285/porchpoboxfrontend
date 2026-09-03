export interface DocutainAddress {
  Name1: string;
  Name2: string;
  Name3: string;
  Zipcode: string;
  City: string;
  Street: string;
  Phone: string;
  CustomerId: string;
}

export interface ScanResultData {
  Address: DocutainAddress;
  Date?: string;
  Amount?: string;
  InvoiceId?: string;
  Reference?: string;
  PaymentState?: string;
}

export type RootStackParamList = {
  Home: undefined;
  Results: {scanData: ScanResultData; rawText: string};
};
