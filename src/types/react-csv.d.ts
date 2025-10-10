declare module "react-csv" {
  import * as React from "react";

  export interface CSVLinkProps {
    data: any[] | object;
    headers?: { label: string; key: string }[];
    filename?: string;
    separator?: string;
    enclosingCharacter?: string;
    uFEFF?: boolean;
    asyncOnClick?: boolean;
    onClick?: (event: any, done: (proceed: boolean) => void) => void;
    target?: string;
    className?: string;
    children?: React.ReactNode;
  }

  export class CSVLink extends React.Component<CSVLinkProps> {}
  export class CSVDownload extends React.Component<CSVLinkProps> {}
}
